import styled from 'styled-components';

export const JournalHead = styled.div`
  padding: 48px 0 20px;
  text-align: center;

  h1 {
    font-size: 56px;
    margin: 0;
  }

  .lead {
    font-size: 16px;
    color: ${(p) => p.theme.color.bodyText};
    max-width: 480px;
    margin: 14px auto 0;
    line-height: 1.6;
  }

  .bar {
    height: 6px;
    border-radius: 999px;
    background: ${(p) => p.theme.gradient};
    margin: 24px auto 0;
    max-width: 260px;
  }

  @media (max-width: ${(p) => p.theme.breakpoint.mobile}) {
    padding: 24px 0 8px;

    h1 {
      font-size: 34px;
    }

    .bar {
      max-width: 160px;
    }
  }
`;

export const Featured = styled.article`
  background: ${(p) => p.theme.color.surface};
  border: 1px solid ${(p) => p.theme.color.border};
  border-radius: 16px;
  overflow: hidden;
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  margin: 32px 0 28px;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;

  &:hover {
    border-color: rgba(176, 141, 87, 0.5);
    box-shadow: 0 20px 44px -22px rgba(83, 66, 40, 0.4);
    transform: translateY(-3px);
  }

  .visual {
    min-height: 320px;
    background: repeating-linear-gradient(
      135deg,
      #efe8dc,
      #efe8dc 14px,
      #e9e0d2 14px,
      #e9e0d2 28px
    );
    position: relative;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      position: absolute;
      inset: 0;
    }

    .glow {
      position: absolute;
      inset: 0;
      background: radial-gradient(50% 46% at 45% 40%, rgba(255, 180, 107, 0.3), transparent 72%);
    }
  }

  .content {
    padding: 44px 40px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .meta {
    font-size: 11px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: ${(p) => p.theme.color.brassDark};
  }

  h2 {
    font-size: 40px;
    line-height: 1.1;
    margin: 12px 0 14px;
  }

  .excerpt {
    font-size: 16px;
    line-height: 1.7;
    color: ${(p) => p.theme.color.bodyText};
    margin: 0 0 20px;
  }

  .read {
    font-size: 14px;
    color: ${(p) => p.theme.color.brassDark};
    font-weight: 600;
    border-bottom: 1.5px solid ${(p) => p.theme.color.brass};
    padding-bottom: 2px;
    align-self: flex-start;
  }

  @media (max-width: ${(p) => p.theme.breakpoint.mobile}) {
    grid-template-columns: 1fr;
    margin: 20px 0;

    .visual {
      min-height: 180px;
    }

    .content {
      padding: 22px 18px 26px;
    }

    h2 {
      font-size: 27px;
    }
  }
`;

export const ArticlesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  padding-bottom: 64px;

  @media (max-width: ${(p) => p.theme.breakpoint.tablet}) {
    grid-template-columns: 1fr 1fr;
  }

  @media (max-width: ${(p) => p.theme.breakpoint.mobile}) {
    grid-template-columns: 1fr;
    gap: 14px;
    padding-bottom: 40px;
  }
`;

export const ArticleCard = styled.article`
  background: ${(p) => p.theme.color.surface};
  border: 1px solid ${(p) => p.theme.color.border};
  border-radius: ${(p) => p.theme.radius.card};
  overflow: hidden;
  height: 100%;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;

  &:hover {
    border-color: rgba(176, 141, 87, 0.5);
    box-shadow: 0 18px 40px -22px rgba(83, 66, 40, 0.35);
    transform: translateY(-3px);
  }

  .thumb {
    height: 200px;
    background: repeating-linear-gradient(
      135deg,
      #efe8dc,
      #efe8dc 12px,
      #e9e0d2 12px,
      #e9e0d2 24px
    );
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .body {
    padding: 24px;
  }

  .meta {
    font-size: 11px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: ${(p) => p.theme.color.inkMuted};
  }

  h3 {
    font-size: 26px;
    line-height: 1.2;
    margin: 10px 0;
  }

  .excerpt {
    font-size: 14px;
    color: ${(p) => p.theme.color.bodyText};
    line-height: 1.6;
    margin: 0;
  }
`;
