# 12 — Infratuzilma

> **Hujjat maqomi:** Tasdiqlangan · **Oxirgi yangilanish:** 2026-07-15

---

## 1. Asosiy tamoyil: bu bitta do'kon

Bu hujjatning eng muhim jumlasi shu, va u boshqa hamma narsani belgilaydi.

Kelvin — **bitta yoritgich do'koni** uchun. Marketplace emas, SaaS emas, millionlab foydalanuvchi yo'q. Yuklama profili: kuniga bir necha yuz mijoz, bir necha o'nlab buyurtma, bir necha xodim.

E-commerce haqidagi maqolalar Kubernetes, service mesh, multi-region deploy haqida yozadi. **Bularning hech biri bu yerda kerak emas.**

Har qanday infratuzilma qarori bitta savolga javob berishi kerak: _"Bu qanday real muammoni hal qiladi?"_ Javob "kelajakda kerak bo'lishi mumkin" bo'lsa — bu javob emas.

---

## 2. Monorepo

```
kelvin/
├── apps/
│   ├── storefront/   React 19 + Vite + styled-components
│   ├── admin/        React + shadcn/ui + Tailwind
│   └── api/          NestJS 11 + Prisma
├── packages/
│   ├── contracts/    OpenAPI'dan generatsiya qilingan tiplar
│   └── config/       umumiy eslint / ts / prettier
└── docs/
```

**pnpm workspaces + Turborepo.**

Nega monorepo: API va frontend bir vaqtda o'zgaradi. Alohida repo bo'lsa — bitta o'zgarish uchun ikki PR va versiya moslashuvi muammosi.

Nega Turborepo: task grafi va cache. `pnpm build` faqat o'zgargan paketni build qiladi. `packages/contracts` o'zgarsa — `storefront` va `admin` qayta build bo'ladi, `api` yo'q.

⚠️ **pnpm majburiy.** `package-lock.json` va `yarn.lock` `.gitignore` da — ikki lockfile chalkashlik keltiradi.

---

## 3. Muhitlar

| Muhit          | Maqsad                      | Ma'lumot                         |
| -------------- | --------------------------- | -------------------------------- |
| **local**      | Ishlab chiqish              | Docker Compose, seed ma'lumoti   |
| **staging**    | Deploy'dan oldin tekshirish | Prod nusxasi, anonimlashtirilgan |
| **production** | Real do'kon                 | Real                             |

⚠️ **Staging'da real mijoz ma'lumoti bo'lmaydi.** Prod bazasini staging'ga nusxalash — shaxsiy ma'lumot qonuni buzilishi. Anonimlashtirish majburiy: telefon, ism, manzil almashtiriladi.

---

## 4. Docker Compose (dev)

[`docker-compose.yml`](../docker-compose.yml):

| Servis               | Nega                                                                                    |
| -------------------- | --------------------------------------------------------------------------------------- |
| `postgres:17-alpine` | Haqiqat manbai                                                                          |
| `redis:7-alpine`     | Cache, BullMQ, rate limit                                                               |
| `meilisearch:v1.11`  | Faceted search ([ADR-0006](./adr/0006-meilisearch-for-faceted-search.md) — **shartli**) |
| `minio`              | S3-mos storage (rasm)                                                                   |
| `mailpit`            | Email tutib qolish — dev'da real email yuborilmaydi                                     |

**PostgreSQL'da nozik detal:**

```yaml
POSTGRES_INITDB_ARGS: '--locale=C.UTF-8 --encoding=UTF8'
```

Nega: collation `ORDER BY` natijasiga ta'sir qiladi. Dev'da bir xil, prod'da boshqacha bo'lsa — testda o'tgan tartib prod'da boshqacha chiqadi. Bu jimgina xato.

---

## 5. Production deploy — nega Kubernetes EMAS

Bu bo'lim ataylab batafsil, chunki bu eng ko'p xato qilinadigan joy.

### 5.1. Kubernetes nima beradi

- Avtomatik masshtablash — **bizda masshtablanadigan yuklama yo'q**
- Self-healing — Docker `restart: unless-stopped` ham buni qiladi
- Rolling deploy — bitta do'kon uchun 30 soniyalik downtime falokat emas
- Ko'p node boshqaruvi — **bizda bitta node**

### 5.2. Kubernetes nima olib keladi

- YAML manifestlari, Helm chart, ingress controller
- Kluster yangilash, sertifikat rotatsiyasi
- Debug: `kubectl logs`, `kubectl exec`, nega pod `CrashLoopBackOff` da
- **Operatsion yuk — bitta odam uchun bu ish kunining yarmi**
- Xarajat: managed kluster (EKS/GKE) oyiga o'nlab dollar, o'zi boshqarish esa vaqt

