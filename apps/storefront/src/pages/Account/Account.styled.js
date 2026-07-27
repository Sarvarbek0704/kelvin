import styled from 'styled-components';

/* Kirgan foydalanuvchi: profil layout (auth alohida /auth sahifasida) */
export const ProfileGrid = styled.div`
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 32px;
  align-items: start;
  padding: 36px 0 64px;

  h1 {
    font-size: 40px;
    margin: 0 0 24px;
  }

  @media (max-width: ${(p) => p.theme.breakpoint.tablet}) {
    grid-template-columns: 1fr;
    padding: 20px 0 40px;

    h1 {
      font-size: 32px;
    }
  }
`;

export const ProfileNav = styled.aside`
  background: ${(p) => p.theme.color.surface};
  border: 1px solid ${(p) => p.theme.color.border};
  border-radius: ${(p) => p.theme.radius.card};
  padding: 24px;

  .who {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
  }

  .avatar {
    width: 48px;
    height: 48px;
    border-radius: 999px;
    background: ${(p) => p.theme.color.deep};
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: ${(p) => p.theme.font.serif};
    font-size: 22px;
    color: ${(p) => p.theme.color.brassDark};
    flex: none;
  }

  .name {
    font-weight: 600;
    font-size: 15px;
    color: ${(p) => p.theme.color.ink};
  }

  .contact {
    font-size: 12px;
    color: ${(p) => p.theme.color.inkMuted};
  }

  .nav {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .nav a,
  .nav button {
    display: block;
    width: 100%;
    text-align: left;
    padding: 11px 14px;
    border-radius: 8px;
    border: 0;
    background: transparent;
    font-family: ${(p) => p.theme.font.sans};
    font-size: 14px;
    color: ${(p) => p.theme.color.bodyText};
    cursor: pointer;

    &:hover {
      background: ${(p) => p.theme.color.deep};
    }

    &.active {
      background: ${(p) => p.theme.color.ink};
      color: ${(p) => p.theme.color.base};
      font-weight: 600;
    }

    &.muted {
      color: ${(p) => p.theme.color.inkMuted};
    }
  }
`;

export const ProfileCards = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;

  .card {
    background: ${(p) => p.theme.color.surface};
    border: 1px solid ${(p) => p.theme.color.border};
    border-radius: 12px;
    padding: 22px;
  }

  .cap {
    font-size: 12px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: ${(p) => p.theme.color.inkMuted};
    margin-bottom: 6px;
  }

  .val {
    font-size: 17px;
    font-weight: 600;
    color: ${(p) => p.theme.color.ink};
  }

  @media (max-width: ${(p) => p.theme.breakpoint.mobile}) {
    grid-template-columns: 1fr;
    gap: 12px;
  }
`;
