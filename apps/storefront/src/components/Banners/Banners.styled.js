import styled from 'styled-components';

/* HOME_HERO — keng promo-banner (aylanadigan), hero ostida */
export const HeroBannerSection = styled.section`
  padding: 8px 0 40px;
`;

export const BannerFrame = styled.div`
  position: relative;
  border-radius: ${(p) => p.theme.radius.card};
  overflow: hidden;
  border: 1px solid ${(p) => p.theme.color.border};
  height: 340px;

  @media (max-width: ${(p) => p.theme.breakpoint.tablet}) {
    height: 260px;
  }
  @media (max-width: ${(p) => p.theme.breakpoint.mobile}) {
    height: 200px;
  }

  .slide {
    position: absolute;
    inset: 0;
    opacity: 0;
    transition: opacity 0.6s ease;
    pointer-events: none;
  }
  .slide.active {
    opacity: 1;
    pointer-events: auto;
  }
  .slide img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .shade {
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, rgba(24, 18, 12, 0.72) 0%, rgba(24, 18, 12, 0.25) 55%, transparent 100%);
  }
  .content {
    position: absolute;
    left: 48px;
    top: 50%;
    transform: translateY(-50%);
    max-width: 46%;
    color: #f6efe3;

    @media (max-width: ${(p) => p.theme.breakpoint.mobile}) {
      left: 20px;
      max-width: 70%;
    }
  }
  .title {
    font-family: ${(p) => p.theme.font.serif};
    font-size: clamp(22px, 3vw, 38px);
    line-height: 1.15;
    margin-bottom: 18px;
  }
  .dots {
    position: absolute;
    left: 48px;
    bottom: 22px;
    display: flex;
    gap: 8px;

    @media (max-width: ${(p) => p.theme.breakpoint.mobile}) {
      left: 20px;
      bottom: 14px;
    }
  }
  .dots button {
    width: 26px;
    height: 4px;
    border: 0;
    border-radius: 2px;
    background: rgba(246, 239, 227, 0.35);
    cursor: pointer;
    transition: background 0.2s ease;
  }
  .dots button.on {
    background: ${(p) => p.theme.color.brass};
  }
`;

/* HOME_STRIP — ingichka aksiya chizig'i */
export const StripSection = styled.section`
  padding: 0 0 40px;
`;

export const StripCard = styled.div`
  position: relative;
  border-radius: ${(p) => p.theme.radius.card};
  overflow: hidden;
  border: 1px solid ${(p) => p.theme.color.border};
  height: 96px;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .shade {
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, rgba(24, 18, 12, 0.7), rgba(24, 18, 12, 0.2));
  }
  .content {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    padding: 0 32px;
    color: #f6efe3;
    font-family: ${(p) => p.theme.font.serif};
    font-size: clamp(16px, 2vw, 22px);

    @media (max-width: ${(p) => p.theme.breakpoint.mobile}) {
      padding: 0 16px;
    }
  }
`;
