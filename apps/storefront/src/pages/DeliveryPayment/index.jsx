import React from 'react';
import styled from 'styled-components';
import CmsBlock from '../../components/CmsBlock';
import { useDeliveryZones } from '../../lib/delivery';
import { formatSom } from '../../lib/money';
import { label } from '../../lib/api';
import { Container, Kicker } from '../../components/ui';

const Wrap = styled.div`
  padding: 48px 0 64px;

  h1 {
    font-size: 44px;
    margin: 10px 0 8px;
  }

  .bar {
    height: 5px;
    border-radius: 999px;
    background: ${(p) => p.theme.gradient};
    margin: 16px 0 32px;
    max-width: 220px;
  }

  .grid {
    display: grid;
    grid-template-columns: 1.3fr 1fr;
    gap: 32px;
    align-items: start;
  }

  @media (max-width: ${(p) => p.theme.breakpoint.tablet}) {
    padding: 24px 0 40px;

    h1 {
      font-size: 32px;
    }

    .grid {
      grid-template-columns: 1fr;
    }
  }
`;

const ZonesTable = styled.div`
  background: ${(p) => p.theme.color.surface};
  border: 1px solid ${(p) => p.theme.color.border};
  border-radius: ${(p) => p.theme.radius.card};
  overflow: hidden;

  .head {
    padding: 18px 24px;
    font-family: ${(p) => p.theme.font.serif};
    font-size: 24px;
    color: ${(p) => p.theme.color.ink};
    border-bottom: 1px solid rgba(138, 106, 59, 0.14);
  }

  .row {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    padding: 16px 24px;
    font-size: 15px;

    & + .row {
      border-top: 1px solid rgba(138, 106, 59, 0.1);
    }

    .v {
      font-weight: 600;
      white-space: nowrap;
    }

    .free {
      display: block;
      font-size: 12px;
      font-weight: 400;
      color: ${(p) => p.theme.color.success};
      text-align: right;
    }
  }
`;

const PayCards = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;

  .card {
    display: flex;
    align-items: center;
    gap: 14px;
    background: ${(p) => p.theme.color.surface};
    border: 1px solid ${(p) => p.theme.color.border};
    border-radius: 12px;
    padding: 20px;
  }

  .logo {
    padding: 8px 16px;
    border-radius: 8px;
    background: ${(p) => p.theme.color.deep};
    font-size: 14px;
    font-weight: 700;
    color: ${(p) => p.theme.color.brassDark};
    flex: none;
  }

  .title {
    font-size: 15px;
    font-weight: 600;
    color: ${(p) => p.theme.color.ink};
  }

  .sub {
    font-size: 13px;
    color: ${(p) => p.theme.color.inkMuted};
  }
`;

function DeliveryPayment() {
  const { data: zones } = useDeliveryZones();

  return (
    <div>
      <Container>
        <Wrap>
          <Kicker as="div">Информация</Kicker>
          <h1>Доставка и оплата</h1>
          <div className="bar" />

          <div className="grid">
            <ZonesTable>
              <div className="head">Зоны доставки</div>
              {(zones ?? []).map((z) => (
                <div className="row" key={z.id}>
                  <span>{label(z.name)}</span>
                  <span className="v">
                    {formatSom(z.priceAmount)} · {z.etaDaysMin}–{z.etaDaysMax} дн.
                    {z.freeThresholdAmount && (
                      <span className="free">
                        бесплатно от {formatSom(z.freeThresholdAmount)}
                      </span>
                    )}
                  </span>
                </div>
              ))}
              <div className="row">
                <span>Установка (тяжёлые фикстуры)</span>
                <span className="v">по договорённости</span>
              </div>
            </ZonesTable>

            <PayCards>
              <div className="card">
                <span className="logo">Click</span>
                <div>
                  <div className="title">Онлайн через Click</div>
                  <div className="sub">Оплата картой мгновенно</div>
                </div>
              </div>
              <div className="card">
                <span className="logo">Payme</span>
                <div>
                  <div className="title">Онлайн через Payme</div>
                  <div className="sub">Скоро — идёт подключение</div>
                </div>
              </div>
              <div className="card">
                <span className="logo">Cash</span>
                <div>
                  <div className="title">Наличными при доставке</div>
                  <div className="sub">Оплата курьеру после осмотра</div>
                </div>
              </div>
            </PayCards>
          </div>
        </Wrap>
      </Container>

      {/* CMS kontenti (admin boshqaradi) */}
      <CmsBlock slug="dostavka-i-oplata" />
    </div>
  );
}

export default DeliveryPayment;
