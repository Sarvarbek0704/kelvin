import styled from 'styled-components';

export const OrderList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 40px;
`;

export const OrderCard = styled.div`
  background: ${(p) => p.theme.color.surface};
  border: 1px solid
    ${(p) => (p.$active ? 'rgba(176,141,87,.5)' : p.theme.color.border)};
  border-radius: 12px;
  padding: 20px 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  cursor: pointer;
  transition: border-color 0.2s ease;

  &:hover {
    border-color: rgba(176, 141, 87, 0.5);
  }

  .head {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .num {
    font-family: ${(p) => p.theme.font.serif};
    font-size: 22px;
    color: ${(p) => p.theme.color.ink};
  }

  .meta {
    font-size: 13px;
    color: ${(p) => p.theme.color.inkMuted};
    margin-top: 4px;
  }

  .right {
    text-align: right;
    margin-left: auto;
  }

  .total {
    font-size: 18px;
    font-weight: 600;
    white-space: nowrap;
    color: ${(p) => p.theme.color.ink};
  }

  .more {
    font-size: 13px;
    color: ${(p) => p.theme.color.brassDark};
    font-weight: 600;
  }

  @media (max-width: ${(p) => p.theme.breakpoint.mobile}) {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    padding: 16px;

    .right {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      text-align: left;
      margin-left: 0;
    }
  }
`;

/* Gorizontal holat vaqt chizig'i (mobil: vertikal) */
export const Timeline = styled.div`
  background: ${(p) => p.theme.color.surface};
  border: 1px solid ${(p) => p.theme.color.border};
  border-radius: ${(p) => p.theme.radius.card};
  padding: 32px 28px;
  margin-bottom: 20px;

  .steps {
    display: flex;
    align-items: flex-start;
  }

  .step {
    flex: 1;
    text-align: center;
    position: relative;
  }

  .node {
    width: 34px;
    height: 34px;
    border-radius: 999px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto;
    position: relative;
    z-index: 1;
    color: ${(p) => p.theme.color.base};
  }

  .step.done .node {
    background: ${(p) => p.theme.color.success};
  }

  .step.current .node {
    background: ${(p) => p.theme.color.brass};
    box-shadow: 0 0 0 4px rgba(176, 141, 87, 0.18);
  }

  .step.pending .node {
    background: ${(p) => p.theme.color.deep};
    border: 1.5px solid ${(p) => p.theme.color.borderStrong};
  }

  .step.pending .node span {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: ${(p) => p.theme.color.outOfStock};
  }

  /* chiziqlar */
  .line-left,
  .line-right {
    position: absolute;
    top: 17px;
    height: 2px;
    background: rgba(138, 106, 59, 0.25);
  }

  .line-left {
    left: -50%;
    right: 50%;
  }

  .line-right {
    left: 50%;
    right: -50%;
  }

  .line-left.done,
  .line-right.done {
    background: ${(p) => p.theme.color.success};
  }

  .line-left.active,
  .line-right.active {
    background: ${(p) => p.theme.color.brass};
  }

  .label {
    font-size: 13px;
    font-weight: 600;
    margin-top: 12px;
    color: ${(p) => p.theme.color.ink};
  }

  .step.current .label {
    color: ${(p) => p.theme.color.brassDark};
  }

  .step.pending .label {
    color: ${(p) => p.theme.color.inkMuted};
  }

  @media (max-width: ${(p) => p.theme.breakpoint.mobile}) {
    padding: 22px 18px;

    .steps {
      flex-direction: column;
      gap: 0;
    }

    .step {
      text-align: left;
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 10px 0;
    }

    .node {
      margin: 0;
    }

    .line-left,
    .line-right {
      display: none;
    }

    .label {
      margin-top: 0;
    }
  }
`;

export const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 20px;

  @media (max-width: ${(p) => p.theme.breakpoint.mobile}) {
    grid-template-columns: 1fr;
  }
`;

export const ItemsPanel = styled.div`
  background: ${(p) => p.theme.color.surface};
  border: 1px solid ${(p) => p.theme.color.border};
  border-radius: ${(p) => p.theme.radius.card};
  padding: 8px 22px;

  .item {
    display: flex;
    gap: 16px;
    align-items: center;
    padding: 16px 0;

    & + .item {
      border-top: 1px solid rgba(138, 106, 59, 0.1);
    }
  }

  .sku {
    font-family: ${(p) => p.theme.font.serif};
    font-size: 19px;
    color: ${(p) => p.theme.color.ink};
  }

  .qty {
    font-size: 12px;
    color: ${(p) => p.theme.color.inkMuted};
  }

  .sum {
    margin-left: auto;
    font-size: 15px;
    font-weight: 600;
    white-space: nowrap;
    color: ${(p) => p.theme.color.ink};
  }
`;

export const TotalsPanel = styled.div`
  background: ${(p) => p.theme.color.surface};
  border: 1px solid ${(p) => p.theme.color.border};
  border-radius: ${(p) => p.theme.radius.card};
  padding: 22px;
  align-self: start;

  .row {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    font-size: 14px;
    margin-bottom: 10px;

    .k {
      color: ${(p) => p.theme.color.bodyText};
    }

    .green {
      color: ${(p) => p.theme.color.success};
    }
  }

  .total {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding-top: 14px;
    border-top: 1px solid rgba(138, 106, 59, 0.16);

    .k {
      font-size: 16px;
      font-weight: 600;
    }

    .v {
      font-size: 22px;
      font-weight: 700;
      white-space: nowrap;
    }
  }
`;
