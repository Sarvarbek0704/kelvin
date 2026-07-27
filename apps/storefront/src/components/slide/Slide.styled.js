import styled from 'styled-components';

export const Hero = styled.section`
  display: grid;
  grid-template-columns: 1.05fr 1fr;
  align-items: stretch;
  border-bottom: 1px solid ${(p) => p.theme.color.border};

  @media (max-width: ${(p) => p.theme.breakpoint.tablet}) {
    grid-template-columns: 1fr;
  }
`;

export const HeroText = styled.div`
  padding: 76px 56px 76px ${(p) => p.theme.layout.pagePad};
  display: flex;
  flex-direction: column;
  justify-content: center;

  .kicker {
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: ${(p) => p.theme.color.brassDark};
    margin-bottom: 24px;
  }

  h1 {
    font-size: 72px;
    line-height: 1.02;
    letter-spacing: -0.01em;
    margin: 0;
  }

  .lead {
    font-size: 18px;
    line-height: 1.7;
    color: ${(p) => p.theme.color.bodyText};
    max-width: 440px;
    margin: 26px 0 20px;
  }

  .bar {
    height: 8px;
    border-radius: 999px;
    max-width: 440px;
    background: ${(p) => p.theme.gradient};
    margin-bottom: 32px;
  }

  .ctas {
    display: flex;
    gap: 14px;
    flex-wrap: wrap;
  }

  @media (max-width: ${(p) => p.theme.breakpoint.mobile}) {
    padding: 28px ${(p) => p.theme.layout.pagePadMobile} 24px;

    .kicker {
      margin-bottom: 14px;
    }

    h1 {
      font-size: 40px;
      line-height: 1.04;
    }

    .lead {
      font-size: 16px;
      margin: 16px 0 14px;
    }

    .bar {
      height: 6px;
      margin-bottom: 18px;
    }

    .ctas {
      flex-direction: column;

      button {
        width: 100%;
      }
    }
  }
`;

export const HeroVisual = styled.div`
  position: relative;
  min-height: 520px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: repeating-linear-gradient(
    135deg,
    #efe8dc,
    #efe8dc 14px,
    #e9e0d2 14px,
    #e9e0d2 28px
  );
  overflow: hidden;

  .glow {
    position: absolute;
    inset: 0;
    background: radial-gradient(50% 42% at 62% 40%, rgba(255, 180, 107, 0.35), transparent 72%);
  }

  img {
    position: relative;
    max-width: 74%;
    max-height: 86%;
    object-fit: contain;
  }

  @media (max-width: ${(p) => p.theme.breakpoint.tablet}) {
    min-height: 420px;
  }

  @media (max-width: ${(p) => p.theme.breakpoint.mobile}) {
    min-height: 0;
    aspect-ratio: 16 / 11;
    margin: 0 ${(p) => p.theme.layout.pagePadMobile} 18px;
    border-radius: ${(p) => p.theme.radius.image};
  }
`;

export const HeroCard = styled.div`
  position: absolute;
  left: 32px;
  bottom: 32px;
  background: rgba(251, 248, 242, 0.94);
  border-radius: 12px;
  padding: 14px 18px;
  box-shadow: 0 16px 40px -18px rgba(83, 66, 40, 0.4);

  .brand {
    font-size: 11px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: ${(p) => p.theme.color.inkMuted};
  }

  .name {
    font-family: ${(p) => p.theme.font.serif};
    font-size: 24px;
    color: ${(p) => p.theme.color.ink};
    margin: 2px 0 4px;
  }

  .more {
    font-size: 13px;
    font-weight: 600;
    color: ${(p) => p.theme.color.brassDark};
  }

  @media (max-width: ${(p) => p.theme.breakpoint.mobile}) {
    left: 14px;
    bottom: 14px;
    padding: 10px 14px;

    .name {
      font-size: 19px;
    }
  }
`;
