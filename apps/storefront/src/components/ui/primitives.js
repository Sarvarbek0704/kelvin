import styled, { css } from 'styled-components';

/**
 * Warm-boutique umumiy styled primitivlar (design-handoff Design System).
 * Faqat ko'rinish — data yo'q. Har bir sahifa shulardan quradi.
 */

// ---------- Layout ----------

export const Container = styled.div`
  max-width: ${(p) => p.theme.layout.maxWidth};
  margin: 0 auto;
  padding: 0 ${(p) => p.theme.layout.pagePad};

  @media (max-width: ${(p) => p.theme.breakpoint.mobile}) {
    padding: 0 ${(p) => p.theme.layout.pagePadMobile};
  }
`;

export const Kicker = styled.div`
  font-family: ${(p) => p.theme.font.sans};
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: ${(p) => p.theme.color.brassDark};
`;

export const Hairline = styled.div`
  height: 1px;
  background: ${(p) => p.theme.hairline};
`;

export const GradientBar = styled.div`
  height: ${(p) => p.$height ?? '4px'};
  border-radius: ${(p) => p.theme.radius.pill};
  background: ${(p) => p.theme.gradient};
`;

export const PageTitle = styled.h1`
  font-size: 44px;
  line-height: 1.08;
  margin: 0;

  @media (max-width: ${(p) => p.theme.breakpoint.mobile}) {
    font-size: 34px;
  }
`;

// ---------- Buttons ----------

const buttonVariants = {
  ink: css`
    background: ${(p) => p.theme.color.ink};
    color: ${(p) => p.theme.color.surface};
    border: 0;
    &:hover:not(:disabled) {
      background: #3a3025;
    }
    &:active:not(:disabled) {
      background: #171310;
    }
  `,
  brass: css`
    background: ${(p) => p.theme.color.brass};
    color: ${(p) => p.theme.color.surface};
    border: 0;
    &:hover:not(:disabled) {
      background: #9c7b48;
    }
    &:active:not(:disabled) {
      background: ${(p) => p.theme.color.brassDark};
    }
  `,
  outline: css`
    background: transparent;
    color: ${(p) => p.theme.color.brassDark};
    border: 1.5px solid ${(p) => p.theme.color.brass};
    &:hover:not(:disabled) {
      background: rgba(176, 141, 87, 0.1);
    }
    &:active:not(:disabled) {
      background: rgba(176, 141, 87, 0.18);
      border-color: ${(p) => p.theme.color.brassDark};
      color: ${(p) => p.theme.color.linkHover};
    }
  `,
};

export const Button = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: ${(p) => (p.$size === 'sm' ? '44px' : '48px')};
  padding: ${(p) => (p.$size === 'sm' ? '11px 20px' : '13px 26px')};
  border-radius: ${(p) => p.theme.radius.button};
  font-family: ${(p) => p.theme.font.sans};
  font-size: ${(p) => (p.$size === 'sm' ? '14px' : '15px')};
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;
  ${(p) => buttonVariants[p.$variant] ?? buttonVariants.ink}
  ${(p) =>
    p.$full &&
    css`
      width: 100%;
    `}

  &:disabled {
    opacity: 0.38;
    cursor: not-allowed;
  }
`;

export const TextLink = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 0;
  border: 0;
  background: none;
  color: ${(p) => p.theme.color.brassDark};
  font-family: ${(p) => p.theme.font.sans};
  font-size: 15px;
  font-weight: 600;
  border-bottom: 1.5px solid ${(p) => p.theme.color.brass};
  border-radius: 0;
  cursor: pointer;
  transition: color 0.15s ease, border-color 0.15s ease;

  &:hover {
    color: ${(p) => p.theme.color.linkHover};
    border-color: ${(p) => p.theme.color.linkHover};
  }
`;

// ---------- Chips ----------

/** IP / tsokol chip — guruch konturli pill. */
export const SpecChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: ${(p) => p.theme.radius.pill};
  border: 1px solid ${(p) => p.theme.color.brass};
  color: ${(p) => p.theme.color.brassDark};
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
`;

const statusTones = {
  success: css`
    background: rgba(110, 125, 82, 0.14);
    color: #4f5c3b;
  `,
  warning: css`
    background: rgba(192, 138, 45, 0.15);
    color: #8a6220;
  `,
  muted: css`
    background: rgba(167, 158, 144, 0.2);
    color: #6f675b;
  `,
  ink: css`
    background: ${(p) => p.theme.color.ink};
    color: ${(p) => p.theme.color.base};
  `,
  brass: css`
    background: rgba(176, 141, 87, 0.16);
    color: ${(p) => p.theme.color.brassDark};
  `,
};

/** Holat chip — "В наличии" / "Осталось 2" / "Нет в наличии" / "−15%". */
export const StatusChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 14px;
  border-radius: ${(p) => p.theme.radius.pill};
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  ${(p) => statusTones[p.$tone] ?? statusTones.muted}

  &::before {
    content: ${(p) => (p.$dot ? "''" : 'none')};
    width: 7px;
    height: 7px;
    border-radius: 999px;
    background: currentColor;
  }
`;

