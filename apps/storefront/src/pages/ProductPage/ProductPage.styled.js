import styled from 'styled-components';

export const TopGrid = styled.div`
  display: grid;
  grid-template-columns: 1.15fr 1fr;
  gap: 44px;
  padding: 28px 0 56px;

  @media (max-width: ${(p) => p.theme.breakpoint.tablet}) {
    grid-template-columns: 1fr;
    gap: 24px;
    padding: 16px 0 28px;
  }
`;

export const Gallery = styled.div`
  display: flex;
  gap: 16px;

  .rail {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .thumb {
    width: 76px;
    height: 76px;
    border-radius: 10px;
    overflow: hidden;
    border: 1px solid rgba(138, 106, 59, 0.2);
    padding: 0;
    background: none;
    cursor: pointer;

    &.active {
      border: 2px solid ${(p) => p.theme.color.brass};
    }

    .t {
      width: 100%;
      height: 100%;
    }
  }

  .main {
    flex: 1;
    position: relative;
    border-radius: ${(p) => p.theme.radius.image};
    overflow: hidden;

    .frame {
      position: absolute;
      inset: 0;
    }

    .glow {
      position: absolute;
      inset: 0;
      background: radial-gradient(50% 42% at 50% 40%, rgba(255, 180, 107, 0.3), transparent 72%);
      pointer-events: none;
    }
  }

  .main-box {
    flex: 1;
    aspect-ratio: 4 / 5;
    position: relative;
  }

  .dots {
    display: none;
  }

  @media (max-width: ${(p) => p.theme.breakpoint.mobile}) {
    .rail {
      display: none;
    }

    .main-box {
      aspect-ratio: 1 / 1;
    }

    .dots {
      display: flex;
      gap: 6px;
      justify-content: center;
      position: absolute;
      bottom: 14px;
      left: 0;
      right: 0;
      z-index: 2;

      button {
        width: 8px;
        height: 8px;
        border-radius: 999px;
        border: 0;
        padding: 0;
        background: rgba(138, 106, 59, 0.3);
        cursor: pointer;

        &.active {
          background: ${(p) => p.theme.color.brass};
        }
      }
    }
  }
`;

export const BuyPanel = styled.div`
  .brand {
    font-size: 12px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: ${(p) => p.theme.color.inkMuted};
  }

  h1 {
    font-size: 46px;
    line-height: 1.05;
    margin: 6px 0 12px;
  }

  .meta-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 18px;
    flex-wrap: wrap;

    .score {
      font-size: 14px;
      font-weight: 600;
    }

    .muted {
      font-size: 13px;
      color: ${(p) => p.theme.color.inkMuted};
    }
  }

  .sku-line {
    font-size: 13px;
    color: ${(p) => p.theme.color.inkMuted};
    margin-bottom: 26px;
  }

  .sel-label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;

    .cap {
      font-size: 12px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: ${(p) => p.theme.color.inkMuted};
    }

    .val {
      font-size: 14px;
      font-weight: 600;
      color: ${(p) => p.theme.color.ink};
    }
  }

  .sel-block {
    margin-bottom: 24px;
  }

  @media (max-width: ${(p) => p.theme.breakpoint.mobile}) {
    h1 {
      font-size: 34px;
    }
  }
`;

/* Variant o'qi pill tugmalari (lampalar soni, rang, o'lcham) */
export const AxisPills = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;

  button {
    padding: 10px 18px;
    border-radius: ${(p) => p.theme.radius.button};
    border: 1px solid ${(p) => p.theme.color.borderStrong};
    background: transparent;
    color: ${(p) => p.theme.color.ink};
    font-family: ${(p) => p.theme.font.sans};
    font-size: 14px;
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

export const BuyRow = styled.div`
  display: flex;
  gap: 12px;
  margin: 4px 0 20px;

  .add {
    flex: 1;
  }

  .fav {
    width: 52px;
    min-height: 52px;
    border-radius: ${(p) => p.theme.radius.button};
    border: 1.5px solid ${(p) => p.theme.color.brass};
    background: ${(p) => (p.$fav ? 'rgba(176,141,87,.12)' : 'transparent')};
    color: ${(p) => p.theme.color.brassDark};
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  @media (max-width: ${(p) => p.theme.breakpoint.mobile}) {
    display: none;
  }
`;

export const DeliveryNote = styled.div`
  display: flex;
  gap: 14px;
  padding: 16px;
  background: ${(p) => p.theme.color.deep};
  border-radius: 12px;
  color: ${(p) => p.theme.color.brassDark};

  .title {
    font-size: 14px;
    font-weight: 600;
    color: ${(p) => p.theme.color.ink};
  }

  .sub {
    font-size: 13px;
    color: ${(p) => p.theme.color.bodyText};
    margin-top: 2px;
  }
`;

export const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 44px;
  padding-bottom: 56px;

  h2 {
    font-size: 32px;
    margin: 0 0 6px;
  }

  .desc {
    font-size: 16px;
    line-height: 1.75;
    color: ${(p) => p.theme.color.bodyText};
    margin: 0 0 16px;
  }

  @media (max-width: ${(p) => p.theme.breakpoint.tablet}) {
    grid-template-columns: 1fr;
    gap: 28px;
    padding-bottom: 32px;
  }
`;

export const SpecTable = styled.div`
  background: ${(p) => p.theme.color.surface};
  border: 1px solid ${(p) => p.theme.color.border};
  border-radius: 12px;
  overflow: hidden;

  .row {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    padding: 14px 22px;
    font-size: 15px;

    & + .row {
      border-top: 1px solid rgba(138, 106, 59, 0.1);
    }

    .k {
      color: ${(p) => p.theme.color.inkMuted};
    }

    .v {
      font-weight: 600;
      text-align: right;
      color: ${(p) => p.theme.color.ink};
    }
  }

  @media (max-width: ${(p) => p.theme.breakpoint.mobile}) {
    .row {
      padding: 12px 16px;
      font-size: 14px;
    }
  }
`;

/* Sharh va savol-javob bo'limi — deep fonda */
export const SocialSection = styled.div`
  background: ${(p) => p.theme.color.deep};
  padding: 56px 0 64px;

  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 44px;

    @media (max-width: ${(p) => p.theme.breakpoint.tablet}) {
      grid-template-columns: 1fr;
      gap: 36px;
    }
  }
`;

/* Mobil sticky sotib olish paneli */
export const StickyBuyBar = styled.div`
  display: none;

  @media (max-width: ${(p) => p.theme.breakpoint.mobile}) {
    display: flex;
    gap: 12px;
    align-items: center;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 30;
    padding: 14px 18px calc(14px + env(safe-area-inset-bottom));
    background: rgba(245, 241, 234, 0.96);
    border-top: 1px solid ${(p) => p.theme.color.border};

    .fav {
      width: 52px;
      height: 52px;
      flex: none;
      border-radius: ${(p) => p.theme.radius.button};
      border: 1.5px solid ${(p) => p.theme.color.brass};
      background: ${(p) => (p.$fav ? 'rgba(176,141,87,.12)' : 'transparent')};
      color: ${(p) => p.theme.color.brassDark};
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .add {
      flex: 1;
    }
  }
`;
