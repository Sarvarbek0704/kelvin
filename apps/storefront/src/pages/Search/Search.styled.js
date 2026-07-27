import styled from 'styled-components';

export const SearchWrap = styled.div`
  padding: 32px 0 56px;

  @media (max-width: ${(p) => p.theme.breakpoint.mobile}) {
    padding: 14px 0 90px;
  }
`;

export const HeadRow = styled.div`
  .crumbs-row {
    margin-bottom: 16px;
  }

  .title-row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 16px;
  }

  h1 {
    font-size: 48px;
    margin: 0;
  }

  .count {
    font-size: 14px;
    color: ${(p) => p.theme.color.bodyText};
    margin-top: 6px;
  }

  .sort {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    color: ${(p) => p.theme.color.inkMuted};

    select {
      width: auto;
      padding: 10px 40px 10px 16px;
      font-size: 14px;
    }
  }

  .bar {
    height: 5px;
    border-radius: 999px;
    background: ${(p) => p.theme.gradient};
    margin-top: 22px;
    max-width: 240px;
  }

  @media (max-width: ${(p) => p.theme.breakpoint.mobile}) {
    h1 {
      font-size: 30px;
    }

    .bar {
      margin-top: 14px;
      max-width: 160px;
    }
  }
`;

export const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 28px;
  padding-top: 28px;

  @media (max-width: ${(p) => p.theme.breakpoint.tablet}) {
    grid-template-columns: 1fr;
  }
`;

export const Sidebar = styled.aside`
  align-self: start;
  position: sticky;
  top: 20px;
  background: ${(p) => p.theme.color.surface};
  border: 1px solid ${(p) => p.theme.color.border};
  border-radius: ${(p) => p.theme.radius.card};
  padding: 24px;

  @media (max-width: ${(p) => p.theme.breakpoint.tablet}) {
    display: none;
  }
`;

export const FilterHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;

  .title {
    font-family: ${(p) => p.theme.font.serif};
    font-size: 26px;
    color: ${(p) => p.theme.color.ink};
  }

  button {
    border: 0;
    background: none;
    padding: 0;
    font-size: 12px;
    color: ${(p) => p.theme.color.brassDark};
    font-weight: 600;
    cursor: pointer;
  }
`;

export const FacetGroup = styled.div`
  border-top: 1px solid ${(p) => p.theme.color.border};
  padding: 18px 0;

  .facet-label {
    font-size: 12px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: ${(p) => p.theme.color.inkMuted};
    margin-bottom: 14px;

    .hint {
      color: ${(p) => p.theme.color.outOfStock};
      text-transform: none;
      letter-spacing: 0;
    }
  }

  .options {
    display: flex;
    flex-direction: column;
    gap: 12px;
    font-size: 14px;
  }

  .opt-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .count {
    color: ${(p) => p.theme.color.inkMuted};
    font-size: 13px;

    &.zero {
      color: ${(p) => p.theme.color.outOfStock};
    }
  }

  .toggle-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 14px;
    color: ${(p) => p.theme.color.ink};
  }
`;

/* Temperatura swatch qatori (filtr) — tanlanganda guruch halqa */
export const TempFacet = styled.div`
  .swatch-row {
    display: flex;
    gap: 10px;
  }

  .swatch {
    width: 30px;
    height: 30px;
    border-radius: 999px;
    border: 1px solid ${(p) => p.theme.color.borderStrong};
    padding: 0;
    cursor: pointer;

    &.active {
      border: 0;
      box-shadow: 0 0 0 2px ${(p) => p.theme.color.surface},
        0 0 0 4px ${(p) => p.theme.color.brass};
    }

    &:disabled {
      opacity: 0.35;
      cursor: not-allowed;
    }
  }

  .ends {
    display: flex;
    justify-content: space-between;
    margin-top: 8px;
    font-size: 11px;
    color: ${(p) => p.theme.color.outOfStock};
  }
`;

/* Ikki dastali flux slideri — ikkita native range ustma-ust */
export const RangeWrap = styled.div`
  .track {
    position: relative;
    height: 4px;
    background: ${(p) => p.theme.color.deep};
    border-radius: 999px;
    margin: 22px 4px 8px;
  }

  .fill {
    position: absolute;
    height: 4px;
    background: ${(p) => p.theme.color.brass};
    border-radius: 999px;
  }

  input[type='range'] {
    position: absolute;
    top: -7px;
    left: 0;
    width: 100%;
    height: 18px;
    margin: 0;
    background: none;
    appearance: none;
    pointer-events: none;

    &::-webkit-slider-thumb {
      appearance: none;
      width: 18px;
      height: 18px;
      border-radius: 999px;
      background: ${(p) => p.theme.color.surface};
      border: 2px solid ${(p) => p.theme.color.brass};
      pointer-events: auto;
      cursor: grab;
    }

    &::-moz-range-thumb {
      width: 14px;
      height: 14px;
      border-radius: 999px;
      background: ${(p) => p.theme.color.surface};
      border: 2px solid ${(p) => p.theme.color.brass};
      pointer-events: auto;
      cursor: grab;
    }
  }

  .ends {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: ${(p) => p.theme.color.inkMuted};
  }
`;

