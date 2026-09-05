<!-- AUDIT-SUMMARY
loyiha: kelvin
sana: 2026-09-05
tayyorlik: 55
holat: ishlaydi
tz_bandlari: 49/109
build: ok
typecheck: ok
lint: ok
test: 38
kritik: 2
jiddiy: 13
kichik: 12
-->

# Kelvin — loyiha holati auditi

**Sana:** 2026-09-05 · **Tekshirilgan commit:** `fbd0406` (2026-08-04) · **Branch:** `main`

---

## 1. Bir qarashda

Kelvin — yoritish texnikasi uchun to'liq savdo platformasi: NestJS API (21 modul),
React storefront, React admin panel, pnpm monorepo. **Bu — portfeldagi eng jiddiy
muhandislik ishi.** Uchta asosiy texnik da'vo — atomik zaxira qilish, transactional
outbox, buyurtma sagasi — kodda **haqiqatan bor**, hujjatlangan (7 ta ADR) va real
Postgres/Redis konteynerlari ustida testlangan; integration testlarda **bitta ham mock
yo'q**. `install / typecheck / lint / test / build` — hammasi yashil, ikkala Dockerfile
ham haqiqatan quriladi, sayt jonli ishlaydi va Meilisearch qidiruvi jonli javob beradi.

Eng katta muammo — **jimgina oversell**: rezerv muddati (15 daqiqa) o'tgach, to'lov
tasdiqlansa, buyurtma `CONFIRMED` bo'ladi, lekin qoldiq na zaxiralanadi, na kamayadi
(`inventory.service.ts:363`). Naqd to'lov oqimida (kuryer keyinroq tasdiqlaydi) bu
**chekka holat emas, balki asosiy stsenariy**. Loyiha butun arxitekturasini shu
muammodan himoyalanishga qurgan — va oxirgi qadamda teshik qolgan.

Ikkinchi muammo — **jonli demo repodan orqada**: server 2026-07-27 da qurilgan image
bilan ishlaydi, unda 14 mahsulot va **birorta ham rasm yo'q**. Ish beruvchi ochib
ko'radigan sayt — repoda mavjud ishning eskirgan, rasmsiz versiyasi.

Asosiy tizimli bo'shliq — **tekshirish qatlami**: E2E testlar umuman yo'q, frontend'da
bitta ham test yo'q, mutation testing yo'q, SSR bo'lmagani uchun SEO/Telegram preview
DoD bandlari bajarilmagan.

---

## 2. Tekshiruv natijalari

Barchasi shu sessiyada **haqiqatan ishga tushirildi**. Exit kodlari alohida o'lchandi
(turbo chiqishi ichida yashiringan xatolar hisobga olindi).

