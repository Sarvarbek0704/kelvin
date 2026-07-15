# Arxitektura qarorlari (ADR)

**ADR** — Architecture Decision Record. Har bir muhim texnik qaror shu yerda: **nima**, **nega**, va **nima evaziga**.

## Nega ADR

Olti oydan keyin siz (yoki jamoaga qo'shilgan odam) "nega bu shunday?" deb so'raysiz. ADR bo'lmasa javob yo'q — va odam qarorni "yomon" deb hisoblab o'zgartiradi, keyin o'sha muammoga qaytadan duch keladi.

ADR **niyatni** saqlaydi. Kod faqat **natijani** saqlaydi.

## Format

| Bo'lim | Nima uchun |
|---|---|
| **Kontekst** | Qanday sharoitda savol tug'ildi |
| **Qaror** | Nima qilindi — aniq |
| **Sabablar** | Nega. Alternativalar nega rad etildi |
| **Oqibatlar** | Ijobiy **va salbiy** |
| **Qachon qayta ko'riladi** | Qaysi signal bu qarorni bekor qiladi |

**Salbiy oqibatlar bo'limi majburiy.** Narxi ko'rsatilmagan qaror — o'ylanmagan qaror.

ADR **o'zgartirilmaydi**. Qaror o'zgarsa — yangi ADR, eskisi "Almashtirilgan" deb belgilanadi.

## Ro'yxat

| # | Qaror | Holat | Nima evaziga |
|---|---|---|---|
| [0001](./0001-modular-monolith.md) | Modular monolith, mikroservis emas | Qabul qilingan | Chegara yemirilishi xavfi → CI bilan majburlanadi |
| [0002](./0002-argon2id-over-bcrypt.md) | Argon2id, bcrypt emas | Qabul qilingan | Har login ~19 MiB xotira |
| [0003](./0003-money-as-bigint-tiyin.md) | Pul: BigInt, tiyinda | Qabul qilingan | JSON serializatsiya qo'lda, kod shovqinli |
| [0004](./0004-transactional-outbox.md) | Transactional outbox | Qabul qilingan | Kechikish, har handler idempotent bo'lishi shart |
| [0005](./0005-two-ui-stacks.md) | Storefront va admin — ikki UI stack | Qabul qilingan | Ikki CSS paradigmasi bitta repoda |
| [0006](./0006-meilisearch-for-faceted-search.md) | Meilisearch (faceted search) | **Shartli** | Yangi servis, ikkilangan ma'lumot. **SKU < 500 bo'lsa bekor qilinadi** |
| [0007](./0007-atomic-conditional-reservation.md) | Atomik shartli UPDATE (oversell) | Qabul qilingan | PostgreSQL'ga bog'liq, izolyatsiyaga sezgir |

## Eng muhim ikkitasi

**[ADR-0007](./0007-atomic-conditional-reservation.md)** — oversell. Bu Kelvin'ning eng nozik texnik masalasi. Noto'g'ri yechim = ikki mijozga bitta tovar sotish = real pul va obro' yo'qotish.

**[ADR-0003](./0003-money-as-bigint-tiyin.md)** — pul. Float bu yerda jinoyat. Rassrochka grafigi bitta tiyin yo'qotsa, mijozning qarzi hech qachon yopilmaydi.

## Yangi ADR qachon yoziladi

Qaror **qaytarish qimmat** bo'lsa:
- Baza yoki framework tanlash
- Ma'lumot modelining tuzilmaviy qarori (PK tipi, pul ifodasi)
- Concurrency strategiyasi
- Xavfsizlik mexanizmi
- Modul chegarasini o'zgartirish
- Yangi tashqi bog'liqlik

**Kerak emas:** kutubxona versiyasini yangilash, papka nomi, kod uslubi.

Shubha bo'lsa — yozing.

## Yangi ADR yaratish

```bash
cp docs/adr/TEMPLATE.md docs/adr/00XX-qisqa-nom.md
```
