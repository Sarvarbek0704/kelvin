import styled from 'styled-components';

export const KatalogSection = styled.section`
  background: ${(p) => p.theme.color.deep};
  padding: 72px 0 56px;

  @media (max-width: ${(p) => p.theme.breakpoint.mobile}) {
    padding: 36px 0 28px;
  }
`;

export const CategoriesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;

  @media (max-width: ${(p) => p.theme.breakpoint.tablet}) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: ${(p) => p.theme.breakpoint.mobile}) {
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
`;

/* Oddiy plitka — rasm tepada, nom pastda */
export const Tile = styled.div`
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
    height: 110px;
    background: repeating-linear-gradient(
      135deg,
      #efe8dc,
      #efe8dc 11px,
      #e9e0d2 11px,
      #e9e0d2 22px
    );
    position: relative;
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .body {
    padding: 16px 18px;
  }

  .name {
    font-family: ${(p) => p.theme.font.serif};
    font-size: 22px;
    color: ${(p) => p.theme.color.ink};
  }

  .more {
    font-size: 12px;
    color: ${(p) => p.theme.color.inkMuted};
    margin-top: 2px;
  }

  @media (max-width: ${(p) => p.theme.breakpoint.mobile}) {
    .thumb {
      height: 76px;
    }

    .body {
      padding: 12px 14px;
    }

    .name {
      font-size: 19px;
    }

    .more {
      display: none;
    }
  }
`;

/* Katta (featured) plitka — 2 ustun, matn chapda, rasm o'ngda */
export const FeaturedTile = styled.div`
  grid-column: span 2;
  background: ${(p) => p.theme.color.surface};
  border: 1px solid ${(p) => p.theme.color.border};
  border-radius: ${(p) => p.theme.radius.card};
  overflow: hidden;
  display: flex;
  min-height: 200px;
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease;

  &:hover {
    border-color: rgba(176, 141, 87, 0.5);
    box-shadow: 0 18px 40px -22px rgba(83, 66, 40, 0.35);
    transform: translateY(-3px);
  }

  .info {
    flex: 1;
    padding: 26px 28px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }

  .name {
    font-family: ${(p) => p.theme.font.serif};
    font-size: 30px;
    color: ${(p) => p.theme.color.ink};
  }

  .sub {
    font-size: 13px;
    color: ${(p) => p.theme.color.inkMuted};
    margin-top: 4px;
  }

  .more {
    font-size: 13px;
    color: ${(p) => p.theme.color.brassDark};
    font-weight: 600;
  }

  .thumb {
    flex: 1;
    background: repeating-linear-gradient(
      135deg,
      #efe8dc,
      #efe8dc 11px,
      #e9e0d2 11px,
      #e9e0d2 22px
    );
    overflow: hidden;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  @media (max-width: ${(p) => p.theme.breakpoint.mobile}) {
    grid-column: span 2;
    min-height: 0;

    .info {
      padding: 16px 18px;
    }

    .name {
      font-size: 22px;
    }
  }
`;
