import styled from 'styled-components';

export const BasketWrap = styled.div`
  padding: 36px 0 56px;

  h1 {
    font-size: 44px;
    margin: 0 0 4px;
  }

  .bar {
    height: 5px;
    border-radius: 999px;
    background: ${(p) => p.theme.gradient};
    margin: 16px 0 32px;
    max-width: 240px;
  }

  @media (max-width: ${(p) => p.theme.breakpoint.mobile}) {
    padding: 20px 0 40px;

    h1 {
      font-size: 32px;
    }

    .bar {
      margin: 12px 0 20px;
      max-width: 160px;
    }
  }
`;

export const CheckoutGrid = styled.div`
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 32px;
  align-items: start;

  .left {
    display: flex;
    flex-direction: column;
    gap: 28px;
  }

  @media (max-width: ${(p) => p.theme.breakpoint.tablet}) {
    grid-template-columns: 1fr;

    .left {
      gap: 18px;
    }
  }
`;

export const Panel = styled.div`
  background: ${(p) => p.theme.color.surface};
  border: 1px solid ${(p) => p.theme.color.border};
  border-radius: ${(p) => p.theme.radius.card};
  padding: 26px;

  h2 {
    font-size: 26px;
    margin: 0 0 18px;
  }

  .sub-label {
    font-size: 13px;
    color: ${(p) => p.theme.color.bodyText};
    margin-bottom: 10px;
  }

  @media (max-width: ${(p) => p.theme.breakpoint.mobile}) {
    padding: 18px;
  }
`;

export const LinesPanel = styled.div`
  background: ${(p) => p.theme.color.surface};
  border: 1px solid ${(p) => p.theme.color.border};
  border-radius: ${(p) => p.theme.radius.card};
  padding: 8px 24px;

  @media (max-width: ${(p) => p.theme.breakpoint.mobile}) {
    padding: 4px 16px;
  }
`;

export const LineRow = styled.div`
  display: flex;
  gap: 18px;
  align-items: center;
  padding: 20px 0;

  & + & {
    border-top: 1px solid rgba(138, 106, 59, 0.1);
  }

  .photo {
    width: 84px;
    height: 96px;
    border-radius: 10px;
    overflow: hidden;
    flex: none;
  }

  .info {
    flex: 1;
    min-width: 0;
  }

  .name {
    font-family: ${(p) => p.theme.font.serif};
    font-size: 22px;
    color: ${(p) => p.theme.color.ink};
    margin: 2px 0 6px;
  }

  .chips {
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
  }

  .price {
    width: 150px;
    text-align: right;
    font-size: 17px;
    font-weight: 600;
    white-space: nowrap;

    .unit {
      font-size: 12px;
      color: ${(p) => p.theme.color.inkMuted};
      font-weight: 500;
    }
  }

  .remove {
    border: 0;
    background: none;
    padding: 6px;
    color: ${(p) => p.theme.color.outOfStock};
    cursor: pointer;
    line-height: 0;

    &:hover {
      color: ${(p) => p.theme.color.error};
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
  }

  @media (max-width: ${(p) => p.theme.breakpoint.mobile}) {
    flex-wrap: wrap;
    gap: 12px;

    .photo {
      width: 72px;
      height: 82px;
    }

    .name {
      font-size: 19px;
    }

    .price {
      width: auto;
      margin-left: auto;
      order: 3;
    }

    .stepper-slot {
      order: 4;
    }

    .remove {
      order: 2;
    }
  }
`;

/* Zona chiplari */
export const ZoneChips = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 14px;

  button {
    padding: 12px 18px;
    border-radius: ${(p) => p.theme.radius.button};
    border: 1px solid ${(p) => p.theme.color.borderStrong};
    background: transparent;
    font-family: ${(p) => p.theme.font.sans};
    font-size: 14px;
    color: ${(p) => p.theme.color.ink};
    cursor: pointer;
    transition: border-color 0.15s ease, background 0.15s ease;

    &.active {
      border: 1.5px solid ${(p) => p.theme.color.brass};
      background: rgba(176, 141, 87, 0.12);
      color: ${(p) => p.theme.color.linkHover};
      font-weight: 600;
    }
  }
`;

export const QuoteNote = styled.p`
  font-size: 13px;
  color: ${(p) => p.theme.color.inkMuted};
  margin: 0;

  .free {
    color: ${(p) => p.theme.color.success};
    font-weight: 600;
  }
`;

export const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;

  .full {
    grid-column: 1 / -1;
  }

  @media (max-width: ${(p) => p.theme.breakpoint.mobile}) {
    grid-template-columns: 1fr;

    .full {
      grid-column: auto;
    }
  }
`;

