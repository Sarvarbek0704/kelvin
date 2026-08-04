import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api, label } from '../../lib/api';
import { formatSom } from '../../lib/money';
import { useCart, useCartMutations } from '../../lib/cart';
import { useDeliveryZones, useDeliveryQuote, useDeliverySlots, useAddresses } from '../../lib/delivery';
import { useAuth } from '../../lib/auth-context';
import {
  Container,
  Button,
  Stepper,
  SpecChip,
  Input,
  Textarea,
  FieldLabel,
  EmptyState,
  IconCart,
  IconClose,
  IconShield,
  IconCheck,
} from '../../components/ui';
import ProductImage from '../../components/ProductImage';
import {
  BasketWrap,
  CheckoutGrid,
  Panel,
  LinesPanel,
  LineRow,
  ZoneChips,
  QuoteNote,
  FormGrid,
  PayOptions,
  Summary,
  SuccessWrap,
  ErrorText,
} from './Basket.styled';

/** So'm matnini raqam + kichik birlikka ajratish (dizayn tipografikasi). */
const somParts = (tiyin) => formatSom(tiyin).replace(/\s*so'm$/, '');

function Basket() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: cart, isLoading } = useCart();
  const { setQuantity, remove, clear } = useCartMutations();

  const lines = cart?.lines ?? [];
  const busy = setQuantity.isPending || remove.isPending;
  const [placing, setPlacing] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);
  const [checkoutErr, setCheckoutErr] = useState(null);
  const [pickedZoneId, setPickedZoneId] = useState('');
  const [payMethod, setPayMethod] = useState('cash');

  // --- Kontakt + manzil + slot + rozilik ------------------------------------
  // contact faqat TAHRIRLARNI saqlaydi — ko'rsatishda profil bilan birlashadi.
  const [contact, setContact] = useState({});
  const [addressChoice, setAddressChoice] = useState(''); // addressId | 'new'
  const [newAddr, setNewAddr] = useState({ city: 'Toshkent', street: '' });
  const [slotDate, setSlotDate] = useState('');
  const [slotId, setSlotId] = useState('');
  const [privacyOk, setPrivacyOk] = useState(true);

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get('/customers/me'),
    enabled: Boolean(user),
  });
  const contactVal = (k, fallback) => contact[k] ?? fallback ?? '';
  const contactName = contactVal('name', profile?.firstName);
  const contactPhone = contactVal('phone', profile?.phone);
  const contactComment = contactVal('comment', '');

  const { data: savedAddresses } = useAddresses(user);
  const defaultAddressId = (savedAddresses ?? []).find((a) => a.isDefault)?.id || savedAddresses?.[0]?.id || '';
  const selectedAddress = addressChoice || defaultAddressId || 'new';

  // Kelasi 7 kun — slot tanlash uchun sanalar (sahifa ochilganda bir marta).
  const [slotDates] = useState(() =>
    Array.from({ length: 7 }, (_, i) =>
      new Date(Date.now() + (i + 1) * 86_400_000).toISOString().slice(0, 10),
    ),
  );

  // --- Yetkazish zonasi + narx (server hisoblaydi) --------------------------
  const { data: zones } = useDeliveryZones();
  const zoneId = pickedZoneId || zones?.[0]?.id || '';
  // ⚠️ Narx hisobi bepul chegara uchun SUBTOTAL bilan (backend ham shunday, §07 §5).
  const { data: quote } = useDeliveryQuote(zoneId, cart?.subtotal);
  const activeZone = (zones ?? []).find((z) => z.id === zoneId);

  const deliveryFee = quote?.fee ?? '0';
  // Yakuniy summa = savat jami (subtotal − chegirma) + yetkazish. Backend AYNAN
  // shu qiymatni snapshot qiladi (checkout javobidagi totalAmount haqiqiy).
  const grandTotal = Number(cart?.totalAmount ?? 0) + Number(deliveryFee);

  const { data: slots } = useDeliverySlots(zoneId, slotDate);

  const checkout = async () => {
    if (!cart?.cartId) return;
    setCheckoutErr(null);

    // --- Mijoz tomonidagi tekshiruvlar --------------------------------------
    if (!privacyOk) {
      setCheckoutErr(t('cart.privacy_required'));
      return;
    }
    const phone = String(contactPhone).trim();
    if (phone && !/^\+998\d{9}$/.test(phone)) {
      setCheckoutErr(t('cart.phone_invalid'));
      return;
    }
    if (selectedAddress === 'new' && !newAddr.street.trim()) {
      setCheckoutErr(t('cart.address_required'));
      return;
    }

    setPlacing(true);
    try {
      // Ism/telefon o'zgargan bo'lsa profilga saqlaymiz (kuryer aloqasi uchun).
      const name = String(contactName).trim();
      if ((name && name !== (profile?.firstName || '')) || (phone && phone !== (profile?.phone || ''))) {
        await api.patch('/customers/me', {
          ...(name && { firstName: name }),
          ...(phone && { phone }),
        });
      }

      // Manzil: mavjudini tanlagan yoki yangisini yaratamiz.
      let addressId = selectedAddress !== 'new' ? selectedAddress : '';
      if (!addressId) {
        const created = await api.post('/addresses', {
          region: 'Toshkent',
          city: newAddr.city.trim() || 'Toshkent',
          street: newAddr.street.trim(),
        });
        addressId = created.id;
      }

      const order = await api.post('/orders/checkout', {
        cartId: cart.cartId,
        ...(zoneId && { deliveryZoneId: zoneId }),
        addressId,
        ...(slotId && { slotId }),
        ...(String(contactComment).trim() && { note: String(contactComment).trim() }),
      });
      // Naqd (yetkazishda to'lov): to'lov niyatini yaratamiz — order PENDING_PAYMENT'ga
      // o'tadi, kuryer pulni olganда xodim tasdiqlaydi (capture). Karta provayderlari
      // (Click/Payme) hali ulanmagan — "tez orada".
      if (payMethod === 'cash') {
        await api.post('/payments', {
          orderId: order.id,
          provider: 'CASH',
          idempotencyKey: crypto.randomUUID(),
        });
      } else if (payMethod === 'online') {
        // ⚠️ Onlayn (DEMO): CLICK to'lovi + MOCK webhook bilan yakunlanadi
        //    (real Click/Payme merchant blokeri — docs/08 §2.5).
        const payment = await api.post('/payments', {
          orderId: order.id,
          provider: 'CLICK',
          idempotencyKey: crypto.randomUUID(),
        });
        await api.post(`/payments/${payment.id}/simulate-webhook`);
      }
      setPlacedOrder({
        ...order,
        payMethod,
        eta: quote ? `${quote.etaDaysMin}–${quote.etaDaysMax} ${t('cart.eta_days')}` : null,
      });
      void clear.mutate(); // savatni tozalash (backend allaqachon iste'mol qildi)
    } catch (e) {
      setCheckoutErr(e?.problem?.detail || e?.message || 'Xatolik');
    } finally {
      setPlacing(false);
    }
  };

  const dec = (line) =>
    setQuantity.mutate({ variantId: line.variantId, quantity: line.quantity - 1 });
  const inc = (line) =>
    setQuantity.mutate({ variantId: line.variantId, quantity: line.quantity + 1 });

  // ---------- Buyurtma qabul qilindi ----------
  if (placedOrder) {
    return (
      <Container>
        <SuccessWrap>
          <div className="icon">
            <IconCheck size={40} />
          </div>
          <h1>{t('cart.success_title')}</h1>
          <div className="lead">{t('cart.success_lead')}</div>
          <div className="muted">
            {placedOrder.payMethod === 'cash' ? t('cart.success_cash') : t('cart.success_online')}
          </div>
          <div className="facts">
            <div>
              <div className="cap">{t('cart.order_number')}</div>
              <div className="val">{placedOrder.number}</div>
            </div>
            <div className="sep" />
            <div>
              <div className="cap">{t('cart.amount')}</div>
              <div className="val">{formatSom(placedOrder.totalAmount)}</div>
            </div>
            {placedOrder.eta && (
              <>
                <div className="sep" />
                <div>
                  <div className="cap">{t('cart.delivery')}</div>
                  <div className="val">{placedOrder.eta}</div>
                </div>
              </>
            )}
          </div>
          <div className="actions">
            <Button type="button" onClick={() => navigate('/orders')}>
              {t('account.my_orders')}
            </Button>
            <Button type="button" $variant="outline" onClick={() => navigate('/catalog')}>
              {t('common.to_catalog')}
            </Button>
          </div>
        </SuccessWrap>
      </Container>
    );
  }

  // ---------- Bo'sh savat ----------
  if (!isLoading && lines.length === 0) {
    return (
      <Container>
        <BasketWrap>
          <h1>{t('cart.title')}</h1>
          <div className="bar" />
          <EmptyState
            icon={<IconCart size={30} />}
            title={t('cart.empty')}
            text={t('cart.empty_text')}
            actionLabel={t('common.to_catalog')}
            onAction={() => navigate('/catalog')}
          />
        </BasketWrap>
      </Container>
    );
  }

  return (
    <Container>
      <BasketWrap>
        <h1>{t('cart.checkout_title')}</h1>
        <div className="bar" />

        <CheckoutGrid>
          <div className="left">
            <LinesPanel>
              {lines.map((line) => (
                <LineRow key={line.variantId}>
                  <div className="photo">
                    <ProductImage
                      image={line.image ? { url: line.image } : null}
                      alt={label(line.name)}
                      sizes="84px"
                      placeholder=""
                    />
                  </div>
                  <div className="info">
                    <div className="name">{label(line.name)}</div>
                    <div className="chips">
                      <SpecChip>{line.sku}</SpecChip>
                    </div>
                  </div>
                  <div className="stepper-slot">
                    <Stepper
                      value={line.quantity}
                      size="sm"
                      disabled={busy}
                      onDec={() => dec(line)}
                      onInc={() => inc(line)}
                    />
                  </div>
                  <div className="price">
                    {somParts(line.unitPrice)} <span className="unit">so'm</span>
                  </div>
                  <button
                    type="button"
                    className="remove"
                    disabled={busy}
                    aria-label={t('cart.remove')}
                    onClick={() => remove.mutate(line.variantId)}
                  >
                    <IconClose size={18} />
                  </button>
                </LineRow>
              ))}
            </LinesPanel>

            <Panel>
              <h2>{t('cart.delivery')}</h2>
              <div className="sub-label">{t('cart.select_zone')}</div>
              <ZoneChips>
                {(zones ?? []).map((z) => (
                  <button
                    key={z.id}
                    type="button"
                    className={z.id === zoneId ? 'active' : ''}
                    onClick={() => setPickedZoneId(z.id)}
                  >
                    {label(z.name)} · {formatSom(z.priceAmount)} · {z.etaDaysMin}–{z.etaDaysMax}{' '}
                    {t('cart.eta_days')}
                  </button>
                ))}
              </ZoneChips>
              {quote && (
                <QuoteNote>
                  {quote.free ? (
                    <span className="free">{t('cart.delivery_free_note')}</span>
                  ) : (
                    `${t('cart.delivery_cost')}: ${formatSom(quote.fee)}`
                  )}{' '}
                  · {quote.etaDaysMin}–{quote.etaDaysMax} {t('cart.eta_days')}
                </QuoteNote>
              )}

              {/* Yetkazish vaqti (ixtiyoriy) — sana → bo'sh slotlar */}
              <div className="sub-label" style={{ marginTop: 18 }}>
                {t('cart.delivery_time')}
              </div>
              <ZoneChips>
                <button
                  type="button"
                  className={slotDate === '' ? 'active' : ''}
                  onClick={() => {
                    setSlotDate('');
                    setSlotId('');
                  }}
                >
                  {t('cart.any_time')}
                </button>
                {slotDates.map((d) => (
                  <button
                    key={d}
                    type="button"
                    className={d === slotDate ? 'active' : ''}
                    onClick={() => {
                      setSlotDate(d);
                      setSlotId('');
                    }}
                  >
                    {d.slice(8)}.{d.slice(5, 7)}
                  </button>
                ))}
              </ZoneChips>
              {slotDate && (
                <ZoneChips>
                  {(slots ?? []).map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className={s.id === slotId ? 'active' : ''}
                      onClick={() => setSlotId(s.id === slotId ? '' : s.id)}
                    >
                      {s.startTime}–{s.endTime}
                    </button>
                  ))}
                  {slots && slots.length === 0 && <QuoteNote>{t('cart.no_slots')}</QuoteNote>}
                </ZoneChips>
              )}
            </Panel>

            <Panel>
              <h2>{t('cart.contacts_address')}</h2>
              <FormGrid>
                <div>
                  <FieldLabel htmlFor="co-name">{t('cart.name')}</FieldLabel>
                  <Input
                    id="co-name"
                    type="text"
                    autoComplete="name"
                    value={contactName}
                    onChange={(e) => setContact((c) => ({ ...c, name: e.target.value }))}
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="co-phone">{t('cart.phone')}</FieldLabel>
                  <Input
                    id="co-phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="+998901234567"
                    value={contactPhone}
                    onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))}
                  />
                </div>

                {/* Manzil: saqlanganlardan tanlash yoki yangisini kiritish */}
                {(savedAddresses ?? []).length > 0 && (
                  <div className="full">
                    <FieldLabel>{t('cart.saved_address')}</FieldLabel>
                    <ZoneChips>
                      {(savedAddresses ?? []).map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          className={selectedAddress === a.id ? 'active' : ''}
                          onClick={() => setAddressChoice(a.id)}
                        >
                          {a.city}, {a.street}
                        </button>
                      ))}
                      <button
                        type="button"
                        className={selectedAddress === 'new' ? 'active' : ''}
                        onClick={() => setAddressChoice('new')}
                      >
                        + {t('cart.new_address')}
                      </button>
                    </ZoneChips>
                  </div>
                )}
                {selectedAddress === 'new' && (
                  <>
                    <div>
                      <FieldLabel htmlFor="co-city">{t('cart.city')}</FieldLabel>
                      <Input
                        id="co-city"
                        type="text"
                        value={newAddr.city}
                        onChange={(e) => setNewAddr((a) => ({ ...a, city: e.target.value }))}
                      />
                    </div>
                    <div>
                      <FieldLabel htmlFor="co-address">{t('cart.address')}</FieldLabel>
                      <Input
                        id="co-address"
                        type="text"
                        autoComplete="street-address"
                        placeholder={t('cart.street_ph')}
                        value={newAddr.street}
                        onChange={(e) => setNewAddr((a) => ({ ...a, street: e.target.value }))}
                      />
                    </div>
                  </>
                )}

                <div className="full">
                  <FieldLabel htmlFor="co-comment">{t('cart.comment')}</FieldLabel>
                  <Textarea
                    id="co-comment"
                    rows={2}
                    placeholder={t('cart.comment_ph')}
                    value={contactComment}
                    onChange={(e) => setContact((c) => ({ ...c, comment: e.target.value }))}
                  />
                </div>
              </FormGrid>
            </Panel>

            <Panel>
              <h2>{t('cart.payment')}</h2>
              {/* To'lov usuli — naqd ISHLAYDI; onlayn CLICK demo (simulate-webhook);
                  Payme hali ulanmagan (adapter skeleti, docs/08 §2.5) → "скоро". */}
              <PayOptions>
                <label className={payMethod === 'cash' ? 'active' : ''}>
                  <input
                    type="radio"
                    name="payMethod"
                    value="cash"
                    checked={payMethod === 'cash'}
                    onChange={() => setPayMethod('cash')}
                    style={{ accentColor: '#B08D57' }}
                  />
                  <span className="pay-name">{t('cart.pay_cash')}</span>
                  <span className="pay-note">{t('cart.pay_courier')}</span>
                </label>
                <label className={payMethod === 'online' ? 'active' : ''}>
                  <input
                    type="radio"
                    name="payMethod"
                    value="online"
                    checked={payMethod === 'online'}
                    onChange={() => setPayMethod('online')}
                    style={{ accentColor: '#B08D57' }}
                  />
                  <span className="pay-name">Click</span>
                  <span className="pay-tag">demo</span>
                </label>
                <label className="disabled">
                  <input type="radio" name="payMethod" value="payme" disabled />
                  <span className="pay-name">Payme</span>
                  <span className="pay-tag">{t('cart.coming_soon')}</span>
                </label>
              </PayOptions>
            </Panel>
          </div>

          <Summary>
            <h2>{t('cart.your_order')}</h2>
            <div className="rows">
              <div className="row">
                <span className="k">
                  {t('cart.items')} ({cart?.itemCount ?? 0})
                </span>
                <span className="v">{formatSom(cart?.subtotal)}</span>
              </div>
              {cart?.discountTotal && cart.discountTotal !== '0' && (
                <div className="row">
                  <span className="k">{t('cart.discount')}</span>
                  <span className="v green">−{formatSom(cart.discountTotal)}</span>
                </div>
              )}
              <div className="row">
                <span className="k">
                  {t('cart.delivery')}
                  {activeZone ? ` · ${label(activeZone.name)}` : ''}
                </span>
                <span className="v">
                  {quote?.free ? t('cart.delivery_free') : formatSom(deliveryFee)}
                </span>
              </div>
            </div>
            <div className="div" />
            <div className="total-row">
              <span className="k">{t('cart.total')}</span>
              <span className="v">
                {somParts(grandTotal * 1)} <span className="unit">so'm</span>
              </span>
            </div>
            {quote && (
              <div className="note">
                {t('cart.delivery')} {quote.etaDaysMin}–{quote.etaDaysMax} {t('cart.eta_days')} ·{' '}
                {payMethod === 'cash' ? t('cart.pay_cash_label') : t('cart.pay_online_label')}
              </div>
            )}

            {user ? (
              <Button type="button" $full disabled={placing || lines.length === 0} onClick={checkout}>
                {t('cart.checkout')}
              </Button>
            ) : (
              <Button type="button" $full onClick={() => navigate('/auth')}>
                {t('cart.login_to_checkout')}
              </Button>
            )}
            {checkoutErr && <ErrorText>{checkoutErr}</ErrorText>}

            <label className="privacy">
              <input
                type="checkbox"
                checked={privacyOk}
                onChange={(e) => setPrivacyOk(e.target.checked)}
                style={{ accentColor: '#B08D57' }}
              />
              <span>{t('cart.privacy')}</span>
            </label>

            <div className="secure">
              <IconShield size={15} />
              {t('cart.secure')}
            </div>
          </Summary>
        </CheckoutGrid>
      </BasketWrap>
    </Container>
  );
}

export default Basket;
