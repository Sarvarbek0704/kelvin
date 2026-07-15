# ADR-0007 — Oversell'ga qarshi atomik shartli UPDATE

- **Holat:** Qabul qilingan
- **Sana:** 2026-07-15

## Kontekst

Bu **Kelvin'ning eng nozik texnik masalasi**.

Ssenariy: omborda oxirgi bitta qandil. Ikki mijoz bir vaqtda "Sotib olish" tugmasini bosadi.

```
Vaqt  Mijoz A                      Mijoz B
────────────────────────────────────────────────────────
t1    SELECT available → 1
t2                                 SELECT available → 1
t3    if (1 >= 1) OK
t4                                 if (1 >= 1) OK
t5    UPDATE reserved = 1
t6                                 UPDATE reserved = 2   ← OVERSELL
```

Natija: ikki mijozdan pul olindi, tovar bitta. Do'kon bittasiga qo'ng'iroq qilib uzr so'rashi va pulni qaytarishi kerak. Bu **real pul va real obro' yo'qotish**.

Bu klassik **check-then-act** race condition. `SELECT` va `UPDATE` orasida boshqa tranzaksiya kirib keladi.

## Qaror

**Atomik shartli UPDATE.** Tekshirish va yozish — bitta operatsiyada.

```sql
UPDATE stock_items
SET    reserved = reserved + $quantity,
       version  = version + 1
WHERE  id = $stockItemId
  AND  (on_hand - reserved) >= $quantity
RETURNING *;
```

Qator qaytmasa → qoldiq yetarli emas → `409 INSUFFICIENT_STOCK`.

Qulf yo'q. Retry yo'q. Bitta so'rov.

## Sabablar

### Alternativalar

| Variant                                      | Nega rad etildi                                                                                                                                                     |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`SELECT` + tekshirish + `UPDATE`**         | Aynan yuqoridagi race. Buzuq                                                                                                                                        |
| **Pessimistic lock** (`SELECT … FOR UPDATE`) | Ishlaydi, lekin qulf tranzaksiya oxirigacha ushlanadi. Mashhur tovar (aksiyadagi qandil) uchun barcha so'rov navbatga tushadi → throughput yiqiladi. Deadlock xavfi |
| **Optimistic lock** (`version`)              | Ishlaydi, lekin **retry sikli** kerak. Yuqori raqobatda ko'p urinish → CPU isrofi va kechikish                                                                      |
| **Redis'da hisoblagich**                     | Tez, lekin Redis va PostgreSQL orasida ikkilangan haqiqat. Redis yo'qolsa qoldiq buziladi. Qoldiq — **real tovar**, efemer emas                                     |
| **Serializable izolyatsiya**                 | To'g'ri, lekin serialization failure → retry, va butun tranzaksiya qayta bajariladi. Qimmat                                                                         |

### Nega atomik UPDATE g'olib

- **Bitta so'rov** — network round-trip bitta
- **Qulf minimal** — faqat qator darajasida, UPDATE davomida
- **Retry kerak emas** — shart bajarilmasa, qator qaytmaydi va bu **to'g'ri javob**
- **Deadlock kamroq** — qulf qisqa

PostgreSQL `UPDATE` ni bajarganda qatorni avtomatik qulflaydi va `WHERE` shartini **qulf olingandan keyin** qayta baholaydi.

## ⚠️ Kritik nuance — buni bilmasangiz yechim buziladi

Bu ADR'ning eng muhim qismi.

Yuqoridagi yechim `READ COMMITTED` izolyatsiyasida ishlaydi, chunki PostgreSQL'da **`EvalPlanQual`** mexanizmi bor:

> Ikki tranzaksiya bir qatorni UPDATE qilmoqchi bo'lsa, ikkinchisi birinchisini kutadi. Birinchi commit bo'lgach, ikkinchisi qatorning **YANGI versiyasini** oladi va **`WHERE` shartini QAYTA baholaydi**.

Ya'ni B ning `WHERE (on_hand - reserved) >= 1` sharti A commit qilgandan keyin qayta tekshiriladi va **bajarilmaydi** → qator qaytmaydi → oversell yo'q.

**Lekin bu `REPEATABLE READ` yoki `SERIALIZABLE` da BOSHQACHA ishlaydi:** u yerda ikkinchi tranzaksiya `EvalPlanQual` o'rniga **serialization failure** xatosini oladi va retry kerak bo'ladi.

**Oqibat:** agar kimdir kelajakda tranzaksiya izolyatsiyasini oshirsa, bu yechim **jimgina buziladi** — xato bermaydi, lekin retry qilinmagani uchun so'rov muvaffaqiyatsiz bo'ladi.

**Yumshatish:**

1. Izolyatsiya darajasi kodda ochiq belgilanadi va kommentda sababi yoziladi
2. Concurrency testi izolyatsiya o'zgarsa yiqiladi
3. Bu ADR shu testda havola qilinadi

## Deadlock

Ikki buyurtma ikki xil tovarni **teskari tartibda** rezerv qilsa:

```
Buyurtma A: qandil(id=5) → spot(id=9)
Buyurtma B: spot(id=9)   → qandil(id=5)
→ DEADLOCK
```

**Yechim:** har doim **bir xil tartibda** qulflash. Servis qatlamida `variantId` bo'yicha `ORDER BY` majburlanadi:

```ts
const sorted = [...items].sort((a, b) => (a.variantId < b.variantId ? -1 : 1));
for (const item of sorted) {
  await this.reserve(tx, item);
}
```

⚠️ **Bu test bilan tekshirilishi shart** — saralashsiz test **yiqilishi kerak**. Aks holda test yolg'on gapiradi.

## Oqibatlar

**Ijobiy:**

- Oversell **tuzilmaviy jihatdan imkonsiz**
- Retry mantiqi yo'q — kod oddiy
- Yuqori throughput

**Salbiy:**

- **PostgreSQL'ga bog'liq.** `EvalPlanQual` — PostgreSQL xususiyati. MySQL'da xatti-harakat farq qiladi. Bazani almashtirish bu yechimni qayta ko'rib chiqishni talab qiladi
- Izolyatsiya darajasiga sezgir (yuqorida)
- `SELECT` bilan "mavjud" deb ko'rsatilgan tovar checkout'da "tugagan" bo'lishi mumkin. Bu **to'g'ri** xatti-harakat, lekin UX'da yaxshi ishlov berilishi kerak
- `version` ustuni saqlanadi lekin bu yechimda ishlatilmaydi — kelajakdagi optimistic lock uchun zaxira

## Test — bu ADR'ning haqiqiy isboti

```ts
it('100 parallel rezerv, 1 tovar → aniq 1 muvaffaqiyat', async () => {
  await seedStock({ variantId, onHand: 1 });

  const results = await Promise.allSettled(
    Array.from({ length: 100 }, () => reservationService.reserve({ variantId, quantity: 1 })),
  );

  const ok = results.filter((r) => r.status === 'fulfilled').length;
  expect(ok).toBe(1); // ANIQ bitta
  expect(await getReserved(variantId)).toBe(1);
});
```

Bu test **Testcontainers bilan real PostgreSQL'da** ishlashi shart. Mock DB bu race'ni ko'rsata olmaydi — u yolg'on ishonch beradi.

## Havolalar

- [06-inventory-and-reservations.md](../06-inventory-and-reservations.md)
- [14-testing-strategy.md](../14-testing-strategy.md) §4
- PostgreSQL docs — Transaction Isolation, `EvalPlanQual`
