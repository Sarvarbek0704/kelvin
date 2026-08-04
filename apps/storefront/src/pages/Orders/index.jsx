import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { formatSom } from '../../lib/money';
import { useAuth } from '../../lib/auth-context';
import {
  Container,
  Button,
  StatusChip,
  EmptyState,
  IconCheck,
  IconTruck,
  IconCart,
} from '../../components/ui';
import { ProfileGrid, ProfileNav } from '../Account/Account.styled';
import {
  OrderList,
  OrderCard,
  Timeline,
  DetailGrid,
  ItemsPanel,
  TotalsPanel,
} from './Orders.styled';

// Holat → chip toni (yorliq i18n'dan: orders.st.<STATUS>)
const STATUS_TONE = {
  DRAFT: 'muted',
  PENDING_PAYMENT: 'warning',
  PAYMENT_FAILED: 'muted',
  PAID: 'success',
  CONFIRMED: 'success',
  PICKING: 'warning',
  PACKED: 'warning',
  SHIPPED: 'warning',
  DELIVERED: 'success',
  COMPLETED: 'success',
  CANCELLED: 'muted',
  RETURNED: 'muted',
  PARTIALLY_RETURNED: 'muted',
};

// Vaqt chizig'i bosqich kalitlari
const TIMELINE_KEYS = ['orders.tl_placed', 'orders.tl_confirmed', 'orders.tl_shipping', 'orders.tl_delivered'];
function doneCount(status) {
  if (['DELIVERED', 'COMPLETED'].includes(status)) return 4;
  if (status === 'SHIPPED') return 2; // "В доставке" joriy
  if (['CONFIRMED', 'PICKING', 'PACKED', 'PAID'].includes(status)) return 2;
  return 1; // oformlen
}
const isCurrentStep = (status, i) =>
  (status === 'SHIPPED' && i === 2) ||
  (['CONFIRMED', 'PICKING', 'PACKED', 'PAID'].includes(status) && i === 1);

function OrderTimeline({ status, t }) {
  if (['CANCELLED', 'RETURNED', 'PARTIALLY_RETURNED', 'DRAFT', 'PENDING_PAYMENT', 'PAYMENT_FAILED'].includes(status)) {
    return null;
  }
  const done = doneCount(status);

  return (
    <Timeline>
      <div className="steps">
        {TIMELINE_KEYS.map((key, i) => {
          const label = t(key);
          const state = i < done ? (isCurrentStep(status, i) ? 'current' : 'done') : isCurrentStep(status, i) ? 'current' : 'pending';
          return (
            <div className={`step ${state}`} key={label}>
              {i > 0 && <div className={`line-left ${i < done ? 'done' : ''}`} />}
              {i < TIMELINE_KEYS.length - 1 && (
                <div className={`line-right ${i + 1 < done ? 'done' : ''}`} />
              )}
              <div className="node">
                {state === 'done' ? (
                  <IconCheck size={17} strokeWidth="2.4" />
                ) : state === 'current' ? (
                  <IconTruck size={17} />
                ) : (
                  <span />
                )}
              </div>
              <div className="label">{label}</div>
            </div>
          );
        })}
      </div>
    </Timeline>
  );
}

