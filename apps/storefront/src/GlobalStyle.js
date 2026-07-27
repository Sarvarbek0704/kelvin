import { createGlobalStyle } from 'styled-components';

/**
 * Kelvin — warm-boutique redesign global base.
 *
 * `index.css` reset'i (* box-sizing, margin/padding 0) saqlanadi; bu esa dizayn
 * bazasini beradi: fon, matn rangi/shrifti, sarlavha shrifti, link, fokus halqasi,
 * selection, skeleton shimmer, temperatura swatch ring animatsiyasi.
 *
 * ⚠️ Ko'rinish qatlami. Kod agenti buni kengaytiradi; data/logikaга tegmaydi.
 */
export const GlobalStyle = createGlobalStyle`
  :root {
    --kv-gradient: ${(p) => p.theme.gradient};
  }

  body {
    background: ${(p) => p.theme.color.base};
    color: ${(p) => p.theme.color.bodyText};
    font-family: ${(p) => p.theme.font.sans};
    font-size: 16px;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }

  h1, h2, h3, h4 {
    font-family: ${(p) => p.theme.font.serif};
    font-weight: 500;
    color: ${(p) => p.theme.color.ink};
    line-height: 1.1;
    text-wrap: pretty;
  }

  p { text-wrap: pretty; }

  a {
    color: ${(p) => p.theme.color.brassDark};
    text-decoration: none;
    transition: color 0.15s ease;
  }
  a:hover { color: ${(p) => p.theme.color.linkHover}; }

  ::selection {
    background: ${(p) => p.theme.color.brass};
    color: ${(p) => p.theme.color.surface};
  }

  /* Guruch fokus halqasi — klaviatura navigatsiyasi uchun (sichqonchada emas) */
  :focus-visible {
    outline: none;
    box-shadow: ${(p) => p.theme.focusRing};
    border-radius: 4px;
  }

  /* Skeleton shimmer (yuklash holati) */
  @keyframes kv-shimmer {
    0% { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }

  /* Small-caps kicker (bo'lim ustidagi belgi) — utility */
  .kv-kicker {
    font-family: ${(p) => p.theme.font.sans};
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: ${(p) => p.theme.color.brassDark};
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
`;

export default GlobalStyle;
