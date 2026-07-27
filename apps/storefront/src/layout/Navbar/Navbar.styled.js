import styled from 'styled-components';
import { Link } from 'react-router-dom';

export const Header = styled.header`
  background: ${(p) => p.theme.color.surface};
  border-bottom: 1px solid ${(p) => p.theme.color.border};
`;

/* Yuqori ink strip — servis linklar + telefon + til */
export const TopStrip = styled.div`
  background: ${(p) => p.theme.color.ink};
  color: ${(p) => p.theme.color.footerText};
  font-size: 12px;

  .inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding-top: 8px;
    padding-bottom: 8px;
  }

  .links {
    display: flex;
    gap: 22px;
  }

  a {
    color: ${(p) => p.theme.color.footerText};

    &:hover {
      color: ${(p) => p.theme.color.base};
    }
  }

  .side {
    display: flex;
    gap: 18px;
    align-items: center;
  }

  @media (max-width: ${(p) => p.theme.breakpoint.mobile}) {
    display: none;
  }
`;

export const MainRow = styled.div`
  display: flex;
  align-items: center;
  gap: 28px;
  padding-top: 20px;
  padding-bottom: 20px;

  @media (max-width: ${(p) => p.theme.breakpoint.mobile}) {
    gap: 14px;
    padding-top: 12px;
    padding-bottom: 12px;
  }
`;

export const Wordmark = styled(Link)`
  font-family: ${(p) => p.theme.font.serif};
  font-weight: 600;
  font-size: 32px;
  letter-spacing: -0.01em;
  color: ${(p) => p.theme.color.ink};
  line-height: 1;

  &:hover {
    color: ${(p) => p.theme.color.ink};
  }

  @media (max-width: ${(p) => p.theme.breakpoint.mobile}) {
    font-size: 26px;
    margin: 0 auto;
  }
`;

export const SearchBox = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 16px;
  border: 1px solid ${(p) => p.theme.color.borderStrong};
  border-radius: ${(p) => p.theme.radius.input};
  color: ${(p) => p.theme.color.inkMuted};
  background: ${(p) => p.theme.color.surface};
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &:focus-within {
    border-color: ${(p) => p.theme.color.brass};
    box-shadow: 0 0 0 3px rgba(176, 141, 87, 0.18);
  }

  input {
    flex: 1;
    border: 0;
    background: none;
    padding: 12px 0;
    font-family: ${(p) => p.theme.font.sans};
    font-size: 14px;
    color: ${(p) => p.theme.color.ink};

    &::placeholder {
      color: ${(p) => p.theme.color.inkMuted};
    }

    &:focus {
      outline: none;
      box-shadow: none;
    }
  }

  @media (max-width: ${(p) => p.theme.breakpoint.mobile}) {
    display: none;
  }
`;

export const Actions = styled.div`
  display: flex;
  align-items: center;
  gap: 22px;
  color: ${(p) => p.theme.color.ink};

  .action {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: ${(p) => p.theme.color.ink};
    background: none;
    border: 0;
    padding: 0;
    cursor: pointer;
    line-height: 1;

    &:hover {
      color: ${(p) => p.theme.color.brassDark};
    }
  }

  .login {
    color: ${(p) => p.theme.color.brassDark};
    font-weight: 600;
  }

  .badge-wrap {
    position: relative;
    display: inline-flex;
  }

  .badge {
    position: absolute;
    top: -8px;
    right: -10px;
    min-width: 18px;
    height: 18px;
    padding: 0 5px;
    border-radius: 999px;
    background: ${(p) => p.theme.color.brass};
    color: ${(p) => p.theme.color.surface};
    font-size: 11px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  @media (max-width: ${(p) => p.theme.breakpoint.mobile}) {
    gap: 16px;

    .label {
      display: none;
    }
  }
`;

export const CategoryRow = styled.nav`
  display: flex;
  gap: 30px;
  padding-bottom: 16px;
  font-size: 14px;
  color: ${(p) => p.theme.color.bodyText};
  overflow-x: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }

  a {
    color: ${(p) => p.theme.color.bodyText};
    white-space: nowrap;

    &:hover {
      color: ${(p) => p.theme.color.brassDark};
    }
  }

  .catalog {
    color: ${(p) => p.theme.color.ink};
    font-weight: 600;
  }

  @media (max-width: ${(p) => p.theme.breakpoint.mobile}) {
    display: none;
  }
`;

export const IconButton = styled.button`
  display: none;
  border: 0;
  background: none;
  padding: 6px;
  color: ${(p) => p.theme.color.ink};
  cursor: pointer;
  line-height: 0;

  @media (max-width: ${(p) => p.theme.breakpoint.mobile}) {
    display: inline-flex;
  }
`;

/* Mobil menyu — chapdan ochiluvchi panel + scrim */
export const Scrim = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(33, 28, 22, 0.45);
  z-index: 40;
  opacity: ${(p) => (p.$open ? 1 : 0)};
  pointer-events: ${(p) => (p.$open ? 'auto' : 'none')};
  transition: opacity 0.25s ease;
`;

export const Drawer = styled.aside`
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  width: min(320px, 86vw);
  background: ${(p) => p.theme.color.surface};
  z-index: 41;
  transform: translateX(${(p) => (p.$open ? '0' : '-105%')});
  transition: transform 0.28s cubic-bezier(0.2, 0.8, 0.2, 1);
  display: flex;
  flex-direction: column;
  padding: 18px 20px 28px;
  overflow-y: auto;

  .drawer-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;

    .mark {
      font-family: ${(p) => p.theme.font.serif};
      font-weight: 600;
      font-size: 26px;
      color: ${(p) => p.theme.color.ink};
    }

    button {
      border: 0;
      background: none;
      padding: 6px;
      color: ${(p) => p.theme.color.ink};
      cursor: pointer;
      line-height: 0;
    }
  }

  .group-label {
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: ${(p) => p.theme.color.brassDark};
    margin: 18px 0 10px;
  }

  .drawer-links {
    display: flex;
    flex-direction: column;
    gap: 12px;
    font-size: 15px;

    a {
      color: ${(p) => p.theme.color.ink};
    }
  }

  .drawer-search {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 10px 0 4px;
    padding: 0 14px;
    border: 1px solid ${(p) => p.theme.color.borderStrong};
    border-radius: ${(p) => p.theme.radius.input};
    color: ${(p) => p.theme.color.inkMuted};

    input {
      flex: 1;
      border: 0;
      background: none;
      padding: 11px 0;
      font-family: ${(p) => p.theme.font.sans};
      font-size: 14px;
      color: ${(p) => p.theme.color.ink};

      &::placeholder {
        color: ${(p) => p.theme.color.inkMuted};
      }

      &:focus {
        outline: none;
        box-shadow: none;
      }
    }
  }

  .drawer-foot {
    margin-top: auto;
    padding-top: 24px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    align-items: flex-start;

    .phone {
      font-size: 15px;
      font-weight: 600;
      color: ${(p) => p.theme.color.ink};
    }
  }
`;