| Bosqich | Buyruq | Natija | Izoh |
| --- | --- | --- | --- |
| Install | `pnpm install --frozen-lockfile` | ✅ **ok** (34.6s) | `cpu-features` optional dep xatosi — zararsiz |
| Typecheck | `pnpm typecheck` | ✅ **ok** (14.0s) | 5/5 paket toza |
| Lint (toza klon) | `pnpm lint` | ❌ **xato** — **2085 error**, 75 fayl | 62 tasi `src/`da. Sabab: `prisma generate` bajarilmagan |
| Lint (`db:generate` dan keyin) | `pnpm lint` | ✅ **ok** (18.0s) | 6/6 vazifa toza |
| Unit test | `pnpm test:unit` | ✅ **ok** — **139 test / 17 suite** | 17.4s |
| Integration test | `pnpm test:integration` | ⚠️ **ishga tushirilmadi** | Docker mavjud emas — quyida |
| Build | `pnpm build` | ✅ **ok** (27.5s) | 4/4. Storefront **161.7 KB gzip** (DoD ≤180 KB ✅) |
| `Dockerfile.api` | `docker build` (VPS'da) | ✅ **ok** — image 1.98 GB | Engine ogohlantirishi bilan (quyida) |
| `Dockerfile.web` | `docker build --target export` | ✅ **ok** — 560 KB dist | |

### 2.1 Nega integration testlar ishga tushmadi

Bu **loyiha nuqsoni emas, muhit nuqsoni**. Lokal mashinada:

```
wsl -d docker-desktop → WSL2 is not supported with your current machine configuration.
Error code: Wsl/Service/CreateInstance/CreateVm/HCS/HCS_E_HYPERV_NOT_INSTALLED
```

"Virtual Machine Platform" o'chirilgan → Docker Engine umuman ko'tarilmaydi →
Testcontainers ishlay olmaydi. Tuzatish: `wsl.exe --install --no-distribution` +
qayta yuklash (audit doirasidan tashqari).

**Buning o'rniga Dockerfile'lar VPS'da haqiqatan qurildi** (ikkalasi ham muvaffaqiyatli),
artefaktlar keyin tozalandi. Integration testlar kodi o'qib chiqildi (159 test) — natijasi
§6 da.

### 2.2 "Yangi dasturchi klon qilib ishga tushira oladimi?"

**Deyarli — bitta qadam yetishmaydi.** `pnpm install` dan keyin `prisma generate`
avtomatik bajarilmaydi (`postinstall` hook yo'q), shuning uchun toza klonda
`pnpm lint` **2085 xato** bilan yiqiladi. README'da bu qadam bor, lekin CI'dan
tashqarida odam buni o'tkazib yuboradi va loyihani "buzuq" deb hisoblaydi.

---

## 3. TZ muvofiqligi

O'lchov birligi — `docs/15-roadmap.md` dagi **Tayyorlik mezoni (DoD)** ro'yxatlari:
12 faza, **109 band**.

**Natija: ✅ 49 bajarilgan · 🟡 19 yarim · ❌ 41 bajarilmagan.**

### Faza 0 — Poydevor (6 ✅ / 5 🟡 / 2 ❌)

| Band | Holat | Izoh |
| --- | --- | --- |
| `pnpm install && pnpm dev` bir buyruqda | 🟡 | Install ✅; `dev` uchun DB kerak, lokalda Docker yo'q |
| `docker compose up` — PG+Redis+Meili | 🟡 | Fayl bor, lokalda tekshirilmadi; VPS'da ekvivalenti ishlaydi |
| Storefront monorepo'da, 12 sahifa regressiyasiz | ✅ | 18 route, build yashil |
| `/health` javob beradi | 🟡 | Kodda bor, **prodda yetib bo'lmaydi** (S-10) |
| `Money` property test `numRuns ≥ 10 000` | ❌ | Amalda **1000** (`money.spec.ts:116`) |
| Login/logout/refresh | ✅ | |
| Single-flight refresh testi | ✅ | `auth.spec.ts:252` |
| **Har mutatsiya `AuditLog` ga tushadi** | ❌ | 25 chaqiruv / 86 mutatsiya endpoint; **21 moduldan 5 tasi** (J-3) |
| Outbox: event yo'qolmaydi (test) | ✅ | `outbox.spec.ts` |
| CI yashil, < 10 min | 🟡 | Workflow bor, timeout 12/8/15 min |
| Testcontainers CI'da | ✅ | |
| Rebranding R-1..R-12 | 🟡 | `₽`→0 ✅, `nornlight`→0 ✅; **R-4** statik `lang="ru"` (S-3) |
| README dizayn muallifi | ✅ | `README.md:219` — halol ko'rsatilgan |

### Faza 1 — Katalog (6 ✅ / 1 🟡 / 2 ❌)

| Band | Holat | Izoh |
| --- | --- | --- |
| Kontent menejeri mahsulot qo'shadi | ✅ | Admin UI + variant matritsa generatori |
| 24 SKU bitta amalda | ✅ | `variant-matrix.spec.ts` |
| To'liq bo'lmagan matritsa | ✅ | |
| Rasm → avif/webp/LQIP | ✅ | `image-processor.spec.ts`, media pipeline |
| 11 kategoriya | ✅ | Jonli tekshirildi: **11 ta, 3 tilda to'liq** |
| 15+ atribut filtrlanadigan | 🟡 | Jonli javobda **11 facet guruhi** |
| Har mutatsiya AuditLog | ✅ | Catalog audit qiladi |
| Coverage `catalog` ≥ 75% | ❌ | Modul darajasida majburlanmagan (J-11) |
| E2E-4 | ❌ | E2E umuman yo'q |

### Faza 2 — Qidiruv (5 ✅ / 3 🟡 / 5 ❌)

| Band | Holat | Izoh |
| --- | --- | --- |
| Hardcode massiv — 0 ta | 🟡 | `FALLBACK_POSTS` — bosh sahifada soxta bloglar (S-4) |
| ProductDetail'da velosiped atributlari yo'q | ✅ | |
| 15+ atribut bo'yicha filtr | 🟡 | 11 facet |
| Facet count to'g'ri (o'zini istisno) | ✅ | Kodda va `search.spec.ts` da |
| Filtr URL'da (refresh/share/back) | ✅ | |
| Mobil drawer: focus trap, Escape | 🟡 | Tekshirilmadi (E2E yo'q) |
| Variant: mavjud bo'lmagan kombinatsiya disabled | ✅ | |
| **Uch til ishlaydi** | ❌ | Storefront'da **2 til** (`ru`, `uz`); `uz-Cyrl` yo'q (S-2) |
| Navbar qayta mount bo'lmaydi | ✅ | `RootLayout` |
| **ADR: Meilisearch vs PG — o'lchov raqamlari bilan** | ❌ | ADR-0006 da **o'lchov protokoli** bor, raqam yo'q |
| E2E-3 | ❌ | |
| RUM ma'lumot yig'a boshladi | ❌ | `web-vitals` yo'q (J-13) |
| Indeksatsiya lag < 5s o'lchangan | ❌ | O'lchov yo'q |

### Faza 3 — Savat va buyurtma (8 ✅ / 2 🟡 / 4 ❌)

| Band | Holat | Izoh |
| --- | --- | --- |
| **100 parallel, 1 tovar → aniq 1 muvaffaqiyat** | ✅ | `inventory.spec.ts:78` — real DB, chinakam qat'iy |
| Rad etilganlar to'g'ri sabab bilan | ✅ | `InsufficientStockError` tekshiriladi |
| **DB constraint: qoldiq manfiy bo'lmaydi** | ✅ | 3 ta CHECK migratsiyada |
| Property test: qoldiq manfiy emas | 🟡 | Property test yo'q; CHECK + concurrency test qoplaydi |
| Rezerv TTL tugagach bo'shatiladi | ✅ | Sweeper har daqiqa |
| Mehmon savati saqlanadi | ✅ | |
| Login'da savat birlashadi, konflikt ko'rsatiladi | 🟡 | `MergeSummary` bor; UI'da ko'rsatilishi tekshirilmadi |
| **2 tab parallel checkout → 1 buyurtma** | ✅ | `order.spec.ts:207` |
| Holat mashinasi property testi | ✅ | `order-state-machine.spec.ts` |
| Narx determinizmi property testi | ✅ | `pricing.engine.spec.ts` |
| E2E-1, E2E-2 | ❌ | |
| **SMS + Telegram xabari yetib boradi** | ❌ | Faqat `LogAdapter` — hech narsa yuborilmaydi (J-8) |
| Coverage `inventory`/`pricing` ≥ 90% | ❌ | Majburlanmagan |
| Mutation score ≥ 85% | ❌ | Stryker yo'q (J-11) |

### Faza 4 — To'lov (4 ✅ / 5 ❌)

| Band | Holat | Izoh |
| --- | --- | --- |
| Click orqali real to'lov | ❌ | Skelet bor, **merchant hisobi — tashqi bloker** |
| Payme | ❌ | Xuddi shunday |
| **Webhook 2 marta → 1 Payment** | ✅ | `payment.spec.ts:182` |
| **Ledger balansi = 0** | ✅ | `isBalanced()` + invariant testi |
| **Saga: to'lov o'tdi + tovar yo'q → kompensatsiya** | ❌ | **Hech qanday tarmoq yo'q — K-1/J-2** |
| Refund ishlaydi va ledger'da aks etadi | ✅ | To'liq + qisman refund testlari |
| E2E-1, E2E-2 to'lov bilan | ❌ | |
| Coverage `payment` ≥ 90% | ❌ | Majburlanmagan |
| Barcha pul `BigInt` tiyinda | ✅ | Sxemada ham, kodda ham toza |

### Faza 5 — Rassrochka (3 ✅ / 1 🟡 / 4 ❌)

| Band | Holat | Izoh |
| --- | --- | --- |
| `sum(principal)` property `numRuns ≥ 10 000` | 🟡 | Amalda **300** (`installment-calc.spec.ts:39`) |
| Sana chegaralari (31-yanvar + 1 oy) | ✅ | |
| Mijoz checkout'da grafikni ko'radi | ❌ | Storefront'da rassrochka oqimi yo'q |
| Grafik serverda hisoblanadi | ✅ | `core/installment/` |
| Provayder integratsiyasi (sandbox) | ❌ | Tashqi bloker |
| Admin kechikishni ko'radi | ✅ | `Installments.tsx` |
| Mutation score ≥ 85% | ❌ | |
| Yurist tasdig'i | ❌ | Tashqi bloker |

### Faza 6 — Ombor (5 ✅ / 3 ❌)

| Band | Holat | Izoh |
| --- | --- | --- |
| Ko'p ombor: qoldiq alohida | ✅ | |
| Rezerv ombor darajasida | ✅ | `(variant_id, warehouse_id)` |
| Kirim → `StockMovement` | ✅ | |
| Inventarizatsiya: farq + movement | ✅ | DELTA usuli |
| **Inventarizatsiya paytida sotuv concurrency** | ✅ | `inventory.spec.ts` |
| Shtrix-kod bilan qidiruv | ❌ | |
| Picking varaqasi | ❌ | |
| Coverage `inventory` ≥ 90% | ❌ | |

### Faza 7 — Yetkazib berish (4 ✅ / 2 🟡 / 1 ❌)

| Band | Holat | Izoh |
| --- | --- | --- |
| Slot tanlash, band slot ko'rinmaydi | ✅ | |
| **Slot sig'imi: concurrency** | ✅ | `delivery.spec.ts:64` — 20 parallel → aniq 3 |
| Zonaga qarab narx | ✅ | Checkout'da ishlaydi |
| Kuryer tayinlanadi | ✅ | Admin UI |
| O'rnatish alohida ish | 🟡 | Model bor, oqim to'liq emas |
| Mijoz kuzatadi, SMS keladi | 🟡 | Kuzatish ✅, SMS ❌ |
| E2E-6 | ❌ | |

### Faza 8 — POS (1 ✅ / 2 🟡 / 4 ❌)

| Band | Holat | Izoh |
| --- | --- | --- |
| Smena ochiladi/yopiladi, naqd hisobi | ✅ | |
| E2E-5 | ❌ | |
| **Offline: internet uzilsa sotuv davom etadi** | ❌ | Umuman yo'q (J-12) |
| Onlayn qaytgach sinxronizatsiya | ❌ | |
| Parallel POS (2 kassa, 1 tovar) | 🟡 | Qoldiq atomik, POS-ga xos test yo'q |
| Komissiya hisoblanadi | 🟡 | |
| Fiskal chek — yuridik talab | ❌ | Tashqi bloker |

### Faza 9 — CRM va analitika (5 ✅ / 1 🟡 / 1 ❌)

| Band | Holat | Izoh |
| --- | --- | --- |
| Mijoz bazasi, tarix | ✅ | |
| Lid voronkasi | ✅ | |
| RFM segmentlar (real ma'lumot ustida) | 🟡 | Hisob ✅, real ma'lumot yo'q |
| Sharh: faqat sotib olgan + moderatsiya | ✅ | `hasPurchased()` |
| Blog CRUD | ✅ | |
| Asosiy hisobotlar | ✅ | ABC tahlil |
| Og'ir hisobot — job orqali | ❌ | Sinxron |

### Faza 10 — SEO va performance (2 ✅ / 2 🟡 / 6 ❌)

| Band | Holat | Izoh |
| --- | --- | --- |
| Qaror qabul qilingan va ADR yozilgan | ❌ | SSR/Next.js bo'yicha ADR yo'q |
| **Mahsulot sahifasi HTML'da kontent bilan** | ❌ | `curl` → **1586 bayt bo'sh qobiq** |
| **Telegram'da havola preview** | ❌ | `og:title`/`og:image` — **0 ta** |
| JSON-LD to'g'ri | 🟡 | Bor, lekin **JS bilan** quyiladi |
| Sitemap dinamik, 3 til | ✅ | Jonli 200 |
| Canonical strategiyasi | 🟡 | |
| LCP/INP/CLS p75 RUM'da | ❌ | RUM yo'q |
| **Initial JS ≤ 180 KB gzip** | ✅ | **161.7 KB** |
| styled-components runtime o'lchangan | ❌ | |
| Search Console indeksatsiya | ❌ | |

### Faza 11 — Optimizatsiya (0 ✅ / 4 ❌)

Faza boshlanmagan: load test, bottleneck ro'yxati, oldin/keyin o'lchovlari — yo'q.

---

## 4. Dizayn muvofiqligi

Manba: `d:/GitHubim/design_prompts/kelvin.md` + `design-handoff/` (11 `.dc.html` ekran).

**Umumiy baho: yaxshi — token darajasida deyarli to'liq.**

| Talab | Holat | Dalil |
| --- | --- | --- |
| Rang tokenlari (9 ta aniq hex) | ✅ | 9/9 kodda mavjud (`theme.js`, `index.css`) |
| Tipografika: serif display + neytral sans | ✅ | Cormorant Garamond + Golos Text; **Golos** — Inter o'rniga, kirillcha uchun asosli almashtirish, izohda hujjatlangan |
| Rang harorati rampasi (2700K→6500K) | ✅ | `#FFB46B … #DCE8FF` tokenlarda |
| 10 ta ekran guruhi | ✅ | 18 route, barcha guruh qoplangan |
| Buyurtma detali + holat taymlayni | ✅ | `Orders/index.jsx:56` `OrderTimeline` |
| Bo'sh / yuklanish / xato holatlari | ✅ | Skeleton 5 faylda, empty-state 13 faylda |
| RU/UZ til almashtirgichi | ✅ | Navbar'da |
| Token intizomi | 🟡 | **17 ta qattiq hex 26 ta `.jsx` faylda** — qiymatlar palitraga mos, lekin `theme` chetlab o'tilgan |
| Mobil ko'rinish | 🟡 | Kod responsiv; E2E/vizual regressiya yo'q |
| Qorong'i rejim | — | Dizayn TZ da talab qilinmagan (faqat "inverted footer") |

---

## 5. Topilmalar

### 🔴 KRITIK

#### K-1. Muddati o'tgan rezerv → buyurtma tasdiqlanadi, qoldiq umuman kamaymaydi

**Fayl:** `apps/api/src/modules/inventory/inventory.service.ts:363-368`
(+ `order.service.ts:231-240`, `inventory.service.ts:323-334`)

```ts
async confirmReservationsForOrder(orderId: string): Promise<void> {
  await this.prisma.stockReservation.updateMany({
    where: { orderId, status: 'PENDING' },
    data: { status: 'CONFIRMED' },
  });                       // ← natija (count) TEKSHIRILMAYDI
}
```

**Nima noto'g'ri.** Checkout'da rezerv `expiresAt = now + 900s` bilan yaratiladi.
`transferReservationsToOrder()` rezervni buyurtmaga bog'laydi, lekin **`expiresAt` ni
uzaytirmaydi**. Sweeper (`reservation-sweeper.service.ts`, har daqiqa) buyurtmaga
bog'langan `PENDING` rezervni ham bo'shatadi. Keyin to'lov tasdiqlanganda
`confirmReservationsForOrder` **0 qatorga tegadi va jimgina qaytadi** — order sagasi
buni bilmaydi va buyurtmani `CONFIRMED` qiladi.

Yomonlashtiruvchi omil: keyinchalik `PACKED` ga o'tishda `consumeReservationsForOrder`
ham 0 qator topadi → **`on_hand` hech qachon kamaymaydi**.

**Qanday sharoitda buziladi (real, chekka holat emas):**

1. Mijoz naqd to'lov bilan buyurtma beradi (storefront buni qo'llab-quvvatlaydi;
   jonli bazada 3 ta `PAID/CASH` to'lov bor).
2. 15 daqiqadan keyin sweeper rezervni bo'shatadi — tovar boshqa mijozlarga ochiladi.
3. Kuryer bir necha soatdan keyin yetkazadi, kassir "capture" bosadi
   (`payment.controller.ts:141` → `captureManual` → `confirmPayment` →
   `onPaymentSucceeded`).
4. Buyurtma `CONFIRMED` bo'ladi. Qoldiq zaxiralanmagan, `on_hand` kamaymagan.

**Oqibat:** (a) o'sha tovar boshqa mijozga sotilishi mumkin — **oversell**;
(b) ombor qoldig'i doimiy ravishda haqiqatdan yuqori ko'rsatadi — inventarizatsiya
farqi to'planadi. Bu — loyiha butun arxitekturasi (atomik UPDATE, CHECK constraint,
ADR-0007) oldini olishga qurilgan aynan o'sha muammo, faqat oxirgi qadamda.

**Nega testlar tutmadi:** `payment.spec.ts` da 20 ta test bor, lekin **birortasi ham
"rezerv yo'qolgan" holatni sinamaydi** — hammasi rezerv mavjud bo'lgan yo'ldan boradi.

**Qanday tuzatiladi:**
- `confirmReservationsForOrder` `count` qaytarsin; kutilgan qatorlar soniga teng
  bo'lmasa — sagani kompensatsiya tarmog'iga yo'naltirish (J-2).
- Va/yoki `transferReservationsToOrder` da `expiresAt` ni to'lov sessiyasi
  muddatidan uzunroq qilib uzaytirish (`docs/06 §4.2` shu mantiqni nazarda tutadi).
- Naqd oqim uchun: buyurtmaga bog'langan rezervni sweeper bo'shatmasin
  (`where` ga `orderId: null` qo'shish).

---

#### K-2. Jonli demo repodan orqada: 14 mahsulot, birorta rasm yo'q

**Dalil:**

| Manba | Holat |
| --- | --- |
| `kelvin-api` image qurilgan | **2026-07-27 20:10** |
| Repo HEAD | `fbd0406`, **2026-08-04** |
| Jonli `/api/v1/search` | **14 mahsulot**, `primary_image: null` — **0/14 rasmli** |
| Repodagi seed | `prisma/seed.ts:1324` — **~73 mahsulot** |
| Repodagi media | **401 fayl** (`apps/storefront/public/media/`) |

**Nima noto'g'ri.** Oxirgi katta commit (email+OTP auth, parol tiklash, seed media,
redizayn aktivlari) **deploy qilinmagan**. Jonli baza eski, kam mahsulotli seed bilan
to'ldirilgan va mahsulot rasmlari umuman yo'q.

**Qanday sharoitda buziladi:** ish beruvchi `kelvin.sarvarbek-sodiqov.uz` ni ochadi va
katalogda rasmsiz kartalarni ko'radi. Portfel loyihasi uchun jonli demo — **asosiy
artefakt**; u repodagi ishning eng yomon versiyasini ko'rsatmoqda.

**Qo'shimcha:** jonli bazada `outbox_events` = **0 qator**, `stock_reservations` = **0**,
`audit_logs` = **2**, lekin 15 buyurtma va 11 to'lov bor. Ya'ni bu ma'lumot **seed orqali
to'g'ridan-to'g'ri kiritilgan**, servis qatlamidan o'tmagan. Prodda hech qachon haqiqiy
buyurtma sagasi ishlamagan — outbox/saga yo'li **ishlab-chiqarishda sinovdan o'tmagan**.

**Qanday tuzatiladi:** `main` dan qayta deploy + `pnpm db:seed` + `pnpm media:generate`.

---

### 🟠 JIDDIY

#### J-1. Login'da brute-force himoyasi yo'q; throttler xotirada

**Fayl:** `apps/api/src/modules/identity/auth.controller.ts:112`,
`apps/api/src/app.module.ts:123-128`

`POST /auth/login` da **hech qanday endpoint-darajali limit yo'q** — global
`300 req/min` (IP bo'yicha) amal qiladi, muvaffaqiyatsiz urinishlar hisobi va
qulflash ham yo'q. Butun loyihada atigi **bitta** `@Throttle` bor (lid formasi).

`docs/04-api-spec.md §8.2` esa 15 qatorli aniq jadval beradi: **login 5/min**,
`otp/verify` 5/15daq, `refresh` 20/min, `orders` 5/min va h.k. Amalda faqat OTP
o'zining cooldown + 5 urinish chegarasiga ega (`otp.service.ts:14,46`) — ya'ni
jadvalning eng qimmat ikki qatori qoplangan, qolgani yo'q.

Bundan tashqari `app.module.ts:123` da: `// TODO: Redis storage` — hozir limit
**in-memory**, spec §8.4 esa buni aniq man qiladi ("bir necha instance bo'lsa
limit N marta ko'payadi").

**Qanday buziladi:** bitta IP'dan daqiqasiga 300 parol urinishi = soatiga 18 000.
Parollar zaif bo'lsa — hisob egallash. Hozir real foydalanuvchi yo'q, shuning uchun
KRITIK emas; **jonli ishga tushirilishi bilan KRITIK bo'ladi**.

**Tuzatish:** `@Throttle` ni spec §8.2 jadvali bo'yicha qo'yish + `ThrottlerStorageRedis`.

#### J-2. Saga kompensatsiya tarmog'i umuman yozilmagan

**Fayl:** `apps/api/src/core/order/order-status.ts:5-6`,
`order-state-machine.ts:9-11`, `order.service.ts:231-256`

`docs/07 §3.3-3.4` sagani batafsil belgilaydi: rezerv yo'qolsa → boshqa ombordan
qayta urinish → topilmasa → `manual_review` + operatorga URGENT alert (avtomatik
refund **ataylab qilinmaydi**). Slot band bo'lsa → `manual_review`.

Amalda: `MANUAL_REVIEW` holati **enum'da ham, holat mashinasida ham yo'q**. Kod
izohlari buni "Faza 4 bilan keladi" deydi, lekin Faza 4 tugallangan deb hisoblanadi.
`onPaymentSucceeded` da hech qanday shart yoki xato tarmog'i yo'q — faqat to'g'ri yo'l.

`saga_state` jadvali ham yo'q, holbuki §3.2 "buyurtma #1234 nima bo'ldi?" savoliga
bitta jadvaldan javob berishni asos qilib orchestration'ni tanlagan.

**Oqibat:** K-1 ni tutadigan mexanizm yo'q; muammoli buyurtma hech kimga ko'rinmaydi.

#### J-3. AuditLog qamrovi — 21 moduldan 5 tasi

**O'lchov:** `audit.record` — **25 chaqiruv**; mutatsiya endpointlari — **86**.
Audit qiladigan modullar: `catalog`, `identity`, `inventory`, `order`, `payment`.

**Audit qilmaydiganlar orasida pul va tovar harakati bor:** `installment` (rassrochka
to'lovlari), `pos` (kassa naqd puli), `procurement` (xarid buyurtmalari), `shipment`,
`delivery`, `crm`, `content`, `review`.

DoD Faza 0 buni **majburiy va boshidan** deb belgilagan
(`docs/15-roadmap.md:0.10` — "keyin qo'shilsa 15 modulning har bir mutatsiyasini qayta
ko'rib chiqish kerak"). Aynan shu qarz to'plangan.

#### J-4. `prisma generate` postinstall'da yo'q → toza klonda lint 2085 xato

**Fayl:** `apps/api/package.json:21` (`db:generate` bor), lekin `postinstall` yo'q.

`node_modules/.prisma/client` bo'lmasa Prisma tiplari `any`/`error` ga aylanadi va
`typescript-eslint` ning `no-unsafe-*` qoidalari **2085 xato** beradi (75 fayl,
shundan 62 tasi `src/`). `pnpm db:generate` dan keyin lint darhol toza bo'ladi —
o'lchandi.

**Tuzatish (S):** `apps/api/package.json` ga `"postinstall": "prisma generate"`.

#### J-5. SSR yo'q → SEO va Telegram preview ishlamaydi

**Dalil (jonli, `curl`):** bosh sahifa ham, `/product/aurora-8l` ham bir xil
**1586 baytli bo'sh qobiq** (`<div id="root"></div>`). `og:title` — 0, `og:image` — 0,
`ld+json` — 0, mahsulot nomi HTML'da — yo'q.

DoD Faza 10 buni ikki band bilan aniq talab qiladi ("`curl` bilan tekshiriladi",
"Telegram'da havola preview" — hujjat buni "eng oddiy va eng aniq test" deb ataydi).
O'zbekistonda Telegram asosiy tarqatish kanali — mahsulot havolasi bo'sh ko'rinadi.

`sitemap.xml`, `robots.txt` va JSON-LD kodi bor, lekin JSON-LD **klientda** quyiladi —
Telegram uni o'qimaydi.

#### J-6. E2E testlar umuman yo'q

Root `package.json:14` da `test:e2e` skripti bor, lekin **birorta paket uni
amalga oshirmaydi**; Playwright/Cypress o'rnatilmagan. DoD **E2E-1 … E2E-6** ni
5 ta fazada talab qiladi (checkout, to'lov, qidiruv, admin mahsulot, POS, yetkazish) —
**6/6 bajarilmagan**.

#### J-7. Frontend'da 0 test; `pnpm test` yolg'on yashil beradi

| Paket | `test:unit` skripti | Test fayllari |
| --- | --- | --- |
| `@kelvin/api` | `jest --selectProjects unit` | 17 |
| `@kelvin/storefront` | `vitest run --passWithNoTests` | **0** |
| `@kelvin/admin` | `echo "no tests"` | **0** |
| `@kelvin/contracts` | `echo "no tests"` | **0** |

`pnpm test` "5 successful" deb yozadi, lekin 3 paket hech narsa bajarmaydi.
Ish beruvchi ko'radigan **butun UI qatlami** avtomatik tekshiruvsiz.

#### J-8. SMS/Telegram yuborilmaydi, lekin baza "SENT" deb yozadi

**Fayl:** `apps/api/src/modules/notification/notification.service.ts:27-32,52`

```ts
private adapterFor(channel: string): NotificationAdapter {
  if (channel === 'EMAIL' && this.smtpAdapter.enabled) return this.smtpAdapter;
  return this.logAdapter;                       // SMS/Telegram → faqat log
}
```

`LogAdapter` muvaffaqiyat qaytaradi → `markSent(record.id)` chaqiriladi. Ya'ni
`Notification` jadvalida **yuborilmagan SMS "SENT" holatida turadi**.

`order.service.ts:243-252` da telefoni bor mijozga `SMS` kanali tanlanadi — demak
**telefon raqami bo'lgan mijoz buyurtma tasdig'ini umuman olmaydi**, lekin tizim uni
yuborilgan deb hisoblaydi. Faqat email kanali real (`smtp-email.adapter.ts`).

#### J-9. `Dockerfile.api`: bir bosqichli, 1.98 GB, root, xatoni yutadi

**Fayl:** `Dockerfile.api`

| Muammo | Dalil |
| --- | --- |
| "Multi-stage" deyilgan, lekin **bitta stage** | Faqat `FROM ... AS build` |
| Image hajmi | **1.98 GB** (o'lchandi). To'g'ri multi-stage'da ~250-350 MB |
| `root` sifatida ishlaydi | `USER node` yo'q |
| **`RUN pnpm --filter @kelvin/contracts build \|\| true`** | Build xatosini **yutadi** — image quriladi, runtime'da yiqiladi |
| `pnpm add sharp@0.32.6` `--frozen-lockfile` dan keyin | Lockfile o'zgaradi — takrorlanuvchanlik buziladi |
| Node 20 vs `engines: ">=22.0.0"` | Build chiqishida: `WARN Unsupported engine: wanted {"node":">=22.0.0"} (current v20.20.2)` |

Ikkala Dockerfile ham **muvaffaqiyatli quriladi** — bu tekshirildi; muammo sifatda.

#### J-10. Statik sahifa CMS zanjiri uzilgan

API'da `@Controller('pages')` (`content/page.controller.ts:11`), admin'da
`Content.tsx` orqali CRUD bor — lekin storefront'ning `lib/content.js` faqat
`useBlogPosts` va `useBlogPost` ni eksport qiladi. `AboutUs`, `Return`, `Garant`
sahifalari **qattiq yozilgan JSX**.

**Oqibat:** admin "О нас" ni tahrirlaydi, saytda hech narsa o'zgarmaydi.

#### J-11. Mutation testing yo'q; modul-darajali coverage majburlanmagan

Stryker konfiguratsiyasi umuman yo'q, lekin DoD **Faza 3 va Faza 5** da
"Mutation score ≥ 85%" ikki marta talab qilinadi.

`jest.config.ts:78-91`: global 60%, `./src/core/` 90%. DoD esa modul bo'yicha
talab qiladi: `inventory` ≥90%, `pricing` ≥90%, `payment` ≥90%, `catalog` ≥75% —
`src/modules/*` faqat 60% global chegara ostida.

#### J-12. POS offline rejimi yo'q

`modules/pos/` da offline/sinxronizatsiya izlari yo'q. DoD Faza 8: "Offline: internet
uzilsa sotuv davom etadi", "Onlayn qaytgach sinxronizatsiya, konflikt hal qilinadi" —
ikkalasi ham bajarilmagan. O'zbekiston sharoitida bu POS uchun asosiy talab.

#### J-13. RUM (Real User Monitoring) yo'q

`web-vitals` o'rnatilmagan, LCP/INP/CLS yig'ilmaydi. DoD Faza 2 ("RUM ma'lumot yig'a
boshladi") va Faza 10 ("p75, RUM'da") — ikkalasi bajarilmagan. Performance da'volari
o'lchanmagan.

---

### 🟡 KICHIK

| # | Topilma | Fayl |
| --- | --- | --- |
| S-1 | Property test `numRuns` DoD dan 10-33× past: Money **1000** (talab 10 000), rassrochka **300** | `money.spec.ts:116`, `installment-calc.spec.ts:39` |
| S-2 | Storefront **2 til** (`ru`,`uz`); DoD 3 til talab qiladi — `uz-Cyrl` yo'q. `fallbackLng: 'ru'` — o'zbek bozori uchun shubhali | `i18n/index.js:23-24` |
| S-3 | `index.html` da statik `lang="ru"`; JS keyin tuzatadi, lekin krauler/no-JS uchun noto'g'ri (R-4 a11y bandi) | `apps/storefront/index.html:2` |
| S-4 | Bosh sahifada **soxta blog kartalari** (3 ta, faqat ruscha, `slug: null` — havola o'lik) DB bo'sh bo'lsa ko'rinadi | `components/blog/index.jsx:12` |
| S-5 | `/health` prodda yetib bo'lmaydi: global prefiksdan chiqarilgan, lekin nginx faqat `/api/*` ni API'ga yo'naltiradi | `main.ts:69-71` |
| S-6 | `app.module.ts:164-175` da **eskirgan TODO izohlari** — 9 ta modul "keyingi fazada" deb yozilgan, aslida yozilgan va ulangan | `app.module.ts` |
| S-7 | 17 ta qattiq hex 26 ta `.jsx` faylda — token intizomi qisman buzilgan | `components/*/index.jsx` |
| S-8 | Storefront yagona **557 KB** chunk, code-splitting yo'q (build ogohlantiradi). Gzip chegarasidan o'tadi, lekin route-level split yo'q | `apps/storefront` |
| S-9 | `onPaymentSucceeded` da bildirishnoma bloki `CONFIRMED` o'tishidan **keyin**; o'sha nuqtada vaqtinchalik xato bo'lsa, qayta urinishda holat allaqachon `CONFIRMED` → **xabar boshqa hech qachon yuborilmaydi** | `order.service.ts:241-253` |
| S-10 | Qidiruv javobida **kategoriya faceti yo'q** (11 facet guruhi, `category` yo'q) — kategoriya bo'yicha sanoq ko'rsatib bo'lmaydi | `search.service.ts` |
| S-11 | `feat/redesign` branchi eskirgan — `main` dan **2 commit orqada, 0 oldinda** | git |
| S-12 | Turbo `test:unit` uchun `outputs` sozlanmagan — har CI'da qayta ishlaydi (5 ta ogohlantirish) | `turbo.json` |

---

## 6. Testlar — alohida baho

**Bu loyihaning eng kuchli tomoni va uni alohida ta'kidlash kerak.**

Sizning "helix tuzog'i" savolingizga javob (79 test yashil, ilova ishlamaydi, chunki
hamma narsa mock qilingan):

| Ko'rsatkich | Natija |
| --- | --- |
| Integration testlarda `jest.mock` / `mockResolvedValue` / `useValue` | **0 ta** |
| Testcontainers | Real **PostgreSQL 17**, **Redis 7**, MinIO, **Meilisearch v1.11** |
| Migratsiyalar | Har testda haqiqatan qo'llaniladi |
| Unit test | **139** (17 suite) — o'lchandi, yashil |
| Integration test | **159** (21 fayl) — sanaldi, ishga tushirib bo'lmadi (Docker yo'q) |

**Kelvin bu tuzoqqa tushmagan.** Aksincha — eng muhim mantiq eng qat'iy testlangan:

- `inventory.spec.ts:78` — 100 parallel rezerv, 1 tovar → **aniq 1 muvaffaqiyat**,
  99 tasi **`InsufficientStockError`** bilan (deadlock emasligi ham tekshiriladi),
  yakuniy `on_hand`/`reserved` tasdiqlanadi.
- `delivery.spec.ts:64` — capacity=3, 20 parallel → **aniq 3**.
- `order.spec.ts:207` — bir savat, 2 parallel checkout → **aniq 1 buyurtma**.
- `payment.spec.ts` — 20 test: webhook idempotentligi, **summa mos kelmasligi hujumi**,
  muvozanatli ledger, to'liq/qisman refund, settlement, TTL.

**Lekin qamrovda tizimli teshiklar bor:**

1. **Faqat to'g'ri yo'l sinaladi** — "rezerv yo'qolgan", "slot band bo'lib qolgan"
   kabi saga xato tarmoqlari uchun **birorta test yo'q**. K-1 aynan shu sababdan
   omon qolgan.
2. **E2E — 0 ta** (DoD 6 ta talab qiladi).
3. **Frontend — 0 ta** (ikkala ilova ham).
4. **Mutation testing — yo'q**, modul-darajali coverage chegaralari majburlanmagan.

Ya'ni: **backend yadrosi ishonchli tekshirilgan, chetlar va butun UI tekshirilmagan.**

---

## 7. Yetishmayotgan funksiyalar (muhimlik tartibida)

1. **SSR / server-render qatlami** — mahsulot sahifasi qidiruv tizimi va Telegram
   uchun bo'sh. Raqobatchilarda (Uzum Market, Texnomart) bu bor; onlayn savdo uchun
   trafik manbai shu.
2. **Real to'lov provayderi** (Click/Payme) — skelet tayyor, merchant hisobi tashqi
   bloker. Hozircha faqat naqd oqim ishlaydi.
3. **Real SMS/Telegram bildirishnoma** — buyurtma tasdig'i mijozga yetmaydi.
   O'zbekistonda Telegram bot orqali buyurtma holati — kutiladigan standart.
4. **E2E testlar** — deploy oldidan regressiyani tutadigan yagona qatlam yo'q.
5. **Ombor operatsiyalari:** shtrix-kod skaneri va picking varaqasi — real omborda
   ularsiz ishlab bo'lmaydi.
6. **POS offline rejimi** — internet uzilishi O'zbekistonda oddiy hol.

**Raqobatchilarda bor, bunda yo'q eng sezilarli 3 ta narsa:**
mahsulot sahifasining SSR/preview'i, Telegram-bot integratsiyasi, va
mahsulot solishtirish + "o'xshash tovarlar" tavsiyasi.

---

## 8. Tuzatish rejasi

Tartib — ta'sir/mehnat nisbati bo'yicha.

| # | Ish | Hajm | Nega shu tartibda |
| --- | --- | --- | --- |
| 1 | **K-1:** `confirmReservationsForOrder` `count` qaytarsin; mos kelmasa saga to'xtasin. Buyurtmaga bog'langan rezervni sweeper bo'shatmasin | **S** | Kritik, tuzatish kichik |
| 2 | **K-1 uchun test:** "rezerv yo'qolgan" stsenariysi (naqd capture 15 daq'dan keyin) | **S** | Regressiyani qaytarmaslik uchun |
| 3 | **J-4:** `postinstall: prisma generate` | **S** | Bir qator; yangi dasturchi tajribasini tuzatadi |
| 4 | **K-2:** `main` dan qayta deploy + seed + media generatsiya | **S** | Portfel uchun eng ko'rinadigan natija |
| 5 | **J-1:** `@Throttle` ni spec §8.2 jadvali bo'yicha + Redis storage | **S/M** | Xavfsizlik; ishga tushirishdan oldin majburiy |
| 6 | **J-8:** SMS kanali uchun adapter yo'q bo'lsa `markFailed` qilsin (baza yolg'on yozmasin); Eskiz/Telegram adapteri | **S** → **M** | Birinchi qismi bir soatlik |
| 7 | **J-2:** `MANUAL_REVIEW` holati + saga xato tarmoqlari + operator alerti | **M** | K-1 sinfidagi muammolarni ko'rinadigan qiladi |
| 8 | **J-3:** audit'ni `installment`, `pos`, `procurement` ga yoyish | **M** | Pul tegadigan modullar birinchi |
| 9 | **J-9:** `Dockerfile.api` ni haqiqiy multi-stage'ga; `\|\| true` ni olib tashlash; `USER node`; Node 22 | **S/M** | 1.98 GB → ~300 MB |
| 10 | **J-10:** storefront statik sahifalarni `/pages` API'dan olsin | **S/M** | CMS zanjirini yopadi |
| 11 | **J-6:** Playwright + E2E-1 (checkout) va E2E-3 (qidiruv) | **M** | Ikkitasi ham butun oqimni qoplaydi |
| 12 | **J-7:** storefront'ga komponent testlari (savat, checkout formasi) | **M** | |
| 13 | **S-1:** `numRuns` ni DoD qiymatlariga ko'tarish | **S** | Bir qatorlik o'zgarish |
| 14 | **S-2, S-3:** `uz-Cyrl` lokali + `lang` ni SSR/prerender'da to'g'rilash | **M** | |
| 15 | **S-4:** soxta blog fallback'ini bo'sh-holat komponentiga almashtirish | **S** | |
| 16 | **J-5:** SSR qarori — ADR yozish, keyin prerender yoki Next.js migratsiyasi | **L** | Eng katta ish; alohida faza |
| 17 | **J-11:** Stryker + modul coverage chegaralari | **M** | |
| 18 | **J-12, J-13:** POS offline, RUM | **L** | |

### `feat/redesign` branchi haqida

`main` dan **2 commit orqada, 0 oldinda** — undagi barcha ish `main` ga qo'shilgan.
**O'chirilsin:** `git branch -d feat/redesign` (va remote'da bo'lsa
`git push origin --delete feat/redesign`).

---

## 9. Xulosa

Kelvin — **kuchli muhandislik, tugallanmagan mahsulot**. Arxitektura qarorlari
hujjatlangan va asoslangan (7 ta ADR), pul `BigInt` tiyinda, konkurentlik real DB
ustida qat'iy testlangan, integration testlarda bitta ham mock yo'q. Bu — portfelda
ko'rsatishga arziydigan daraja.

Lekin **ishlab-chiqarishga tayyor emas**: bitta kritik korrektlik xatosi (K-1) aynan
loyiha eng ko'p maqtanadigan sohada — oversell himoyasida — teshik qoldiradi, jonli
demo esa repodagi ishning eskirgan, rasmsiz versiyasini ko'rsatadi. Ikkalasi ham
kichik hajmli tuzatish.

**Tayyorlik: 55%** (DoD bo'yicha 49 ✅ / 19 🟡 / 41 ❌ dan hisoblangan).
**Holat: ishlaydi** — prototipdan ancha yuqori, ishlab-chiqarishdan bir necha qadam past.
