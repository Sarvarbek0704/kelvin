import styled from 'styled-components';

export const CatalogHead = styled.div`
  padding: 44px 0 20px;
  text-align: center;

  h1 {
    font-size: 56px;
    margin: 0;
  }

  .bar {
    height: 6px;
    border-radius: 999px;
    background: ${(p) => p.theme.gradient};
    margin: 22px auto 0;
    max-width: 260px;
  }

  @media (max-width: ${(p) => p.theme.breakpoint.mobile}) {
    padding: 20px 0 8px;

    h1 {
      font-size: 30px;
    }

    .bar {
      height: 5px;
      margin-top: 14px;
      max-width: 160px;
    }
  }
`;

export const Mosaic = styled.div`
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  grid-auto-rows: 190px;
  gap: 16px;
  padding: 32px 0 64px;

  @media (max-width: ${(p) => p.theme.breakpoint.mobile}) {
    grid-template-columns: 1fr 1fr;
    grid-auto-rows: 110px;
    gap: 12px;
    padding: 16px 0 32px;
  }
`;

export const MosaicTile = styled.div`
  position: relative;
  background: ${(p) => p.theme.color.surface};
  border: 1px solid ${(p) => p.theme.color.border};
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  align-items: flex-end;
  padding: 22px;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;

  grid-column: span ${(p) => p.$span ?? 2};
  ${(p) => p.$tall && 'grid-row: span 2;'}

  &:hover {
    border-color: rgba(176, 141, 87, 0.5);
    box-shadow: 0 20px 44px -22px rgba(83, 66, 40, 0.4);
    transform: translateY(-3px);
  }

  &:hover .glow {
    opacity: 1;
  }

  .bg {
    position: absolute;
    inset: 0;
    background: repeating-linear-gradient(
      135deg,
      #efe8dc,
      #efe8dc 12px,
      #e9e0d2 12px,
      #e9e0d2 24px
    );

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .glow {
    position: absolute;
    inset: 0;
    opacity: 0;
    transition: opacity 0.3s ease;
    background: radial-gradient(50% 55% at 50% 38%, rgba(255, 180, 107, 0.3), transparent 72%);
  }

  .info {
    position: relative;
    color: ${(p) => p.theme.color.ink};
  }

  .name {
    font-family: ${(p) => p.theme.font.serif};
    font-size: ${(p) => (p.$featured ? '40px' : '26px')};
    line-height: 1.1;
  }

  .more {
    font-size: 14px;
    color: ${(p) => p.theme.color.brassDark};
    font-weight: 600;
    margin-top: 10px;
    display: inline-block;
  }

  @media (max-width: ${(p) => p.theme.breakpoint.mobile}) {
    grid-column: ${(p) => (p.$featured ? '1 / -1' : 'span 1')};
    ${(p) => p.$featured && 'grid-row: span 1; min-height: 150px;'}
    padding: 16px;

    .name {
      font-size: ${(p) => (p.$featured ? '30px' : '20px')};
    }

    .more {
      display: none;
    }
  }
`;
