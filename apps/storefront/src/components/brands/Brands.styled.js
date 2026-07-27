import styled from 'styled-components';

export const BrandsStrip = styled.section`
  background: ${(p) => p.theme.color.deep};
  border-top: 1px solid rgba(138, 106, 59, 0.14);
  border-bottom: 1px solid rgba(138, 106, 59, 0.14);
  padding: 44px 0;

  .kicker {
    text-align: center;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: ${(p) => p.theme.color.brassDark};
    margin-bottom: 26px;
  }

  .row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24px;
    flex-wrap: wrap;
  }

  .brand {
    font-family: ${(p) => p.theme.font.serif};
    font-size: 26px;
    color: ${(p) => p.theme.color.inkMuted};
  }

  @media (max-width: ${(p) => p.theme.breakpoint.mobile}) {
    padding: 28px 0;

    .row {
      justify-content: center;
      gap: 16px 28px;
    }

    .brand {
      font-size: 21px;
    }
  }
`;
