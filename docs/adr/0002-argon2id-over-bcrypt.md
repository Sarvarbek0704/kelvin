# ADR-0002 — Parol hash uchun Argon2id

- **Holat:** Qabul qilingan
- **Sana:** 2026-07-15

## Kontekst

Kelvin foydalanuvchi parollarini saqlaydi: mijozlar, sotuvchilar, ombor xodimi, buxgalter, do'kon egasi.

Ma'lumot bazasi o'g'irlansa, parollar qanchalik himoyalangan bo'lishi kerak? Va bu yerda nozik nuqta bor: **admin paroli** buzilsa, hujumchi narxlarni o'zgartirishi, chegirma yaratishi, qoldiqni "tuzatishi" mumkin — ya'ni **to'g'ridan-to'g'ri pul o'g'irlashi**.

Loyiha egasining oldingi loyihalarida:

| Loyiha | Hash | Baho |
|---|---|---|
| `chess` | bcrypt, cost **7** | 2026 uchun **juda past** |
| `dorixona` | bcrypt, cost 10 | Chegarada |
| `donate_service` | bcrypt, cost 12 | Yaxshi |

Va `dorixona` da hardkod qilingan `admin` / `admin123` seeder har ishga tushganda ishlaydi va parolni konsolga chop etadi. Bu — backdoor.

## Qaror

**Argon2id.** Boshlang'ich parametrlar (OWASP tavsiyasi):

```ts
{ type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 }
```

⚠️ Bu qiymatlar **taxminiy** — prod hardware'da benchmark qilinishi kerak. Maqsad: bitta hash ~50–100ms.

**Refresh tokenlar uchun: SHA-256** (Argon2 emas).

**Seeder prod'da hech qanday hisob yaratmaydi.**

## Sabablar

### Nega Argon2id

bcrypt (1999) **CPU-og'ir, lekin xotira-yengil**. Zamonaviy GPU minglab bcrypt hash'ini parallel hisoblaydi.

Argon2 (2015, Password Hashing Competition g'olibi) — **memory-hard**. Har hash uchun sozlanadigan xotira. GPU'da 10 000 parallel hash uchun ~190 GB kerak — hujum iqtisodiy jihatdan o'ladi.

| Xususiyat | bcrypt | Argon2id |
|---|---|---|
| Memory-hard | **Yo'q** | **Ha** |
| GPU qarshiligi | Zaif | Kuchli |
| Parol uzunligi | **72 bayt** (jimgina kesiladi!) | Cheklovsiz |
| OWASP 2026 | Faqat legacy | **Birinchi tanlov** |

**bcrypt'ning 72-bayt cheklovi** alohida xavfli: undan uzun parol **jimgina kesiladi** va foydalanuvchi buni bilmaydi.

### Nega cost 7 xavfli edi

bcrypt cost logarifmik. Cost 7 = 2⁷ = 128 iteratsiya. OWASP minimum — **cost 10** (1024 iteratsiya, 8× ko'p). Cost 7 bilan hash'langan parollar zamonaviy GPU'da amalda himoyasiz.

### Nega refresh token uchun SHA-256, Argon2 emas

Bu nozik nuqta va ko'p loyihada xato qilinadi.

**Parol** — past entropiyali (odam o'ylab topgan, lug'at hujumiga ochiq) → sekin hash kerak.

**Refresh token** — 256 bit tasodifiy → brute-force **imkonsiz**, hash tezligidan qat'i nazar. Bu yerda sekin hash **hech qanday himoya bermaydi**, faqat har `POST /auth/refresh` ni sekinlashtiradi.

Va bu **DoS vektori**: hujumchi refresh endpoint'ini bombardimon qilib serverni bo'g'adi — har so'rov 19 MiB xotira va 100ms CPU yeydi.

To'g'risi: SHA-256. Tez, va bu holatda **yetarli**.

## Oqibatlar

**Ijobiy:**
- Baza o'g'irlansa ham parollar amalda ochilmaydi
- Parol uzunligida cheklov yo'q
- Refresh endpoint tez va DoS'ga chidamli

**Salbiy:**
- **Har login ~19 MiB xotira.** 100 parallel login = ~2 GB. Bu **sizing va rate limiting'da hisobga olinishi kerak**
- `argon2` npm paketi — **native binding**. Docker'da build vositalari kerak (multi-stage build bilan hal qilinadi)
- Parametrlar server quvvatiga bog'liq → **benchmark shart**

## Havolalar

- [11-security.md](../11-security.md)
- OWASP Password Storage Cheat Sheet
- RFC 9106 — Argon2
