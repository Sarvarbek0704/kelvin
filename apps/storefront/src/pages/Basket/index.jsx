import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { api, label } from '../../lib/api';
import { formatSom } from '../../lib/money';
import { useCart, useCartMutations } from '../../lib/cart';
import { useDeliveryZones, useDeliveryQuote } from '../../lib/delivery';
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

  const checkout = async () => {
    if (!cart?.cartId) return;
    setPlacing(true);
    setCheckoutErr(null);
    try {
      const order = await api.post('/orders/checkout', {
        cartId: cart.cartId,
        ...(zoneId && { deliveryZoneId: zoneId }),
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
            </Panel>

            <Panel>
              <h2>{t('cart.contacts_address')}</h2>
              <FormGrid>
                <div>
                  <FieldLabel htmlFor="co-name">{t('cart.name')}</FieldLabel>
                  <Input id="co-name" type="text" autoComplete="name" />
                </div>
                <div>
                  <FieldLabel htmlFor="co-phone">{t('cart.phone')}</FieldLabel>
                  <Input id="co-phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="+998" />
                </div>
                <div className="full">
                  <FieldLabel htmlFor="co-address">{t('cart.address')}</FieldLabel>
                  <Input id="co-address" type="text" autoComplete="street-address" />
                </div>
                <div className="full">
                  <FieldLabel htmlFor="co-comment">{t('cart.comment')}</FieldLabel>
                  <Textarea id="co-comment" rows={2} placeholder={t('cart.comment_ph')} />
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
              <Button type="button" $full onClick={() => navigate('/account')}>
                {t('cart.login_to_checkout')}
              </Button>
            )}
            {checkoutErr && <ErrorText>{checkoutErr}</ErrorText>}

            <label className="privacy">
              <input type="checkbox" defaultChecked style={{ accentColor: '#B08D57' }} />
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