export const Chips = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 22px;
  align-items: center;

  .clear {
    border: 0;
    background: none;
    font-size: 13px;
    color: ${(p) => p.theme.color.brassDark};
    font-weight: 600;
    margin-left: 4px;
    cursor: pointer;
  }

  @media (max-width: ${(p) => p.theme.breakpoint.mobile}) {
    flex-wrap: nowrap;
    overflow-x: auto;
    scrollbar-width: none;
    margin-bottom: 14px;

    &::-webkit-scrollbar {
      display: none;
    }

    > * {
      flex: none;
    }
  }
`;

export const ResultsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;

  @media (max-width: ${(p) => p.theme.breakpoint.mobile}) {
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
`;

export const Pager = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  margin-top: 40px;

  .dots {
    color: ${(p) => p.theme.color.outOfStock};
    padding: 0 2px;
  }
`;

export const EmptyWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 60px 24px;

  .icon {
    width: 76px;
    height: 76px;
    border-radius: 999px;
    background: ${(p) => p.theme.color.deep};
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${(p) => p.theme.color.brassDark};
    margin-bottom: 22px;
  }

  .title {
    font-family: ${(p) => p.theme.font.serif};
    font-size: 34px;
    color: ${(p) => p.theme.color.ink};
    margin-bottom: 10px;
  }

  .text {
    font-size: 15px;
    color: ${(p) => p.theme.color.bodyText};
    max-width: 420px;
    line-height: 1.6;
  }

  .actions {
    display: flex;
    gap: 12px;
    margin-top: 18px;
    flex-wrap: wrap;
    justify-content: center;
  }
`;

/* Mobil: pastdagi suzuvchi "Фильтр (N) | Показать N" tugmasi */
export const MobileFilterBar = styled.div`
  display: none;

  @media (max-width: ${(p) => p.theme.breakpoint.tablet}) {
    display: flex;
    justify-content: center;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 30;
    padding: 16px 18px calc(16px + env(safe-area-inset-bottom));
    background: linear-gradient(0deg, ${(p) => p.theme.color.base} 55%, transparent);
    pointer-events: none;

    button {
      pointer-events: auto;
      display: inline-flex;
      align-items: center;
      gap: 12px;
      padding: 14px 24px;
      border-radius: 999px;
      border: 0;
      background: ${(p) => p.theme.color.ink};
      color: ${(p) => p.theme.color.base};
      font-family: ${(p) => p.theme.font.sans};
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 16px 34px -14px rgba(60, 48, 30, 0.7);

      .sep {
        width: 1px;
        height: 16px;
        background: rgba(245, 241, 234, 0.3);
      }
    }
  }
`;

/* Mobil bottom-sheet filtr */
export const SheetScrim = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(33, 28, 22, 0.42);
  z-index: 44;
  opacity: ${(p) => (p.$open ? 1 : 0)};
  pointer-events: ${(p) => (p.$open ? 'auto' : 'none')};
  transition: opacity 0.25s ease;
`;

export const Sheet = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 45;
  background: ${(p) => p.theme.color.base};
  border-radius: 24px 24px 0 0;
  max-height: 88dvh;
  display: flex;
  flex-direction: column;
  transform: translateY(${(p) => (p.$open ? '0' : '105%')});
  transition: transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);

  .grip {
    padding: 12px 0 4px;
    display: flex;
    justify-content: center;

    span {
      width: 44px;
      height: 5px;
      border-radius: 999px;
      background: rgba(138, 106, 59, 0.35);
    }
  }

  .sheet-head {
    padding: 8px 20px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid ${(p) => p.theme.color.border};

    .title {
      font-family: ${(p) => p.theme.font.serif};
      font-size: 26px;
      color: ${(p) => p.theme.color.ink};
    }

    button {
      border: 0;
      background: none;
      padding: 4px;
      color: ${(p) => p.theme.color.ink};
      cursor: pointer;
      line-height: 0;
    }
  }

  .sheet-body {
    padding: 20px;
    overflow-y: auto;
    flex: 1;
  }

  .sheet-foot {
    padding: 14px 20px calc(22px + env(safe-area-inset-bottom));
    border-top: 1px solid ${(p) => p.theme.color.border};
    display: flex;
    gap: 12px;

    .show {
      flex: 1;
    }
  }
`;
