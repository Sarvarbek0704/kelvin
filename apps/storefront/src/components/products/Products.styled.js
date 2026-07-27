import styled from 'styled-components';

export const ProductsSection = styled.section`
  padding: 72px 0;

  @media (max-width: ${(p) => p.theme.breakpoint.mobile}) {
    padding: 36px 0;
  }
`;

export const ProductsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;

  @media (max-width: ${(p) => p.theme.breakpoint.tablet}) {
    grid-template-columns: repeat(3, 1fr);
  }

  /* Mobil: gorizontal aylanadigan qator (dizayn bo'yicha) */
  @media (max-width: ${(p) => p.theme.breakpoint.mobile}) {
    display: flex;
    gap: 14px;
    overflow-x: auto;
    padding-bottom: 8px;
    margin-right: -${(p) => p.theme.layout.pagePadMobile};
    padding-right: ${(p) => p.theme.layout.pagePadMobile};
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }

    > * {
      flex: none;
      width: 200px;
    }
  }
`;