/* To'lov usuli kartalari */
export const PayOptions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;

  label {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    border-radius: ${(p) => p.theme.radius.button};
    border: 1px solid ${(p) => p.theme.color.borderStrong};
    cursor: pointer;
    transition: border-color 0.15s ease, background 0.15s ease;

    &.active {
      border: 1.5px solid ${(p) => p.theme.color.brass};
      background: rgba(176, 141, 87, 0.07);
    }

    &.disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }

  .pay-name {
    font-size: 15px;
    font-weight: 600;
    color: ${(p) => p.theme.color.ink};
  }

  .pay-note {
    margin-left: auto;
    font-size: 13px;
    color: ${(p) => p.theme.color.inkMuted};
  }

  .pay-tag {
    margin-left: auto;
    padding: 5px 12px;
    border-radius: 8px;
    background: ${(p) => p.theme.color.deep};
    font-size: 12px;
    font-weight: 600;
    color: ${(p) => p.theme.color.brassDark};
  }
`;

/* O'ng ustun — buyurtma xulosasi (sticky) */
export const Summary = styled.div`
  position: sticky;
  top: 20px;
  background: ${(p) => p.theme.color.surface};
  border: 1px solid ${(p) => p.theme.color.border};
  border-radius: ${(p) => p.theme.radius.card};
  padding: 28px;

  h2 {
    font-size: 26px;
    margin: 0 0 20px;
  }

  .rows {
    display: flex;
    flex-direction: column;
    gap: 12px;
    font-size: 15px;
  }

  .row {
    display: flex;
    justify-content: space-between;
    gap: 12px;

    .k {
      color: ${(p) => p.theme.color.bodyText};
    }

    .v {
      white-space: nowrap;
    }

    .green {
      color: ${(p) => p.theme.color.success};
    }
  }

  .div {
    height: 1px;
    background: rgba(138, 106, 59, 0.16);
    margin: 20px 0;
  }

  .total-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 8px;

    .k {
      font-size: 17px;
      font-weight: 600;
    }

    .v {
      font-size: 26px;
      font-weight: 700;
      white-space: nowrap;

      .unit {
        font-size: 15px;
        color: ${(p) => p.theme.color.inkMuted};
        font-weight: 500;
      }
    }
  }

  .note {
    font-size: 13px;
    color: ${(p) => p.theme.color.inkMuted};
    margin-bottom: 22px;
  }

  .secure {
    display: flex;
    align-items: center;
    gap: 8px;
    justify-content: center;
    margin-top: 16px;
    font-size: 12px;
    color: ${(p) => p.theme.color.inkMuted};
  }

  .privacy {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin-top: 14px;
    font-size: 12px;
    color: ${(p) => p.theme.color.inkMuted};
  }

  @media (max-width: ${(p) => p.theme.breakpoint.tablet}) {
    position: static;
  }
`;

/* Buyurtma qabul qilindi */
export const SuccessWrap = styled.div`
  padding: 72px 0;
  text-align: center;

  .icon {
    width: 84px;
    height: 84px;
    border-radius: 999px;
    background: ${(p) => p.theme.color.deep};
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 26px;
    color: ${(p) => p.theme.color.success};
  }

  h1 {
    font-size: 48px;
    margin: 0 0 12px;
  }

  .lead {
    font-size: 17px;
    color: ${(p) => p.theme.color.bodyText};
    margin-bottom: 4px;
  }

  .muted {
    font-size: 14px;
    color: ${(p) => p.theme.color.inkMuted};
    margin-bottom: 32px;
  }

  .facts {
    display: inline-flex;
    gap: 40px;
    background: ${(p) => p.theme.color.surface};
    border: 1px solid ${(p) => p.theme.color.border};
    border-radius: ${(p) => p.theme.radius.card};
    padding: 24px 40px;
    text-align: left;

    .sep {
      width: 1px;
      background: rgba(138, 106, 59, 0.16);
    }

    .cap {
      font-size: 12px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: ${(p) => p.theme.color.inkMuted};
    }

    .val {
      font-family: ${(p) => p.theme.font.serif};
      font-size: 30px;
      margin-top: 4px;
      color: ${(p) => p.theme.color.ink};
    }
  }

  .actions {
    display: flex;
    gap: 14px;
    justify-content: center;
    margin-top: 32px;
    flex-wrap: wrap;
  }

  @media (max-width: ${(p) => p.theme.breakpoint.mobile}) {
    padding: 44px 0;

    h1 {
      font-size: 34px;
    }

    .facts {
      flex-direction: column;
      gap: 16px;
      padding: 20px 24px;

      .sep {
        display: none;
      }

      .val {
        font-size: 24px;
      }
    }
  }
`;

export const ErrorText = styled.p`
  color: ${(p) => p.theme.color.error};
  font-size: 14px;
  margin: 10px 0 0;
`;
