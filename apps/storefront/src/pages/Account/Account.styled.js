import styled from 'styled-components';

/* Mehmon: ikki ustunli auth ekran (chap editorial panel + o'ng forma) —
   markazlashgan, mo''tadil kenglik, yumshoq soya */
export const AuthGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1.1fr;
  min-height: 560px;
  max-width: 1040px;
  border: 1px solid ${(p) => p.theme.color.border};
  border-radius: 18px;
  overflow: hidden;
  margin: 48px auto 72px;
  background: ${(p) => p.theme.color.surface};
  box-shadow: ${(p) => p.theme.shadow.md};

  @media (max-width: ${(p) => p.theme.breakpoint.tablet}) {
    grid-template-columns: 1fr;
    min-height: 0;
    margin: 16px auto 40px;
  }
`;

export const AuthAside = styled.div`
  position: relative;
  background: repeating-linear-gradient(
    135deg,
    #efe8dc,
    #efe8dc 16px,
    #e9e0d2 16px,
    #e9e0d2 32px
  );
  padding: 64px 56px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 32px;

  .glow {
    position: absolute;
    inset: 0;
    background: radial-gradient(50% 40% at 40% 35%, rgba(255, 180, 107, 0.28), transparent 72%);
  }

  .mark {
    position: relative;
    font-family: ${(p) => p.theme.font.serif};
    font-weight: 600;
    font-size: 34px;
    color: ${(p) => p.theme.color.ink};
  }

  .pitch {
    position: relative;
  }

  .pitch .title {
    font-family: ${(p) => p.theme.font.serif};
    font-size: 44px;
    line-height: 1.1;
    color: ${(p) => p.theme.color.ink};
  }

  .pitch .text {
    font-size: 15px;
    color: ${(p) => p.theme.color.bodyText};
    margin-top: 14px;
    max-width: 320px;
    line-height: 1.6;
  }

  .bar {
    position: relative;
    height: 6px;
    border-radius: 999px;
    background: ${(p) => p.theme.gradient};
    max-width: 280px;
  }

  @media (max-width: ${(p) => p.theme.breakpoint.tablet}) {
    padding: 40px 24px;
    min-height: 200px;

    .pitch .title {
      font-size: 30px;
    }

    .bar {
      display: none;
    }
  }
`;

export const AuthForm = styled.div`
  padding: 48px 56px;
  display: flex;
  flex-direction: column;
  justify-content: center;

  h1 {
    font-size: 38px;
    margin: 0 0 24px;
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 18px;
    max-width: 400px;
  }

  /* Parol maydoni + ko'rsatish tugmasi */
  .pass-wrap {
    position: relative;

    input {
      padding-right: 48px;
    }

    .eye {
      position: absolute;
      right: 8px;
      bottom: 6px;
      width: 36px;
      height: 36px;
      border: 0;
      background: none;
      color: ${(p) => p.theme.color.inkMuted};
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;

      &:hover {
        color: ${(p) => p.theme.color.brassDark};
      }
    }
  }

  .forgot {
    align-self: flex-start;
    font-size: 13px;
    color: ${(p) => p.theme.color.brassDark};
    font-weight: 600;
    background: none;
    border: 0;
    padding: 0;
    cursor: pointer;

    &:hover {
      color: ${(p) => p.theme.color.linkHover};
    }
  }

  @media (max-width: ${(p) => p.theme.breakpoint.mobile}) {
    padding: 24px 18px 40px;

    h1 {
      font-size: 30px;
    }
  }
`;

/* Вход / Регистрация pill toggle */
export const TabToggle = styled.div`
  display: flex;
  gap: 6px;
  background: ${(p) => p.theme.color.deep};
  border-radius: 12px;
  padding: 5px;
  margin-bottom: 30px;
  max-width: 300px;

  button {
    flex: 1;
    padding: 11px;
    border-radius: 8px;
    border: 0;
    background: transparent;
    color: ${(p) => p.theme.color.bodyText};
    font-family: ${(p) => p.theme.font.sans};
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s ease, color 0.2s ease;

    &.active {
      background: ${(p) => p.theme.color.ink};
      color: ${(p) => p.theme.color.base};
    }
  }
`;

/* Kirgan foydalanuvchi: profil layout */
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
