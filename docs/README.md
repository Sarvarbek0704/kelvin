# Kelvin — Texnik topshiriq (TZ)

> Yoritish texnikasi do'koni uchun to'liq biznes tizimi.
> Bu papka loyihaning texnik topshirig'i. **Kod yozishdan oldin o'qiladi.**

---

## Avval buni o'qing

**Bu mebel do'koni emas.** Repo avval `furniture` deb nomlangan edi — bu xato. Dizayn footer'idagi kategoriyalar buni ochiq ko'rsatadi: Люстры, Споты, Светильники, Бра, Торшеры, Светодиодные ленты. Bu **yoritish texnikasi**.

**Bu bitta do'kon uchun.** Marketplace emas, SaaS emas. **Multi-tenant arxitektura kerak emas.**

---

## Qayerdan boshlash

| Siz                                | O'qing                                                                                               |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------- |
| **Loyiha bilan endi tanishyapsiz** | [00-vision-and-scope.md](./00-vision-and-scope.md) → [02-architecture.md](./02-architecture.md)      |
| **Kod yozishni boshlayapsiz**      | [02-architecture.md](./02-architecture.md) → [03-data-model.md](./03-data-model.md) → [adr/](./adr/) |
| **Mahsulot qarorini qidiryapsiz**  | [01-product-spec.md](./01-product-spec.md)                                                           |
| **"Nega bu shunday?"**             | [adr/](./adr/)                                                                                       |
| **Keyingi ish nima**               | [15-roadmap.md](./15-roadmap.md)                                                                     |

---

## Hujjatlar

### Poydevor