function Orders() {
  const { t } = useTranslation();
  const { user, ready } = useAuth();
  const qc = useQueryClient();
  const [openId, setOpenId] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelErr, setCancelErr] = useState(null);
  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => api.get('/orders'),
    enabled: Boolean(user),
  });

  const cancelOrder = async (id) => {
    if (cancelling) return;
    setCancelErr(null);
    setCancelling(true);
    try {
      await api.post(`/orders/${id}/cancel`, { reason: 'Mijoz bekor qildi' });
      void qc.invalidateQueries({ queryKey: ['orders'] });
    } catch (e) {
      setCancelErr(e?.problem?.detail || e?.message || 'Xatolik');
    } finally {
      setCancelling(false);
    }
  };

  const list = orders ?? [];
  const open = list.find((o) => o.id === openId) ?? null;

  const displayName = user?.firstName || user?.phone || user?.email || '';
  const initial = String(displayName).trim().charAt(0).toUpperCase() || 'K';

  if (ready && !user) {
    return (
      <Container>
        <div style={{ padding: '48px 0' }}>
          <EmptyState
            icon={<IconCart size={30} />}
            title={t('orders.title')}
            text={t('orders.login_text')}
          />
          <p style={{ textAlign: 'center', marginTop: -8 }}>
            <Link to="/auth" style={{ fontWeight: 600 }}>
              {t('account.login')} →
            </Link>
          </p>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <ProfileGrid>
        <ProfileNav>
          <div className="who">
            <div className="avatar">{initial}</div>
            <div>
              <div className="name">{displayName}</div>
              <div className="contact">{user?.phone || user?.email || ''}</div>
            </div>
          </div>
          <div className="nav">
            <Link to="/account">{t('account.profile')}</Link>
            <button type="button" className="active">
              {t('account.my_orders')}
            </button>
            <Link to="/favorites">{t('nav.favorites')}</Link>
          </div>
        </ProfileNav>

        <div>
          <h1>{t('orders.title')}</h1>

          {!isLoading && list.length === 0 ? (
            <EmptyState
              icon={<IconCart size={30} />}
              title={t('orders.empty')}
              text={t('orders.empty_text')}
            />
          ) : (
            <OrderList>
              {list.map((o) => {
                const tone = STATUS_TONE[o.status] ?? 'muted';
                const stLabel = t(`orders.st.${o.status}`, { defaultValue: o.status });
                return (
                  <OrderCard
                    key={o.id}
                    $active={o.id === openId}
                    onClick={() => setOpenId(o.id === openId ? null : o.id)}
                  >
                    <div>
                      <div className="head">
                        <span className="num">{o.number}</span>
                        <StatusChip $tone={tone}>{stLabel}</StatusChip>
                      </div>
                      <div className="meta">
                        {o.items.length}{' '}
                        {o.items.length === 1
                          ? t('orders.item_one')
                          : o.items.length < 5
                            ? t('orders.item_few')
                            : t('orders.item_many')}
                      </div>
                    </div>
                    <div className="right">
                      <div className="total">{formatSom(o.totalAmount)}</div>
                      <span className="more">
                        {o.id === openId ? t('common.collapse') : t('common.more')}
                      </span>
                    </div>
                  </OrderCard>
                );
              })}
            </OrderList>
          )}

          {open && (
            <>
              <h2 style={{ fontSize: 32, margin: '0 0 20px' }}>
                {t('orders.order')} {open.number}
              </h2>
              <OrderTimeline status={open.status} t={t} />
              <DetailGrid>
                <ItemsPanel>
                  {open.items.map((it) => (
                    <div className="item" key={it.variantId}>
                      <div>
                        <div className="sku">{it.sku}</div>
                        <div className="qty">
                          {formatSom(it.unitAmount)} × {it.quantity} {t('orders.pcs')}
                        </div>
                      </div>
                      <div className="sum">{formatSom(it.totalAmount)}</div>
                    </div>
                  ))}
                </ItemsPanel>
                <TotalsPanel>
                  <div className="row">
                    <span className="k">{t('cart.items')}</span>
                    <span>{formatSom(open.subtotalAmount)}</span>
                  </div>
                  {open.discountAmount !== '0' && (
                    <div className="row">
                      <span className="k">{t('cart.discount')}</span>
                      <span className="green">−{formatSom(open.discountAmount)}</span>
                    </div>
                  )}
                  <div className="row">
                    <span className="k">{t('cart.delivery')}</span>
                    <span>{formatSom(open.deliveryAmount)}</span>
                  </div>
                  <div className="total">
                    <span className="k">{t('cart.total')}</span>
                    <span className="v">{formatSom(open.totalAmount)}</span>
                  </div>

                  {/* Bekor qilish — faqat erta bosqichlarda (server holatni tekshiradi). */}
                  {['DRAFT', 'PENDING_PAYMENT', 'PAID', 'CONFIRMED'].includes(open.status) && (
                    <Button
                      type="button"
                      $variant="outline"
                      $full
                      disabled={cancelling}
                      style={{ marginTop: 14 }}
                      onClick={() => cancelOrder(open.id)}
                    >
                      {t('orders.cancel')}
                    </Button>
                  )}
                  {cancelErr && (
                    <div style={{ color: '#A6483B', fontSize: 13, marginTop: 8 }}>{cancelErr}</div>
                  )}
                </TotalsPanel>
              </DetailGrid>
            </>
          )}
        </div>
      </ProfileGrid>
    </Container>
  );
}

export default Orders;