### 5.3. Qaror

**Bitta VPS + Docker Compose.**

```
Ubuntu VPS
 ├── nginx (TLS, Let's Encrypt) → reverse proxy
 ├── api (NestJS)          :3000
 ├── worker (BullMQ)
 ├── storefront (statik)   → nginx to'g'ridan-to'g'ri beradi
 ├── admin (statik)        → nginx
 ├── postgres
 ├── redis
 └── meilisearch
```

Alternativalar (agar Docker Compose'ni qo'lda boshqarish og'ir tuyulsa):

| Variant                  | Baho                                                   |
| ------------------------ | ------------------------------------------------------ |
| **Docker Compose + VPS** | ✅ Eng oddiy, to'liq nazorat. **Tanlandi**             |
| **Coolify / Dokku**      | ✅ Self-hosted PaaS. Deploy UX yaxshi, murakkablik kam |
| **Railway / Render**     | ⚠️ Oson, lekin ⚠️ **ma'lumot lokalizatsiyasi** (§6)    |
| **Kubernetes**           | ❌ Muammosiz murakkablik                               |

### 5.4. Qachon qayta ko'riladi

| Signal                                        | Chora                                          |
| --------------------------------------------- | ---------------------------------------------- |
| Bitta VPS CPU/RAM yetmaydi                    | Kattaroq VPS (vertikal) — bu ancha uzoq yetadi |
| Do'kon filiallari ko'payadi va yuklama oshadi | API'ni ikkinchi node'ga                        |
| Downtime qimmatga tushadi                     | Blue-green deploy                              |

**Kubernetes bu ro'yxatda yo'q.** Agar bir kun kerak bo'lsa — Docker image'lar allaqachon bor, o'tish qiyin emas.

---

## 6. Hosting — ⚠️ yurist tasdig'iga bog'liq

**Bu ochiq savol va uni men hal qila olmayman.**

O'zbekistonda fuqarolar shaxsiy ma'lumoti mamlakat ichida saqlanishi talabi bor ([11-security.md](./11-security.md)). Kelvin mijoz telefoni, manzili, buyurtma tarixini saqlaydi — ya'ni bu talab qo'llanilishi mumkin.

| Variant                                            | Ma'lumot lokalizatsiyasi  | Baho                              |
| -------------------------------------------------- | ------------------------- | --------------------------------- |
| Mahalliy provayder (UZINFOCOM va h.k.)             | ✅ Muammosiz              | Narx va sifat tekshirilishi kerak |
| Xorijiy VPS (Hetzner, DigitalOcean)                | ❌ Talab buzilishi mumkin | Arzon va sifatli                  |
| Gibrid: shaxsiy ma'lumot mahalliy, qolgani xorijda | ⚠️ Murakkab               | Kerakmi?                          |

**Arxitektura ataylab provayder-neytral:** Docker Compose istalgan Linux serverda ishlaydi. Ya'ni yurist javobi kelgach, ko'chirish arzon.

⚠️ **BLOKER:** yurist javobisiz production'ga chiqilmaydi.

---

## 7. Docker image

Ko'p bosqichli build. Nega — ikki sabab:

**1. `argon2` native binding.** U build paytida kompilyator talab qiladi (`python3`, `make`, `g++`), lekin runtime'da kerak emas. Bir bosqichli build'da bu vositalar final image'da qoladi va uni ~200 MB shishiradi.

**2. devDependencies.** Final image'da `jest`, `eslint`, `typescript` kerak emas.

```dockerfile
FROM node:22-alpine AS deps     # bog'liqliklar + build vositalari
FROM node:22-alpine AS builder  # build + prune --prod
FROM node:22-alpine AS runner   # faqat dist + prod node_modules
USER node                       # non-root
```

**Frontend image kerak emas** — `vite build` statik fayl beradi, nginx uni to'g'ridan-to'g'ri beradi.

---

## 8. Ma'lumotlar bazasi

### 8.1. Connection pooling — PgBouncer kerakmi?

**Halol javob: yo'q, hozircha.**

PgBouncer ko'p instance × ko'p connection muammosini hal qiladi. Bizda: 1-2 API instance × Prisma pool (default 5-10) = maksimum ~20 connection. PostgreSQL default 100 ni ko'taradi.

PgBouncer qo'shish — yana bir servis, yana bir failure point, va Prisma bilan transaction mode'da nozik muammolar bor (prepared statement).

Qachon kerak: API instance'lar 5+ bo'lganda. Bu ehtimoldan uzoq.

### 8.2. Backup — bu bo'lim eng muhimi

Do'kon ma'lumoti yo'qolsa — buyurtmalar, ledger, qoldiq yo'qoladi. Bu biznesning o'limi.

|                                             |                                                             |
| ------------------------------------------- | ----------------------------------------------------------- |
| **Usul**                                    | `pg_dump` (kunlik) + WAL arxivlash (PITR)                   |
| **RPO** (qancha ma'lumot yo'qolishi mumkin) | ⚠️ Maqsad: < 5 daqiqa. **O'lchanishi kerak**                |
| **RTO** (qancha vaqtda tiklanadi)           | ⚠️ Maqsad: < 1 soat. **O'lchanishi kerak**                  |
| **Saqlash joyi**                            | ⚠️ **Boshqa serverda.** Bir xil VPS'da backup — backup emas |
| **Shifrlash**                               | Backup'da mijoz ma'lumoti bor → shifrlanadi                 |

⚠️ **Backup tiklashni sinash — jadval bo'yicha, kamida choraklik.** Sinalmagan backup — backup emas, u faqat umid. Bu qoida buzilishi eng ko'p uchraydigan xato.

### 8.3. Migration

- Prod: `prisma migrate deploy`, CI'dan. **Hech qachon qo'lda**
- `prisma db push` — hech qayerda
- ⚠️ `synchronize: true` / `sync({ alter: true })` — loyiha egasining oldingi loyihalarida (`chess`, `donate_service`, `dorixona`, `IT_info`) shu bor edi. Bu prod'da **ma'lumot yo'qotadi**. Kelvin'da yo'q

**Zero-downtime — expand-contract:**

Ustun o'chirish uchun **uch deploy**:

1. Kodni o'sha ustunsiz ishlaydigan qilish
2. Ustunni nullable qilish
3. Ustunni o'chirish

Bir deployda qilinsa: eski kod hali ishlab turganda ustun yo'qoladi → 500.

---

## 9. Meilisearch

- **Index — haqiqat emas.** Yo'qolsa PostgreSQL'dan qayta quriladi (`search.reindex` job)
- Backup: kerak emas — qayta qurish arzonroq
- ⚠️ RAM: index xotirada. SKU o'sishi bilan o'sadi. **O'lchanishi kerak**
- Sinxronizatsiya: outbox → BullMQ ([ADR-0006](./adr/0006-meilisearch-for-faceted-search.md))

---

## 10. Rasm — e-commerce uchun kritik

Bu bo'lim alohida, chunki **hozirgi kodda real muammo bor**.

Mavjud storefront rasmlari o'lchami:

```
katalog10.png   2.99 MB
katalog4.png    1.71 MB
katalog5.png    1.62 MB
blog2.png       1.48 MB
```

Bosh sahifada 6+ rasm → **~10 MB**. Mobil internetda bu bir necha o'n soniya.

**Oqim:**

```
Admin rasm yuklaydi
  → S3 (asl)
  → BullMQ: media.processImage
      → resize: 400 / 800 / 1600 px
      → webp + avif
      → blur placeholder (LQIP)
  → S3 (derivativlar)
  → CDN
```

Frontend `srcset` bilan mos o'lchamni oladi.

⚠️ Hisob: 1000 mahsulot × 5 rasm × 4 o'lcham × 2 format = **40 000 fayl**. Storage arzon, lekin bandwidth — yo'q. CDN majburiy.

---

## 11. CI/CD

[`.github/workflows/ci.yml`](../.github/workflows/ci.yml) — bosqichlar:

```
static (lint · format · typecheck · prisma validate)
architecture (ADR-0001 chegaralari)
test-unit
test-integration (Testcontainers — real PostgreSQL)
build
security (pnpm audit · gitleaks)
    ↓
ci-passed
```

**`gitleaks` alohida muhim.** Loyiha egasining oldingi loyihalarida sirlar GitHub'ga commit qilingan: `chess` (DB paroli + JWT kaliti), `expressCargo` (`prod_secret=12345678` + real server IP), `micro` (**jonli CloudAMQP paroli, 9 oy public turgan**). Bu takrorlanmasligi kerak va uni odam emas, CI ushlashi kerak.

⚠️ **Hozircha CI `workflow_dispatch` bilan qo'lda ishga tushiriladi** — bu GitHub hisobida Actions mavjud emas (billing). Actions yoqilgach, `push`/`pull_request` triggerlarini komentdan chiqarish kifoya.

Lokal ekvivalenti:

```bash
pnpm lint && pnpm typecheck && pnpm test:unit && pnpm build
```

**Turborepo cache:** faqat o'zgargan paket build/test qilinadi.

---

## 12. Kuzatuv

| Qatlam    | Vosita         | Nima                           |
| --------- | -------------- | ------------------------------ |
| Log       | **Pino**       | JSON, correlation ID har logda |
| Metrika   | **Prometheus** | RED + biznes                   |
| Xato      | **Sentry**     | Stack + release tracking       |
| Dashboard | **Grafana**    | System + biznes                |

⚠️ **Sir hech qachon loglanmaydi** — `redact` ro'yxati [`app.module.ts`](../apps/api/src/app.module.ts) da: `authorization`, `cookie`, `password`, `set-cookie`.

**Biznes metrikalari** — bular texnik metrikalardan muhimroq:

```
kelvin_orders_total{channel,status}
kelvin_oversell_prevented_total          ← ADR-0007 ishlayaptimi
kelvin_reservation_expired_total         ← TTL to'g'rimi
kelvin_search_duration_seconds
kelvin_payment_failures_total{provider}
kelvin_outbox_lag_seconds                ← event'lar chiqyaptimi
kelvin_ledger_imbalance_total            ← 0 dan farq qilsa — FALOKAT
```

Oxirgisi eng muhim: `SUM(debit) != SUM(credit)` bo'lsa, darhol alert. Bu hech qachon bo'lmasligi kerak.

**SLO** — ⚠️ maqsad, o'lchov emas:

|                | Maqsad                                          |
| -------------- | ----------------------------------------------- |
| API mavjudligi | 99.5% (bitta do'kon uchun 99.9% ortiqcha va'da) |
| Qidiruv p95    | < 300ms                                         |
| Checkout p95   | < 800ms                                         |

---

## 13. Xarajat

⚠️ **Real raqam berilmaydi** — u yuklama va provayderga bog'liq va o'lchanmagan.

Xarajat drayverlari, kattaligi bo'yicha:

1. **Rasm bandwidth** — eng katta va eng oson unutiladigan. 10 MB × mingta tashrif
2. **VPS** — compute + RAM (Meilisearch RAM yeydi)
3. **Storage** — S3, backup
4. **SMS (Eskiz)** — har OTP pul turadi. ⚠️ Rate limiting bu yerda **xarajat masalasi**, faqat xavfsizlik emas
5. **Domen, TLS** — TLS bepul (Let's Encrypt)

Aniq raqam yuklama testidan keyin.

---

## 14. Disaster recovery

| Ssenariy             | Chora                                                                            |
| -------------------- | -------------------------------------------------------------------------------- |
| VPS o'ldi            | Backup'dan yangi VPS'ga tiklash. **RTO o'lchanishi kerak**                       |
| Baza buzildi         | PITR                                                                             |
| Meilisearch yo'qoldi | Qayta indeksatsiya (job)                                                         |
| Redis yo'qoldi       | Cache qayta to'ladi; ⚠️ BullMQ job'lar yo'qoladi → outbox ularni qayta chiqaradi |
| Rasm yo'qoldi        | S3 versioning                                                                    |

⚠️ Oxirgi qator muhim: **BullMQ job'lari Redis'da**. Redis yo'qolsa navbatdagi job'lar yo'qoladi. Lekin kritik event'lar **outbox'da (PostgreSQL'da)** — worker ularni qayta o'qiydi. Aynan shuning uchun outbox bor ([ADR-0004](./adr/0004-transactional-outbox.md)).

---

## 15. Acceptance criteria

- [ ] `docker compose up -d` → butun dev muhit ishlaydi
- [ ] `pnpm dev` → storefront, admin, api birga ishga tushadi
- [ ] `.env` commit qilinmagan — gitleaks CI'da tekshiradi
- [ ] Prod image non-root user bilan ishlaydi
- [ ] Migration CI'dan avtomatik (`migrate deploy`)
- [ ] Backup avtomatik va **boshqa serverda**
- [ ] **Backup tiklash kamida bir marta sinalgan** ← eng ko'p unutiladigan
- [ ] TLS + HSTS
- [ ] `kelvin_ledger_imbalance_total` uchun alert
- [ ] Rasm derivativlari avtomatik generatsiya qilinadi

---

## 16. Ochiq savollar

| Savol                                           | Kimga        | Bloklaydi                    |
| ----------------------------------------------- | ------------ | ---------------------------- |
| **Ma'lumot lokalizatsiyasi talabi bormi?**      | **Yurist**   | Hosting tanlovi — **BLOKER** |
| Mahalliy hosting provayderlari sifati va narxi? | Tadqiqot     | Deploy                       |
| Meilisearch RAM'i qancha?                       | O'lchov      | Sizing                       |
| Rasm bandwidth qancha?                          | O'lchov      | CDN tanlovi va xarajat       |
| RPO/RTO real qiymatlari?                        | O'lchov      | Backup strategiyasi          |
| GitHub Actions qachon yoqiladi?                 | Loyiha egasi | CI avtomatik ishlashi        |
