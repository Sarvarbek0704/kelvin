import styled from 'styled-components';

export const FooterWrap = styled.footer`
  background: ${(p) => p.theme.color.footerInk};
  color: ${(p) => p.theme.color.footerText};
  margin-top: 96px;

  .edge {
    height: 4px;
    background: ${(p) => p.theme.gradient};
  }
`;

export const FooterGrid = styled.div`
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr 1.2fr;
  gap: 40px;
  padding-top: 48px;
  padding-bottom: 36px;

  @media (max-width: ${(p) => p.theme.breakpoint.tablet}) {
    grid-template-columns: 1fr 1fr;
  }

  @media (max-width: ${(p) => p.theme.breakpoint.mobile}) {
    grid-template-columns: 1fr;
    gap: 28px;
    padding-top: 36px;
  }
`;

export const BrandCol = styled.div`
  .mark {
    font-family: ${(p) => p.theme.font.serif};
    font-weight: 600;
    font-size: 34px;
    color: ${(p) => p.theme.color.base};
  }

  .tagline {
    font-family: ${(p) => p.theme.font.serif};
    font-style: italic;
    font-size: 17px;
    color: ${(p) => p.theme.color.inkMuted};
    margin: 6px 0 18px;
  }

  .details {
    font-size: 13px;
    line-height: 1.7;
  }

  a {
    color: ${(p) => p.theme.color.footerText};

    &:hover {
      color: ${(p) => p.theme.color.base};
    }
  }
`;

export const FooterCol = styled.div`
  .head {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: ${(p) => p.theme.color.brassDark};
    margin-bottom: 16px;
  }

  .links {
    display: flex;
    flex-direction: column;
    gap: 10px;
    font-size: 13px;
  }

  a {
    color: ${(p) => p.theme.color.footerText};

    &:hover {
      color: ${(p) => p.theme.color.base};
    }
  }
`;

export const PayChips = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 22px;
  flex-wrap: wrap;

  span {
    padding: 8px 14px;
    border: 1px solid rgba(201, 191, 169, 0.25);
    border-radius: 8px;
    font-size: 13px;
    color: ${(p) => p.theme.color.footerText};

    &.strong {
      font-weight: 600;
      color: ${(p) => p.theme.color.base};
    }
  }
`;

export const Socials = styled.div`
  display: flex;
  gap: 12px;

  a {
    width: 36px;
    height: 36px;
    border-radius: 999px;
    border: 1px solid rgba(201, 191, 169, 0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${(p) => p.theme.color.footerText};

    &:hover {
      color: ${(p) => p.theme.color.base};
      border-color: rgba(201, 191, 169, 0.5);
    }
  }
`;

export const BottomBar = styled.div`
  border-top: 1px solid rgba(201, 191, 169, 0.14);

  .inner {
    padding-top: 18px;
    padding-bottom: 18px;
    display: flex;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
    font-size: 12px;
    color: ${(p) => p.theme.color.inkMuted};
  }
`;
