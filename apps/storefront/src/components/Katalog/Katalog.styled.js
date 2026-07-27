import styled from 'styled-components';

export const KatalogSection = styled.section`
  background: ${(p) => p.theme.color.deep};
  padding: 64px 0 56px;

  @media (max-width: ${(p) => p.theme.breakpoint.mobile}) {
    padding: 32px 0 28px;
  }
`;

export const CategoriesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-auto-rows: 200px;
  gap: 16px;

  @media (max-width: ${(p) => p.theme.breakpoint.tablet}) {
    grid-template-columns: repeat(3, 1fr);
    grid-auto-rows: 170px;
  }

  @media (max-width: ${(p) => p.theme.breakpoint.mobile}) {
    grid-template-columns: 1fr 1fr;
    grid-auto-rows: 130px;
    gap: 12px;
  }
`;

/* Plitka — rasm to'liq fon, pastida iliq gradient + nom (bir xil ritm) */
export const Tile = styled.div`
  position: relative;
  border-radius: ${(p) => p.theme.radius.card};
  overflow: hidden;
  border: 1px solid ${(p) => p.theme.color.border};
  background: repeating-linear-gradient(
    135deg,
    #efe8dc,
    #efe8dc 12px,
    #e9e0d2 12px,
    #e9e0d2 24px
  );
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
  grid-column: span ${(p) => (p.$featured ? 2 : 1)};

  &:hover {
    border-color: rgba(176, 141, 87, 0.5);
    box-shadow: 0 18px 40px -22px rgba(83, 66, 40, 0.45);
    transform: translateY(-3px);
  }

  &:hover img {
    transform: scale(1.04);
  }

  img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.4s ease;
  }

  /* Matn o'qilishi uchun pastki iliq qoraytirish */
  .shade {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      180deg,
      rgba(33, 28, 22, 0) 42%,
      rgba(33, 28, 22, 0.16) 62%,
      rgba(33, 28, 22, 0.62) 100%
    );
  }

  .info {
    position: absolute;
    left: 18px;
    right: 18px;
    bottom: 14px;
    color: ${(p) => p.theme.color.base};
  }

  .name {
    font-family: ${(p) => p.theme.font.serif};
    font-size: ${(p) => (p.$featured ? '32px' : '23px')};
    line-height: 1.1;
    text-shadow: 0 1px 12px rgba(33, 28, 22, 0.35);
  }

  .more {
    font-size: 13px;
    font-weight: 600;
    color: #ffd3a5;
    margin-top: 4px;
    opacity: 0;
    transform: translateY(4px);
    transition: opacity 0.25s ease, transform 0.25s ease;
  }

  &:hover .more {
    opacity: 1;
    transform: translateY(0);
  }

  @media (max-width: ${(p) => p.theme.breakpoint.mobile}) {
    grid-column: ${(p) => (p.$featured ? '1 / -1' : 'span 1')};

    .info {
      left: 12px;
      right: 12px;
      bottom: 10px;
    }

    .name {
      font-size: ${(p) => (p.$featured ? '26px' : '18px')};
    }

    .more {
      display: none;
    }
  }
`;
