// ⚠️ Eski (redizayngacha) — ba'zi eski komponentlar hali import qiladi. TEGILMADI.
export const textColors = {
  primary: '#454545',
  secondary: '#45454550',
  white: '#ffffff',
};

export const bgColors = {
  primary: '#454545',
  secondary: '#45454550',
  lightBlue: '#f2f2f2',
};

/**
 * Kelvin — warm-boutique redesign theme tokens (styled-components ThemeProvider).
 *
 * Manba: design_handoff_kelvin_storefront/README.md ("Design tokens") + Design System.dc.html.
 * Komponentlarда `p.theme.color.brass`, `p.theme.font.serif` kabi ishlatiladi.
 *
 * ⚠️ Bu FAQAT ko'rinish qatlami. Data (src/lib/*), narx formati (money.js), backend — tegilmaydi.
 */
export const theme = {
  color: {
    base: '#F5F1EA', // sahifa foni (iliq suyak-qog'oz)
    surface: '#FBF8F2', // karta, input, panel
    deep: '#EBE4D8', // bo'lim ajratgichlari, ikkilamchi sirt
    ink: '#211C16', // asosiy matn, solid primary tugma
    inkMuted: '#8A8175', // ikkilamchi matn
    bodyText: '#575147', // paragraf matni
    bodyTextAlt: '#454036',
    brass: '#B08D57', // aksent, aktiv holat, hover border
    brassDark: '#8A6A3B', // kicker (small-caps), link, footer sarlavha
    linkHover: '#6E5327',
    footerInk: '#1B1712', // footer + 404 foni
    footerText: '#C9BFA9',
    // Semantik
    success: '#6E7D52', // "В наличии", to'langan/yetkazilgan
    warning: '#C08A2D', // "Осталось 2", "В доставке"
    error: '#A6483B', // forma xatosi, error toast
    outOfStock: '#A79E90', // disabled / sotuvda yo'q
    // Chegaralar
    border: 'rgba(138,106,59,.16)', // kartalar
    borderStrong: 'rgba(138,106,59,.3)', // input, chip
  },

  // Rang-harorat rampasi — signature gradient (chapdan o'ngga shu tartibda)
  temp: {
    2700: '#FFB46B', // issiq sham
    3000: '#FFD3A5', // yumshoq issiq
    4000: '#FFF0DA', // neytral
    5000: '#F3F6FF', // sovuq
    6500: '#DCE8FF', // kunduzgi sovuq
  },
  gradient: 'linear-gradient(90deg, #FFB46B, #FFD3A5, #FFF0DA, #F3F6FF, #DCE8FF)',
  // Bo'lim sarlavhalari ostidagi guruch hairline (height: 1px)
  hairline: 'linear-gradient(90deg, rgba(138,106,59,.55), rgba(138,106,59,0))',

  font: {
    serif: '"Cormorant Garamond", Georgia, "Times New Roman", serif', // H1–H4, mahsulot nomi
    sans: '"Golos Text", system-ui, -apple-system, sans-serif', // matn, UI, tugma, narx
  },

  radius: {
    card: '14px', // 12–16
    button: '10px',
    input: '10px',
    image: '14px',
    pill: '999px', // chip / swatch / pill
  },

  // Yumshoq, iliq soyalar
  shadow: {
    sm: '0 1px 2px rgba(83,66,40,.06)',
    md: '0 10px 30px -12px rgba(83,66,40,.22)',
    lg: '0 24px 50px -24px rgba(83,66,40,.4)', // product-card hover (+ translateY(-4px))
  },

  // 8px asos: 4, 8, 16, 24, 48, 96
  space: { xs: '4px', sm: '8px', md: '16px', lg: '24px', xl: '48px', xxl: '96px' },

  layout: {
    maxWidth: '1280px',
    pagePad: '40px', // desktop yon padding
    pagePadMobile: '16px',
    gutter: '24px',
  },

  // Fokus halqasi (guruch) — barcha interaktiv elementlar uchun
  focusRing: '0 0 0 2px #F5F1EA, 0 0 0 4px #B08D57',

  // Mahsulot kartasi hover'idagi iliq nur
  productGlow: 'radial-gradient(60% 50% at 50% 40%, rgba(255,180,107,.28), transparent 70%)',

  breakpoint: { mobile: '768px', tablet: '1024px' },
};

export default theme;
