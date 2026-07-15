# ADR-0001 — Modular monolith, mikroservis emas

- **Holat:** Qabul qilingan
- **Sana:** 2026-07-15

## Kontekst

Kelvin 17 ta funksional moduldan iborat ([02-architecture.md §5](../02-architecture.md#5-modul-xaritasi)): katalog, qidiruv, savat, buyurtma, qoldiq, to'lov, yetkazib berish, CRM, POS va h.k.

E-commerce haqidagi maqolalar odatda mikroservis arxitekturasini ko'rsatadi (Amazon, Shopify). Bu "biz ham shunday qilaylik" fikrini tug'diradi.

**Lekin kontekst butunlay boshqacha:** bu **bitta do'kon**. Marketplace emas, SaaS emas. Loyihani bir kishi yozadi.

## Qaror

**Modular monolith.** Bitta deploy qilinadigan API, ichida qat'iy chegaralangan modullar.

Chegara **CI bilan majburlanadi**, niyat bilan emas:
- Modul boshqa modulning service'iga to'g'ridan-to'g'ri murojaat qilmaydi — faqat `*.port.ts` orqali
- Modul boshqa modulning jadvaliga so'rov yubormaydi
- `core/` NestJS'ni ham, Prisma'ni ham import qilmaydi
- `pnpm --filter @kelvin/api arch:check` (dependency-cruiser) har PR'da ishlaydi

## Sabablar

**Mikroservis nimani hal qiladi:** mustaqil deploy, mustaqil masshtablash, texnologiya xilma-xilligi, xatolik izolyatsiyasi.

**Kelvin'da:**
- Jamoa — **bir kishi**. Bloklanadigan hech kim yo'q
- Yuklama — bitta do'kon. Masshtablash muammosi yo'q
- Hammasi TypeScript
- Foydalanuvchi yo'q

**Mikroservis nimani qo'shadi — va nega bu Kelvin uchun halokatli:**

Eng muhimi: **buyurtma oqimi tranzaksiya talab qiladi.** Rezerv, to'lov, buyurtma — bular bir-biriga bog'liq. Monolitda:

```ts
await prisma.$transaction(async (tx) => {
  await reserve(tx, items);
  await createOrder(tx, order);
  await tx.outboxEvent.create({ ... });
});
```

Mikroservisda bu **distributed tranzaksiya** — saga, kompensatsiya, har servis orasida tarmoq xatosi. Bizda saga baribir bor ([07](../07-order-and-checkout.md)), lekin u faqat **tashqi** tizimlar uchun (to'lov provayderi). Ichki modullar orasida saga qurish — o'zini o'zi jazolash.

Va **oversell himoyasi** ([ADR-0007](./0007-atomic-conditional-reservation.md)) bitta atomik SQL UPDATE'ga tayanadi. Agar `inventory` alohida servis bo'lsa, bu kafolat yo'qoladi.

## Oqibatlar

**Ijobiy:**
- `prisma.$transaction()` ishlaydi — bu Kelvin uchun kritik
- Bitta deploy, bitta log, bitta debug sessiyasi
- Lokal dev: `docker compose up`
- Refactoring arzon

**Salbiy:**
- Butun API birga deploy bo'ladi
- Bitta modul xotira yeb qo'ysa — hammasi yiqiladi
- **Chegara buzilishi oson** → shuning uchun CI tekshiruvi majburiy
- Masshtablash faqat butun API darajasida

**Xavf:** chegara vaqt o'tishi bilan yemiriladi ("big ball of mud"). Yumshatish: `arch:check` har PR'da. Bu test o'chirilsa — ADR buzilgan.

## Qachon qayta ko'riladi

Ochig'i: **ehtimoli juda past.**

| Signal | Ehtimol |
|---|---|
| Jamoa 8+ kishi | Past — bu bitta do'kon loyihasi |
| Modul mustaqil masshtablashni talab qiladi | Past |
| Deploy bloklanadi | Past |

Agar Kelvin bir kun kelib **SaaS**'ga aylansa (boshqa do'konlarga sotilsa) — unda bu ADR qaytadan ochiladi. Lekin bu [00-vision-and-scope.md](../00-vision-and-scope.md) da **non-goal** deb belgilangan.

## Alternativalar

| Variant | Nega rad etildi |
|---|---|
| **Mikroservis** | Tranzaksiya yo'qoladi — buyurtma oqimi uchun halokatli |
| **Serverless** | Uzoq yashaydigan tranzaksiya va Prisma connection pool serverless'ga yomon mos keladi |
| **Oddiy monolit** (modulsiz) | Bugun tezroq, 6 oydan keyin qimmatroq |

## Havolalar

- [02-architecture.md](../02-architecture.md)
- [ADR-0007](./0007-atomic-conditional-reservation.md) — nega tranzaksiya kritik
