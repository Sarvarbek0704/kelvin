# ADR-0003 — Pul: BigInt, tiyinda. Float hech qachon

- **Holat:** Qabul qilingan
- **Sana:** 2026-07-15

## Kontekst

Kelvin — do'kon. Pul bu yerda **asosiy narsa**, qo'shimcha emas: narx, chegirma, tannarx, foyda, ledger, **rassrochka grafigi**, POS kassasi, komissiya.

Valyuta — UZS. Eng mayda birlik — tiyin (1 so'm = 100 tiyin).

> Amalda tiyin muomaladan chiqqan — narxlar butun so'mda. Lekin bu **ichki hisob birligini tanlashga ta'sir qilmaydi**: chegirma (2.5%), rassrochka bo'linishi (5 000 000 / 3) va komissiya kasr beradi va uni biror joyda saqlash kerak.

⚠️ Loyiha egasining oldingi loyihasida (`dorixona`) narx `DataType.FLOAT` sifatida saqlangan edi. Bu takrorlanmasligi kerak.

## Qaror

**`BigInt`, tiyinda.** Valyuta har doim alohida ustunda.

```prisma
priceAmount BigInt  @map("price_amount")   // 540 000 UZS → 54_000_000n
currency    String  @default("UZS")
```

**Float hech qachon. Hech qayerda. Hech qanday sababga ko'ra.**

## Sabablar

### Nega Float jinoyat

```js
0.1 +
  0.2 // 0.30000000000000004
  (0.1 + 0.2).toFixed(2); // "0.30"  ← xato YASHIRINDI, yo'qolmadi

let total = 0;
for (let i = 0; i < 1000; i++) total += 0.1;
total === 100; // false → 99.9999999999986
```

Do'konda bu **balans mos kelmaydi** degani. Xato jimgina to'planadi — hech kim sezmaydi, toki inventarizatsiya yoki soliq tekshiruvi kelguncha.

Bu test kodda bor va `number` ning ishonchsizligini hujjatlashtiradi:
[`money.spec.ts`](../../apps/api/src/core/money/money.spec.ts) → _"taqqoslash uchun: `number` bilan xuddi shu hisob YIQILADI"_.

### Nega BigInt

| Yondashuv                        | Baho                                                                            |
| -------------------------------- | ------------------------------------------------------------------------------- |
| `Float`                          | ❌ Yuqorida                                                                     |
| `Decimal` (PostgreSQL `NUMERIC`) | ✅ To'g'ri, lekin JS'da `Decimal.js` obyekti — har amalda `.plus()`, `.times()` |
| `Integer` + tiyin                | ⚠️ 32-bit → maksimum ~21 mln so'm. **Qandil 5 mln so'm — chegara yaqin**        |
| **`BigInt` + tiyin**             | ✅ **Tanlandi**                                                                 |

`BigInt` ustunligi: **yaxlitlash muammosi tuzilmaviy jihatdan yo'q** — tiyindan mayda birlik yo'q. Native tip, kutubxona kerak emas.

### Rassrochka — bu ADR'ning eng muhim sababi

O'zbekistonda qandil (2–5 mln so'm) **bo'lib to'lash** bilan sotiladi. Grafik:

```
5 000 000 so'm / 3 oy = 1 666 666.666... so'm
```

Tiyin qayerga ketadi?

Agar har oyga `1 666 666.67` yozsak: `3 × 1 666 666.67 = 5 000 000.01` → **1 tiyin ortiqcha**.
Agar `1 666 666.66` yozsak: → **2 tiyin kam**.

Mijoz uchinchi to'lovni to'lagach qarzi "0.02 so'm" bo'lib qoladi — va u **hech qachon yopilmaydi**. Tizim uni "kechikkan" deb belgilaydi, SMS yuboradi, mijoz g'azablanadi.

**Yechim — `Money.allocate()`:** qoldiq birinchi qismlarga taqsimlanadi.

```
500 000 000 tiyin → [166 666 667, 166 666 667, 166 666 666]
                     yig'indi = 500 000 000  ← ANIQ
```

Kafolat property test bilan tekshiriladi: **har qanday summa × har qanday muddat (3/6/9/12/18/24 oy) → yig'indi asl summaga teng**. 500 tasodifiy holat.

### Bo'lish — yagona xavfli joy

`BigInt` bo'lishi nolga tomon **kesadi**: `7n / 2n === 3n`.

**Qoida:** har bo'lish yonida yaxlitlash yo'nalishi **komment bilan asoslanadi**. Kod review'da majburiy tekshiriladi.

`percentage()` yuqoriga yaxlitlaydi (chegirma emas, komissiya do'kon foydasiga). `allocate()` qoldiqni taqsimlaydi.

## Oqibatlar

**Ijobiy:**

- Yaxlitlash xatosi **imkonsiz**
- Ledger invarianti (`SUM(debit) == SUM(credit)`) har doim bajariladi
- Rassrochka grafigi aniq

**Salbiy:**

- **`BigInt` JSON'da serializatsiya qilinmaydi** — `JSON.stringify(1n)` xato tashlaydi. Global patch kerak (`main.ts`). API'da pul **string** sifatida qaytadi: `"amount": "54000000"`. Bu ataylab — JS `Number` 2⁵³ dan katta butun sonni yo'qotadi
- Har joyda `n` suffiksi — kod shovqinli
- `1n + 1` → `TypeError`. Bu **yaxshi** (xato erta chiqadi), lekin o'rganish kerak
- Frontend'da ham `BigInt` bilan ishlash kerak (yoki string sifatida)

## Majburlash

- ESLint qoidasi: `billing`/`money` yo'lida pul maydonlarida `number` va `parseFloat` taqiqlanadi
- Property test: `allocate()` yig'indisi doim teng
- Kod review: har bo'lishning yaxlitlash yo'nalishi asoslanganmi

## Havolalar

- [`apps/api/src/core/money/money.ts`](../../apps/api/src/core/money/money.ts)
- [08-payments-and-installments.md](../08-payments-and-installments.md)
- Martin Fowler — "Money" pattern