| #   | Hujjat                                             | Nima haqida                                                        |
| --- | -------------------------------------------------- | ------------------------------------------------------------------ |
| 00  | [Vizyon va qamrov](./00-vision-and-scope.md)       | Bu nima va nima EMAS. Loyihaning halol tarixi. Bloklovchi savollar |
| 01  | [Mahsulot spetsifikatsiyasi](./01-product-spec.md) | 9 persona, 17 modul uchun user story, 10×45 RBAC matritsasi, i18n  |
| 02  | [Arxitektura](./02-architecture.md)                | Monorepo, 17 modul, qatlamlar, outbox, buyurtma oqimi              |
| 03  | [Ma'lumotlar modeli](./03-data-model.md)           | ER, kritik qarorlar, index, saqlash muddati                        |
| 04  | [API spetsifikatsiyasi](./04-api-spec.md)          | REST konvensiyalari, RFC 9457, cursor pagination, idempotentlik    |

### Domen — loyihaning "go'shti"

| #   | Hujjat                                                    | Nima haqida                                                                          |
| --- | --------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| 05  | [Katalog va qidiruv](./05-catalog-and-search.md)          | Variant matritsasi, 15+ atribut, **faceted search**, trek mosligi, xona kalkulyatori |
| 06  | [Ombor va rezerv](./06-inventory-and-reservations.md)     | **← ENG NOZIK.** Oversell, race condition, atomik UPDATE, deadlock, TTL              |
| 07  | [Buyurtma va checkout](./07-order-and-checkout.md)        | Holat mashinasi, **saga va kompensatsiya**, narx snapshot'i                          |
| 08  | [To'lov va rassrochka](./08-payments-and-installments.md) | Click/Payme/Uzum, **rassrochka**, double-entry ledger, idempotentlik                 |

### Operatsiya va platforma

| #   | Hujjat                                                           | Nima haqida                                                                    |
| --- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| 09  | [Yetkazib berish va operatsiya](./09-delivery-and-operations.md) | Zona, slot, kuryer, **mo'rt tovar**, o'rnatish brigadasi                       |
| 10  | [CRM, POS, analitika](./10-crm-pos-analytics.md)                 | Mijoz, lid, RFM, offline kassa, ABC tahlil, 1C savoli                          |
| 11  | [Xavfsizlik](./11-security.md)                                   | STRIDE, Argon2id, refresh rotation, **ichki o'g'irlik**, narx manipulyatsiyasi |
| 12  | [Infratuzilma](./12-infrastructure.md)                           | Monorepo, Docker, deploy, backup. **Nega Kubernetes kerak emas**               |
| 13  | [Frontend](./13-frontend-spec.md)                                | Mavjud kodning halol inventarizatsiyasi. **SEO — eng qimmat savol**            |
| 14  | [Test strategiyasi](./14-testing-strategy.md)                    | Testcontainers, **concurrency test**, property-based                           |
| 15  | [Yo'l xaritasi](./15-roadmap.md)                                 | 11 faza, tayyorlik mezonlari, xavflar registri                                 |

### Qarorlar

| Papka          | Nima haqida                                                  |
| -------------- | ------------------------------------------------------------ |
| [adr/](./adr/) | **7 ta arxitektura qarori.** Nima, nega, va **nima evaziga** |

---

## Bu TZ ni qanday o'qish kerak

### Halollik shartnomasi

Bu hujjatlar loyihani sotmaydi. Har birida topasiz:

- **"Ochiq savollar"** bo'limi
- **⚠️ "tekshirilishi kerak"** — tasdiqlanmagan raqam yoki faraz
- **Salbiy oqibatlar** — har ADR'da majburiy
- **Yuridik masalalar** — maslahat sifatida EMAS, **bloker** sifatida

Raqam ko'rsangiz va yonida manba yoki "taxminiy" belgisi bo'lmasa — bu **xato**, tuzatilishi kerak.

### To'rtta haqiqat

**1. Hozirgi frontend statik.** 8 729 qator, shundan 6 313 (72%) — CSS. 48 komponentdan **faqat bittasida** `useState` bor. Savat ishlamaydi. `fetch` — nol marta. Bu **dizayn qobig'i**, ishlaydigan do'kon emas.

**2. Dizayn dizaynerniki.** Loyiha egasining ustozi bergan Figma. Faqat brend nomi va logotip o'zgardi (NORNLIGHT → Kelvin). Bu uyaladigan narsa emas — dizaynerning Figma'sini kodga aylantirish frontend dasturchining aynan ishi. Yagona qoida: uni o'zimizniki demaslik.

**3. Real do'kon yo'q.** Talablar farazga asoslangan. Bu eng katta xavf. SKU soni, kunlik buyurtma, rassrochka ulushi — hammasi noma'lum va TZ da shunday belgilangan.

**4. Bir kishi uchun bu ~45–85+ hafta.** Va bu baho — kafolat emas. Dasturchilar odatda 2–3 barobar past baholaydi.

---

## Bloklovchi ochiq savollar

Bular hal qilinmaguncha tegishli modul **prod'ga chiqmaydi**:

| Savol                                                      | Kimga                  | Bloklaydi                                                                      |
| ---------------------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------ |
| **Do'konning o'z rassrochkasi litsenziya talab qiladimi?** | **Yurist**             | `installment`                                                                  |
| Fiskal chek / soliqqa ma'lumot yuborish                    | **Yurist / buxgalter** | `payment`, `pos`                                                               |
| Shaxsiy ma'lumot: lokalizatsiya talabi                     | **Yurist**             | Hosting                                                                        |
| **SEO: Vite SPA yetarlimi yoki SSR kerakmi?**              | **Loyiha egasi**       | Frontend arxitekturasi                                                         |
| **1C haqiqat manbaimi?**                                   | Do'kon                 | Butun ma'lumot modeli                                                          |
| Tannarx: FIFO yoki o'rtacha?                               | Buxgalter              | Foyda hisobi, ombor modeli                                                     |
| SKU soni?                                                  | Do'kon                 | Meilisearch kerakmi ([ADR-0006](./adr/0006-meilisearch-for-faceted-search.md)) |
| Kuniga nechta buyurtma?                                    | Do'kon                 | Marshrut, slot, VRP kerakmi                                                    |

**SEO savoli eng qimmati.** Qanchalik kech hal qilinsa, shunchalik qimmatga tushadi. [13-frontend-spec.md](./13-frontend-spec.md).

---

## Manba fayllar

Ba'zi hujjatlar kodni **tushuntiradi**, almashtirmaydi. Ziddiyat bo'lsa kod g'olib:

| Hujjat                                          | Haqiqat manbai                                                            |
| ----------------------------------------------- | ------------------------------------------------------------------------- |
| [03-data-model.md](./03-data-model.md)          | [`apps/api/prisma/schema.prisma`](../apps/api/prisma/schema.prisma)       |
| [04-api-spec.md](./04-api-spec.md)              | `/api/docs` (OpenAPI, avtomatik)                                          |
| [02-architecture.md](./02-architecture.md) §4   | [`apps/api/.dependency-cruiser.cjs`](../apps/api/.dependency-cruiser.cjs) |
| [adr/0003](./adr/0003-money-as-bigint-tiyin.md) | [`apps/api/src/core/money/money.ts`](../apps/api/src/core/money/money.ts) |
