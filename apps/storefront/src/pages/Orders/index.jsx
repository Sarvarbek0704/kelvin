import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { formatSom } from '../../lib/money';
import { useAuth } from '../../lib/auth-context';
import {
  Container,
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

// Holat → rus yorlig'i + chip toni
const STATUS_MAP = {
  DRAFT: { label: 'Черновик', tone: 'muted' },
  PENDING_PAYMENT: { label: 'Ожидает оплаты', tone: 'warning' },
  PAYMENT_FAILED: { label: 'Оплата не прошла', tone: 'muted' },
  PAID: { label: 'Оплачен', tone: 'success' },
  CONFIRMED: { label: 'Подтверждён', tone: 'success' },
  PICKING: { label: 'Собирается', tone: 'warning' },
  PACKED: { label: 'Собран', tone: 'warning' },
  SHIPPED: { label: 'В доставке', tone: 'warning' },
  DELIVERED: { label: 'Доставлен', tone: 'success' },
  COMPLETED: { label: 'Завершён', tone: 'success' },
  CANCELLED: { label: 'Отменён', tone: 'muted' },
  RETURNED: { label: 'Возврат', tone: 'muted' },
  PARTIALLY_RETURNED: { label: 'Частичный возврат', tone: 'muted' },
};

// Vaqt chizig'i bosqichlari — buyurtma holatidan nechta bosqich o'tganini hisoblash
const TIMELINE_STEPS = ['Оформлен', 'Подтверждён', 'В доставке', 'Доставлен'];
function doneCount(status) {
  if (['DELIVERED', 'COMPLETED'].includes(status)) return 4;
  if (status === 'SHIPPED') return 2; // "В доставке" joriy
  if (['CONFIRMED', 'PICKING', 'PACKED', 'PAID'].includes(status)) return 2;
  return 1; // oformlen
}
const isCurrentStep = (status, i) =>
  (status === 'SHIPPED' && i === 2) ||
  (['CONFIRMED', 'PICKING', 'PACKED', 'PAID'].includes(status) && i === 1);

function OrderTimeline({ status }) {
  if (['CANCELLED', 'RETURNED', 'PARTIALLY_RETURNED', 'DRAFT', 'PENDING_PAYMENT', 'PAYMENT_FAILED'].includes(status)) {
    return null;
  }
  const done = doneCount(status);

  return (
    <Timeline>
      <div className="steps">
        {TIMELINE_STEPS.map((label, i) => {
          const state = i < done ? (isCurrentStep(status, i) ? 'current' : 'done') : isCurrentStep(status, i) ? 'current' : 'pending';
          return (
            <div className={`step ${state}`} key={label}>
              {i > 0 && <div className={`line-left ${i < done ? 'done' : ''}`} />}
              {i < TIMELINE_STEPS.length - 1 && (
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
  const [openId, setOpenId] = useState(null);
  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => api.get('/orders'),
    enabled: Boolean(user),
  });

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
            text="Войдите, чтобы видеть историю заказов."
          />
          <p style={{ textAlign: 'center', marginTop: -8 }}>
            <Link to="/account" style={{ fontWeight: 600 }}>
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
            <Link to="/account">Профиль</Link>
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
              text="Соберите первый заказ — свет уже ждёт."
            />
          ) : (
            <OrderList>
              {list.map((o) => {
                const st = STATUS_MAP[o.status] ?? { label: o.status, tone: 'muted' };
                return (
                  <OrderCard
                    key={o.id}
                    $active={o.id === openId}
                    onClick={() => setOpenId(o.id === openId ? null : o.id)}
                  >
                    <div>
                      <div className="head">
                        <span className="num">{o.number}</span>
                        <StatusChip $tone={st.tone}>{st.label}</StatusChip>
                      </div>
                      <div className="meta">
                        {o.items.length}{' '}
                        {o.items.length === 1 ? 'товар' : o.items.length < 5 ? 'товара' : 'товаров'}
                      </div>
                    </div>
                    <div className="right">
                      <div className="total">{formatSom(o.totalAmount)}</div>
                      <span className="more">
                        {o.id === openId ? 'Свернуть' : 'Подробнее →'}
                      </span>
                    </div>
                  </OrderCard>
                );
              })}
            </OrderList>
          )}

          {open && (
            <>
              <h2 style={{ fontSize: 32, margin: '0 0 20px' }}>Заказ {open.number}</h2>
              <OrderTimeline status={open.status} />
              <DetailGrid>
                <ItemsPanel>
                  {open.items.map((it) => (
                    <div className="item" key={it.variantId}>
                      <div>
                        <div className="sku">{it.sku}</div>
                        <div className="qty">
                          {formatSom(it.unitAmount)} × {it.quantity} шт
                        </div>
                      </div>
                      <div className="sum">{formatSom(it.totalAmount)}</div>
                    </div>
                  ))}
                </ItemsPanel>
                <TotalsPanel>
                  <div className="row">
                    <span className="k">Товары</span>
                    <span>{formatSom(open.subtotalAmount)}</span>
                  </div>
                  {open.discountAmount !== '0' && (
                    <div className="row">
                      <span className="k">Скидка</span>
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
