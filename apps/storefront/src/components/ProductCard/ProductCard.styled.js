import styled from 'styled-components';

export const CardWrap = styled.article`
  position: relative;
  background: ${(p) => p.theme.color.surface};
  border: 1px solid ${(p) => p.theme.color.border};
  border-radius: ${(p) => p.theme.radius.card};
  overflow: hidden;
  transition: border-color 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease;

  &:hover {
    border-color: rgba(176, 141, 87, 0.4);
    box-shadow: ${(p) => p.theme.shadow.lg};
    transform: translateY(-4px);
  }

  &:hover .glow {
    opacity: 1;
  }

  a.cover {
    position: absolute;
    inset: 0;
    z-index: 1;
  }
`;

export const ImageBox = styled.div`
  position: relative;
  aspect-ratio: 4 / 5;
  overflow: hidden;
  ${(p) => p.$dim && 'filter: saturate(.6);'}

  .img-frame {
    position: absolute;
    inset: 0;
  }

  .glow {
    position: absolute;
    inset: 0;
    background: ${(p) => p.theme.productGlow};
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
    z-index: 1;
  }
`;

export const Badge = styled.span`
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 2;
  padding: 5px 11px;
  border-radius: ${(p) => p.theme.radius.pill};
  font-size: 12px;
  font-weight: 600;
  background: ${(p) => (p.$tone === 'oos' ? 'rgba(167,158,144,.92)' : p.theme.color.ink)};
  color: ${(p) => (p.$tone === 'oos' ? p.theme.color.surface : p.theme.color.base)};
`;

export const FavButton = styled.button`
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 2;
  width: 36px;
  height: 36px;
  border-radius: 999px;
  border: 0;
  background: rgba(251, 248, 242, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${(p) => p.theme.color.brassDark};
  cursor: pointer;
`;

export const Body = styled.div`
  padding: 16px 16px 18px;
  ${(p) => p.$dim && 'opacity: .7;'}

  .brand {
    font-size: 11px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: ${(p) => p.theme.color.inkMuted};
    min-height: 14px;
  }

  .name {
    font-family: ${(p) => p.theme.font.serif};
    font-size: 22px;
    line-height: 1.15;
    color: ${(p) => p.theme.color.ink};
    margin: 4px 0 10px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .dots {
    margin-bottom: 12px;
    min-height: 12px;
  }
`;

export const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;

  .price {
    font-size: 17px;
    font-weight: 600;
    color: ${(p) => (p.$muted ? p.theme.color.inkMuted : p.theme.color.ink)};

    .unit {
      font-size: 13px;
      color: ${(p) => p.theme.color.inkMuted};
      font-weight: 500;
    }
  }

  .old {
    font-size: 13px;
    color: ${(p) => p.theme.color.outOfStock};
    text-decoration: line-through;
  }
`;

export const AddButton = styled.button`
  position: relative;
  z-index: 2;
  width: 40px;
  height: 40px;
  flex: none;
  border-radius: ${(p) => p.theme.radius.button};
  border: 0;
  background: ${(p) => p.theme.color.ink};
  color: ${(p) => p.theme.color.surface};
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: ${(p) => p.theme.color.brass};
  }

  &:disabled {
    opacity: 0.38;
    cursor: not-allowed;
  }
`;

export const NotifyButton = styled.button`
  position: relative;
  z-index: 2;
  width: 100%;
  margin-top: 12px;
  padding: 11px 14px;
  border-radius: ${(p) => p.theme.radius.button};
  border: 1.5px solid ${(p) => p.theme.color.brass};
  background: transparent;
  color: ${(p) => p.theme.color.brassDark};
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: rgba(176, 141, 87, 0.1);
  }
`;
