# ADR-0004 — Kritik event'lar uchun transactional outbox

- **Holat:** Qabul qilingan
- **Sana:** 2026-07-15

## Kontekst

Modullar bir-biri bilan domain event orqali gaplashadi. NestJS `EventEmitter2` beradi — oddiy, tez, in-process. Lekin u **DB tranzaksiyasi bilan atomik emas**.

## Muammo — Kelvin'da bu real pul

```ts
// ❌ Buzuq
await prisma.$transaction(async (tx) => {
  await tx.payment.update({ where: { id }, data: { status: 'PAID' } });
});
// ← process shu yerda yiqilsa?
eventEmitter.emit('PaymentCompleted', { paymentId });
```

Natija: to'lov `PAID`, lekin `PaymentCompleted` chiqmaydi → rezerv consume qilinmaydi, buyurtma tasdiqlanmaydi, mijozga SMS bormaydi.

**Mijoz 5 million so'm to'ladi va hech narsa olmadi.** Log'da xato yo'q. Hech kim sezmaydi — toki mijoz qo'ng'iroq qilguncha.

Tartibni almashtirsak ham yordam bermaydi:

```ts
// ❌ Bu ham buzuq — teskari tomondan
eventEmitter.emit('PaymentCompleted');
await prisma.$transaction(...);  // ← bu yiqilsa? Buyurtma tasdiqlandi, to'lov yozilmadi
```

Bu **dual write problem**: ikki tizimga (DB va event bus) atomik yozib bo'lmaydi.

## Qaror

**Kritik event'lar uchun transactional outbox.**

```ts
// ✅ Atomik
await prisma.$transaction(async (tx) => {
  await tx.payment.update({ where: { id }, data: { status: 'PAID' } });
  await tx.outboxEvent.create({
    data: {
      eventType: 'PaymentCompleted',
      aggregateType: 'Payment',
      aggregateId: id,
      payload: { paymentId: id, amount: amount.toString() },
    },
  });
});
// Ikkalasi ham commit bo'ladi yoki ikkalasi ham bo'lmaydi.
```

Alohida worker `outbox_events` ni poll qiladi va publish qiladi.

## Qaysi event'lar outbox talab qiladi

**Bu ro'yxat qat'iy.** Hamma event outbox'ga o'tkazilsa — keraksiz murakkablik va DB yuklamasi.

| Event | Outbox? | Sabab |
|---|---|---|
| `PaymentCompleted` | **Ha** | Pul |
| `RefundIssued` | **Ha** | Pul |
| `OrderPlaced` | **Ha** | Rezervni consume qiladi — real tovar |
| `StockAdjusted` | **Ha** | Real tovar |
| `InstallmentOverdue` | **Ha** | Mijoz huquqi, penya |
| `ProductUpdated` | Yo'q | Search reindex — yo'qolsa keyingi safar tuzatiladi |
| `ReviewPosted` | Yo'q | Moderatsiya baribir qo'lda |
| `CartUpdated` | Yo'q | Efemer |

**Mezon:** event yo'qolsa **pul, real tovar yoki mijoz huquqi** zarar ko'radimi? Ha bo'lsa — outbox.

## At-least-once — va uning narxi

Outbox **at-least-once** kafolat beradi, exactly-once **emas**.

Worker publish qildi, lekin `status: 'PUBLISHED'` yozishdan oldin yiqildi → keyingi poll'da **ikkinchi marta** publish qiladi.

Exactly-once distributed tizimda **printsipial imkonsiz**. Buni yamashga urinish — vaqt isrofi.

**Shuning uchun: har handler idempotent bo'lishi SHART.** Bu arxitektura talabi.

```ts
// ❌ Idempotent emas — Kelvin'da bu HALOKATLI
async onPaymentCompleted(e) {
  await this.inventory.consumeReservation(e.reservationId);  // ikki marta = qoldiq ikki marta kamayadi!
}

// ✅ Idempotent — absolyut holat, nisbiy o'zgarish emas
async onPaymentCompleted(e) {
  await prisma.$transaction(async (tx) => {
    const res = await tx.stockReservation.updateMany({
      where: { id: e.reservationId, status: 'CONFIRMED' },   // ← shart
      data: { status: 'CONSUMED', consumedAt: new Date() },
    });
    if (res.count === 0) return;  // allaqachon bajarilgan → chiqamiz
    await tx.stockMovement.create({ ... });
  });
}
```

Ikki texnika:
1. **Shartli update** — `WHERE status = 'CONFIRMED'`. Ikkinchi marta 0 qator → hech narsa qilinmaydi
2. **Ishlangan event'lar jurnali** — `eventId` bo'yicha tekshirish

Birinchisi afzal: qo'shimcha jadval kerak emas va shart DB darajasida.

## Tartib (ordering)

Outbox `ORDER BY id` bilan o'qiydi. UUID v7 vaqt bo'yicha tartiblangani uchun bu **yaratilish tartibi**.

⚠️ Bir nechta worker parallel ishlasa — tartib buziladi. Hozircha: **bitta worker**. Yetarli, chunki kritik event'lar kam.

Kelajakda: `aggregateId` bo'yicha partitioning + `SELECT ... FOR UPDATE SKIP LOCKED`.

## Oqibatlar

**Ijobiy:**
- Dual write problem hal qilingan
- Event yo'qolmaydi — DB'da turadi
- Retry tabiiy
- **Debug oson** — `outbox_events` jadvalini ko'rish mumkin: qaysi event chiqmagan, nega
- Failed event'lar ko'rinadi va alert qilinadi

**Salbiy:**
- **Kechikish** — poll oralig'i (~500ms). Real-time emas
- Qo'shimcha jadval, worker, monitoring
- **Har handler idempotent bo'lishi shart** — doimiy intizom
- `outbox_events` o'sadi → tozalash job kerak (PUBLISHED 7 kundan keyin o'chiriladi)
- Poll — DB'ga doimiy yuklama (index bilan arzon, lekin nol emas)

## Alternativalar

| Variant | Nega rad etildi |
|---|---|
| **Oddiy `EventEmitter2`** | Dual write problem. **Kritik bo'lmagan event'lar uchun ishlatiladi** |
| **CDC** (Debezium + Kafka) | To'g'ri, lekin Kafka + Debezium infrastrukturasi. Bitta do'kon uchun bu absurd |
| **`LISTEN`/`NOTIFY`** | Poll'siz, tez. Lekin **kafolatsiz** — tinglovchi yo'q bo'lsa xabar yo'qoladi. Aynan hal qilmoqchi bo'lgan muammomiz |
| **Hamma event outbox'da** | Keraksiz yuklama va kechikish |

## Havolalar

- [02-architecture.md §6.2](../02-architecture.md)
- [07-order-and-checkout.md](../07-order-and-checkout.md) — saga bilan bog'liqlik
- Chris Richardson — "Transactional Outbox Pattern"