/** Aktiv filtr chipi — deep fonli, × bilan olib tashlanadi. */
export const FilterChip = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 12px;
  border: 0;
  border-radius: ${(p) => p.theme.radius.pill};
  background: ${(p) => p.theme.color.deep};
  color: ${(p) => p.theme.color.ink};
  font-family: ${(p) => p.theme.font.sans};
  font-size: 13px;
  cursor: pointer;

  .x {
    color: ${(p) => p.theme.color.brassDark};
    font-weight: 700;
  }
`;

// ---------- Card ----------

export const Card = styled.div`
  background: ${(p) => p.theme.color.surface};
  border: 1px solid ${(p) => p.theme.color.border};
  border-radius: ${(p) => p.theme.radius.card};
`;

// ---------- Forms ----------

export const FieldLabel = styled.label`
  display: block;
  font-size: 13px;
  color: ${(p) => p.theme.color.bodyText};
  margin-bottom: 8px;
`;

const fieldBase = css`
  width: 100%;
  padding: 13px 14px;
  border: 1px solid
    ${(p) => (p.$error ? p.theme.color.error : p.theme.color.borderStrong)};
  border-radius: ${(p) => p.theme.radius.input};
  background: ${(p) => p.theme.color.surface};
  font-family: ${(p) => p.theme.font.sans};
  font-size: 15px;
  color: ${(p) => p.theme.color.ink};
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &::placeholder {
    color: ${(p) => p.theme.color.inkMuted};
  }

  &:focus {
    outline: none;
    border-color: ${(p) => (p.$error ? p.theme.color.error : p.theme.color.brass)};
    box-shadow: 0 0 0 3px rgba(176, 141, 87, 0.18);
  }
`;

export const Input = styled.input`
  ${fieldBase}
`;

export const Select = styled.select`
  ${fieldBase}
  appearance: none;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%238A8175' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'><path d='m6 9 6 6 6-6'/></svg>");
  background-repeat: no-repeat;
  background-position: right 14px center;
  padding-right: 40px;
  cursor: pointer;
`;

export const Textarea = styled.textarea`
  ${fieldBase}
  min-height: 88px;
  resize: vertical;
`;

export const FieldError = styled.div`
  font-size: 12px;
  color: ${(p) => p.theme.color.error};
  margin-top: 6px;
`;

// ---------- Feedback ----------

export const skeletonShimmer = css`
  background: linear-gradient(90deg, #eee7db 8%, #e3dacb 18%, #eee7db 33%);
  background-size: 840px 100%;
  animation: kv-shimmer 1.4s infinite linear;
`;

export const Skeleton = styled.div`
  ${skeletonShimmer}
  height: ${(p) => p.$h ?? '16px'};
  width: ${(p) => p.$w ?? '100%'};
  border-radius: ${(p) => p.$r ?? '4px'};
`;

export const Toast = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  border-radius: ${(p) => p.theme.radius.button};
  padding: 14px 18px;
  font-size: 14px;
  ${(p) =>
    p.$tone === 'error'
      ? css`
          background: ${p.theme.color.surface};
          border: 1px solid ${p.theme.color.error};
          color: ${p.theme.color.ink};
        `
      : css`
          background: ${p.theme.color.ink};
          color: ${p.theme.color.base};
          box-shadow: 0 14px 34px -14px rgba(83, 66, 40, 0.5);
        `}

  .badge {
    width: 22px;
    height: 22px;
    border-radius: 999px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex: none;
    color: ${(p) => p.theme.color.base};
    background: ${(p) =>
      p.$tone === 'error' ? p.theme.color.error : p.theme.color.success};
    font-weight: 700;
  }
`;

// ---------- Pagination ----------

export const PageDot = styled.button`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: ${(p) => p.theme.font.sans};
  font-size: 14px;
  cursor: pointer;
  transition: border-color 0.15s ease;

  ${(p) =>
    p.$active
      ? css`
          background: ${p.theme.color.ink};
          color: ${p.theme.color.base};
          border: 0;
          font-weight: 600;
          cursor: default;
        `
      : css`
          background: transparent;
          color: ${p.theme.color.ink};
          border: 1px solid ${p.theme.color.borderStrong};
          &:hover:not(:disabled) {
            border-color: ${p.theme.color.brass};
          }
        `}

  &:disabled {
    opacity: 0.38;
    cursor: not-allowed;
  }
`;

// ---------- Breadcrumbs ----------

export const Crumbs = styled.nav`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 14px;
  color: ${(p) => p.theme.color.inkMuted};

  a {
    color: ${(p) => p.theme.color.brassDark};
  }

  .current {
    color: ${(p) => p.theme.color.ink};
  }
`;
