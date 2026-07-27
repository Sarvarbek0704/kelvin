import styled from 'styled-components';

export const BlogSection = styled.section`
  padding: 12px 0 76px;

  @media (max-width: ${(p) => p.theme.breakpoint.mobile}) {
    padding: 8px 0 40px;
  }
`;

export const BlogGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;

  @media (max-width: ${(p) => p.theme.breakpoint.mobile}) {
    grid-template-columns: 1fr;
    gap: 14px;
  }
`;

export const BlogCard = styled.article`
  background: ${(p) => p.theme.color.surface};
  border: 1px solid ${(p) => p.theme.color.border};
  border-radius: ${(p) => p.theme.radius.card};
  overflow: hidden;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;
  height: 100%;

  &:hover {
    border-color: rgba(176, 141, 87, 0.5);
    box-shadow: 0 18px 40px -22px rgba(83, 66, 40, 0.35);
    transform: translateY(-3px);
  }

  .thumb {
    height: 180px;
    position: relative;
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

    .glow {
      position: absolute;
      inset: 0;
      background: radial-gradient(60% 60% at 50% 40%, rgba(255, 180, 107, 0.25), transparent 70%);
    }
  }

  .body {
    padding: 22px;
  }

  .meta {
    font-size: 11px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: ${(p) => p.theme.color.inkMuted};
  }

  .title {
    font-family: ${(p) => p.theme.font.serif};
    font-size: 24px;
    line-height: 1.2;
    color: ${(p) => p.theme.color.ink};
    margin: 8px 0;
  }

  .excerpt {
    font-size: 14px;
    color: ${(p) => p.theme.color.bodyText};
    line-height: 1.6;
  }
`;
