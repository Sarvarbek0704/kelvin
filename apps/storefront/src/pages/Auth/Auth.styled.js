import styled from 'styled-components';

/* Alohida auth ekrani — sayt chrome'siz (navbar/footer yo'q), to'liq viewport */
export const AuthScreen = styled.div`
  display: grid;
  grid-template-columns: 1fr 1.15fr;
  min-height: 100dvh;
  background: ${(p) => p.theme.color.surface};

  @media (max-width: ${(p) => p.theme.breakpoint.tablet}) {
    grid-template-columns: 1fr;
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
  padding: 48px clamp(32px, 6vw, 96px);
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
    align-self: flex-start;

    &:hover {
      color: ${(p) => p.theme.color.ink};
    }
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
    padding: 28px 24px;
    min-height: 180px;

    .pitch .title {
      font-size: 28px;
    }

    .pitch .text {
      display: none;
    }

    .bar {
      display: none;
    }
  }
`;

export const AuthFormSide = styled.div`
  position: relative;
  padding: 72px clamp(24px, 6vw, 96px) 48px;
  display: flex;
  flex-direction: column;
  justify-content: center;

  /* Yuqori o'ngda: saytga qaytish */
  .exit {
    position: absolute;
    top: 22px;
    right: clamp(24px, 6vw, 96px);
    font-size: 13px;
    font-weight: 600;
    color: ${(p) => p.theme.color.brassDark};
    background: none;
    border: 0;
    padding: 6px 0;
    cursor: pointer;

    &:hover {
      color: ${(p) => p.theme.color.linkHover};
    }
  }

  .form-col {
    width: 100%;
    max-width: 420px;
  }

  h1 {
    font-size: 38px;
    margin: 0 0 24px;
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 18px;
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
    padding: 64px 18px 40px;

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
