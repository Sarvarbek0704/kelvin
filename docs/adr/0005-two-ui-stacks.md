# ADR-0005 — Storefront va admin uchun ikki xil UI stack

- **Holat:** Qabul qilingan
- **Sana:** 2026-07-15

## Kontekst

Kelvin'da ikki frontend bor:

**`apps/storefront`** — mijoz uchun onlayn do'kon.

- Dizayn **mavjud va tayyor**: loyiha egasining ustozi bergan Figma
- **~8 700 qator styled-components** allaqachon yozilgan
- 12 sahifa, ~20 SVG ikonka, responsive layout
- Dizayn **o'zgarmaydi** (faqat brend nomi va logotip Kelvin'ga o'zgardi)

**`apps/admin`** — do'kon xodimlari uchun.

- Dizayn **yo'q**
- Kerak: jadval (server-side pagination/sort/filter), forma, fayl yuklash, dashboard
- Foydalanuvchi: sotuvchi, ombor xodimi, buxgalter — kuniga soatlab ishlaydi

Tabiiy savol: bitta UI stack ishlatilsinmi?

## Qaror

**Yo'q. Ikki xil stack:**

| App          | Stack                  | Sabab                                                              |
| ------------ | ---------------------- | ------------------------------------------------------------------ |
| `storefront` | styled-components 6    | **Allaqachon yozilgan.** O'zgartirish = 8 700 qatorni qayta yozish |
| `admin`      | shadcn/ui + Tailwind 4 | Dizayn yo'q. Tayyor komponent kerak                                |

## Sabablar

### Nega storefront'ni Tailwind'ga ko'chirmaymiz

8 700 qator styled-components'ni Tailwind'ga ko'chirish:

- Bir necha hafta ish
- Piksel-darajadagi regressiya xavfi (dizayn Figma'ga aniq mos kelishi kerak)
- **Nol funksional foyda** — mijoz farqni ko'rmaydi
- Loyihaning haqiqiy muammosi bu emas: storefront **statik**, uni jonlantirish kerak (state, API, savat). Stack almashtirish bu muammoni hal qilmaydi

Bu klassik "rewrite for the sake of consistency" tuzog'i.

### Nega admin'ni styled-components'da yozmaymiz

Admin'da ~40 ekran kerak: mahsulot jadvali, buyurtma jadvali, ombor, mijoz, hisobot, sozlama.

styled-components bilan har bir jadval, modal, dropdown, date picker, multi-select **qo'lda yoziladi**. Bu haftalab ish va u ishning natijasi — do'kon xodimi ko'radigan ichki panel.

shadcn/ui bilan: `npx shadcn add table` va jadval tayyor — accessible, klaviatura bilan ishlaydigan, sortable.

**Admin'da tezlik > go'zallik.** Do'kon xodimi chiroyli animatsiya emas, tez ishlaydigan jadval istaydi.

### Nega aynan shadcn/ui

- Komponentlar **kodga ko'chiriladi**, npm paketi emas → to'liq nazorat, versiya konflikti yo'q
- Radix UI ustida → accessibility tayyor (klaviatura, ARIA, focus trap)
- Tailwind → tez yozish
- Bepul, ochiq kod

## Oqibatlar

**Ijobiy:**

- Storefront tegilmaydi — regressiya xavfi nol
- Admin tez quriladi
- Har app o'z ehtiyojiga mos vositani ishlatadi
- `packages/contracts` (API tiplari) baribir umumiy — muhim qism baham ko'riladi

**Salbiy:**

- **Ikki xil CSS paradigmasi bitta repoda.** Yangi dasturchi ikkalasini bilishi kerak
- Bundle: har app o'z CSS runtime'ini olib yuradi (lekin ular alohida build — bir-biriga ta'sir qilmaydi)
- Umumiy komponent (masalan `<Button>`) **baham ko'rilmaydi** — har app'da o'zinikisi. Bu takrorlanish, lekin ataylab: storefront tugmasi Figma'ga bo'ysunadi, admin tugmasi funksiyaga
- `packages/ui` yaratish vasvasasi paydo bo'ladi — **qarshi turish kerak**. Ikki xil dizayn tili uchun umumiy komponent kutubxonasi ikkalasiga ham yaramaydi

**Eng katta xavf:** kimdir "izchillik" nomi bilan storefront'ni Tailwind'ga ko'chirishni taklif qiladi. Bu ADR shunga javob.

## Qachon qayta ko'riladi

| Signal                                                       | Chora                                                                         |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| Storefront dizayni butunlay qayta ishlanadi                  | Unda stack tanlovi qaytadan ochiladi                                          |
| Jamoa 5+ frontend dasturchi                                  | Izchillik narxi oshadi — qayta baholash                                       |
| Storefront'da murakkab widget kerak (date picker, data grid) | Radix'ni styled-components bilan ishlatish mumkin — bu chegara buzilishi emas |

## Havolalar

- [13-frontend-spec.md](../13-frontend-spec.md)
- [02-architecture.md §3](../02-architecture.md#3-monorepo)
