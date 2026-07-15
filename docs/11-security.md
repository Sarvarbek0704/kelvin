# 11 — Xavfsizlik

> Modullar: `identity` (kanon §7, №1), `admin` (№17) — lekin xavfsizlik **barcha** modullarga tegishli
> Entity'lar: `User`, `Session`, `RefreshToken`, `AuditLog`
> Bog'liq hujjatlar: `docs/08-payments-and-installments.md`, `docs/07-order-and-checkout.md`,
> `docs/06-inventory-and-reservations.md`, `docs/10-crm-pos-analytics.md`, `docs/12-infrastructure.md`

---

## 0. Bu hujjat nima haqida

Bu hujjat Kelvin'ning tahdid modelini va unga qarshi choralarni belgilaydi.

**Eng muhim gap boshida:** Kelvin uchun eng katta xavf tashqi haker emas. Bitta
do'konning yoritish katalogi hech kimni qiziqtirmaydi. Eng katta xavf —
**ichkarida**: chegirma huquqi bor sotuvchi, qoldiqni "tuzatadigan" ombor xodimi,
naqd pul bilan ishlaydigan kassir. Bu hujjat shuning uchun `AuditLog` va
rol chegaralariga tashqi perimetr himoyasidan ko'ra ko'proq joy ajratadi.

### 0.1. Nima YOZILMAYDI

- **Yuridik talqin.** O'zbekiston "Shaxsga doir ma'lumotlar to'g'risida"gi qonuni
  nimani talab qiladi — bu **yurist savoli** (kanon §10). Bu hujjat savolni
  aniq qo'yadi, javob bermaydi. §6 — bloker.
- **PCI DSS sertifikatlash.** Kelvin karta ma'lumotiga umuman tegmaydi (§4).
  Sertifikat kerak emas — chunki scope'ga tushmaymiz.
- **Click/Payme imzo algoritmi detallari** — rasmiy hujjatdan tekshiriladi
  (kanon §10). `docs/08-payments-and-installments.md`.
- **Penetratsiya testi natijalari** — hali o'tkazilmagan (§14).

### 0.2. Xavfsizlik byudjeti haqida halol gap

Bu bitta do'kon. WAF, SIEM, 24/7 SOC, bug bounty dasturi — **ortiqcha**.
Bu hujjat "hamma narsani yoqamiz" demaydi. U kam sonli, lekin **haqiqatan
kerak** bo'lgan choralarni tanlaydi va nega boshqalari tanlanmaganini aytadi.

Tanlash mezoni oddiy: **agar bu chora ishlamasa, kim qancha pul yo'qotadi?**

| Chora                          | Ishlamasa                               | Prioritet                                  |
| ------------------------------ | --------------------------------------- | ------------------------------------------ |
| Narx serverda hisoblanishi     | Mijoz qandilni 1000 so'mga oladi        | **P0**                                     |
| Webhook imzo tekshiruvi        | Soxta "to'landi" → tovar tekinga ketadi | **P0**                                     |
| Audit log                      | Ichki o'g'irlik isbotlanmaydi           | **P0**                                     |
| Refresh reuse detection        | O'g'irlangan sessiya cheksiz yashaydi   | **P1**                                     |
| Raqib scraping'ini sekinlatish | Raqib narxni biladi                     | **P3** (§1.5 — halol: to'xtatib bo'lmaydi) |

---

## 1. Threat model — STRIDE

### 1.1. Metodologiya

STRIDE — Microsoft'ning tahdid tasnifi: **S**poofing (kimligini soxtalashtirish),
**T**ampering (o'zgartirish), **R**epudiation (rad etish), **I**nformation
disclosure (ma'lumot sizishi), **D**enial of service, **E**levation of privilege
(huquq oshirish).

STRIDE tanlandi, chunki u aktivga bog'lanadi: har aktiv uchun oltita savol
beriladi. Bu "xavfsizlik haqida o'ylab ko'ramiz" dan ko'ra tekshiriladigan.

### 1.2. Aktivlar

Aktiv — himoya qilinadigan narsa. Kelvin'da ettita:

| #   | Aktiv                       | Nima                                            | Yo'qotilsa nima bo'ladi            |
| --- | --------------------------- | ----------------------------------------------- | ---------------------------------- |
| A1  | **Mijoz shaxsiy ma'lumoti** | Ism, telefon, manzil, buyurtma tarixi           | Yuridik javobgarlik (⚖️ §6), obro' |
| A2  | **To'lov**                  | Click/Payme tranzaksiyalari, rassrochka grafigi | To'g'ridan-to'g'ri pul yo'qotish   |
| A3  | **Buyurtma**                | `Order`, holat, manzil, summa                   | Pul + operatsion tartibsizlik      |
| A4  | **Narx va chegirma**        | `Price`, `Discount`, `Promotion`                | Foyda marjasining yo'qolishi       |
| A5  | **Qoldiq**                  | `StockItem`, `StockMovement`                    | O'g'irlikning yashirilishi         |
| A6  | **Ledger**                  | `LedgerEntry` — pul harakati yozuvi             | Buxgalteriya ishonchsiz bo'ladi    |
| A7  | **Admin panel**             | Butun tizim boshqaruvi                          | Hammasi                            |

**Aktivlar orasidagi bog'liqlik muhim:** A7 (admin) buzilsa — A4, A5, A6 avtomatik
buzilgan hisoblanadi. Shuning uchun admin panel himoyasi eng qattiq (§2.6 — 2FA).

### 1.3. Hujumchi profillari

Xavfsizlik "hujumchi" degan mavhum figurani emas, **aniq odamlarni** ko'zda tutishi kerak:

| #      | Profil                      | Motivatsiya                                    | Imkoniyat                             | Kelvin uchun realmi                                                              |
| ------ | --------------------------- | ---------------------------------------------- | ------------------------------------- | -------------------------------------------------------------------------------- |
| **P1** | **Tashqi opportunist**      | Avtomatik skanerlar, ma'lum CVE, default parol | Past — skript kiddie                  | **Ha.** Har bir ochiq port buni ko'radi                                          |
| **P2** | **Raqib do'kon**            | Narx, assortiment, qoldiq razvedkasi           | O'rta — scraper yozadi yoki yozdiradi | **Ha.** §1.5                                                                     |
| **P3** | **Ichki xodim**             | Pul. Chegirma, qoldiq, naqd                    | **Yuqori — u allaqachon ichkarida**   | **Ha, va eng ehtimoliy.** §1.6                                                   |
| **P4** | **Bot / scraper**           | Kontent nusxalash, OTP flood, savat spam       | O'rta                                 | **Ha.** OTP flood — pul turadi (§8.4)                                            |
| **P5** | **Maqsadli hujumchi (APT)** | —                                              | Yuqori                                | **Yo'q.** Bitta yoritish do'koni APT nishoni emas. Halol: bunga qarshi qurmaymiz |

> **P5 ni ochiq rad etamiz.** Davlat darajasidagi hujumchiga qarshi himoya qurish
> bu loyihaning byudjetida ham, ma'nosida ham yo'q. Agar Kelvin shunday nishonga
> aylansa — bu hujjat qayta yoziladi.

### 1.4. STRIDE matritsasi

| Aktiv                  | S — soxtalashtirish                  | T — o'zgartirish                                               | R — rad etish           | I — sizish                                                | D — DoS                       | E — huquq oshirish                  |
| ---------------------- | ------------------------------------ | -------------------------------------------------------------- | ----------------------- | --------------------------------------------------------- | ----------------------------- | ----------------------------------- |
| **A1 Mijoz ma'lumoti** | Boshqa mijoz nomidan kirish          | Manzilni almashtirish                                          | —                       | **IDOR: `/orders/{id}` (§3.4)**, mehmon buyurtmasi (§2.7) | —                             | Mijoz → admin                       |
| **A2 To'lov**          | **Soxta webhook (§4.3)**             | Summani o'zgartirish                                           | "Men to'lamadim"        | Karta ma'lumoti — **saqlanmaydi (§4.1)**                  | To'lov provayderi yotsa       | Refund huquqi                       |
| **A3 Buyurtma**        | Mehmon buyurtmasini ko'rish          | Holatni o'zgartirish                                           | "Men buyurtma bermadim" | Boshqa mijoz buyurtmasi                                   | Savat spam                    | Kuryer → boshqa jo'natma            |
| **A4 Narx/chegirma**   | —                                    | **Mijoz `price` yuboradi (§5.1)**, chegirma brute-force (§5.2) | —                       | Raqib scraping (§1.5)                                     | —                             | **Sotuvchi o'ziga chegirma (§1.6)** |
| **A5 Qoldiq**          | —                                    | **"Inventarizatsiya tuzatishi" (§1.6)**                        | Kim yozganini bilmaslik | Raqib qoldiqni biladi                                     | Rezerv flood → oversell bloki | Ombor xodimi → chiqim               |
| **A6 Ledger**          | —                                    | **Yozuvni o'chirish/o'zgartirish**                             | Buxgalteriya nizosi     | Aylanma ma'lumoti                                         | —                             | —                                   |
| **A7 Admin panel**     | Parol o'g'irlash, sessiya o'g'irlash | —                                                              | —                       | Butun baza                                                | —                             | **Rol berish (§11.3)**              |

Qalin bilan belgilangan hujayralar — bu hujjatda alohida bo'lim bilan yoritilganlari.
Belgilanmaganlari standart choralar bilan qoplanadi (§10 — OWASP jadvali).

### 1.5. Raqib scraping — halol muhokama

Bu e-commerce'ga xos tahdid va uni **ochiq gapirish kerak**.

**Vaziyat:** Kelvin narxlarni ochiq saytda ko'rsatadi. Raqib do'kon har kuni
katalogni aylanib chiqib, narxlarni yig'adi va o'zinikini bir foizga past qo'yadi.

**Birinchi haqiqat: buni to'liq to'xtatib bo'lmaydi.**

Narx **ochiq bo'lishi kerak** — mijoz uni ko'rmasa, sotib olmaydi. Brauzer ko'ra
olgan narsani skript ham ko'ra oladi. Har qanday himoya — bu faqat **narxni
oshirish**, to'sish emas:

| Chora                       | Nima beradi                          | Nimaga to'xtatmaydi                                         |
| --------------------------- | ------------------------------------ | ----------------------------------------------------------- |
| Rate limiting (IP bo'yicha) | Sodda skriptni sekinlatadi           | Proksi puli — arzon                                         |
| User-Agent tekshiruvi       | `curl` ni to'xtatadi                 | `--user-agent` bitta flag                                   |
| CAPTCHA                     | Avtomatlashtirishni qimmatlashtiradi | **Mijozni ham to'sadi.** Konversiya tushadi                 |
| JS-rendering talabi         | Sodda HTTP scraper'ni sindiradi      | Playwright — 20 qator kod. **SEO ni o'ldiradi** (`docs/13`) |
| Narxni rasmda ko'rsatish    | Text parsing'ni sindiradi            | OCR. **A11y va SEO halokati.** Qilinmaydi                   |

**Kelvin qarori — o'rtacha yo'l:**

1. **Rate limiting** — anonim katalog so'rovlariga IP bo'yicha (§8.3). Bu asosan
   infratuzilmani himoya qiladi, narxni emas.
2. **Anomaliya aniqlash → alert, blok EMAS.** Bitta IP soatiga 5000 mahsulot
   sahifasini ochsa — do'kon egasiga xabar. Qaror odamga qoladi.
3. **CAPTCHA — faqat login va OTP'da.** Katalogda **yo'q**: mijozni jazolash
   raqibga yetkazilgan zarardan katta.
4. **`robots.txt`** — halol bot'lar uchun. Yomon bot buni o'qimaydi, lekin bu
   yuridik pozitsiya uchun kerak (⚖️ — bu ham yurist savoli).

**Ikkinchi haqiqat (biznes gapi, texnik emas):** raqib narxni **baribir biladi** —
u shunchaki do'konga kirib ko'radi yoki tanishiga so'ratadi. Narxni maxfiy deb
hisoblash — noto'g'ri model. Agar biznes strategiyasi "narximizni raqib bilmasin"
ga qurilgan bo'lsa — muammo strategiyada, xavfsizlikda emas.

> **Ochiq savol (§15):** narx razvedkasi haqiqatan tashvishmi? Agar ha —
> bu **biznes** qarori (masalan, ro'yxatdan o'tgan mijozga alohida narx),
> texnik chora emas.

### 1.6. Ichki tahdid — bu hujjatning eng muhim bo'limi

**Sabab:** ichki xodim allaqachon autentifikatsiyadan o'tgan. Firewall, HTTPS,
Argon2id — hech biri unga to'sqinlik qilmaydi. U tizimdan **ruxsat etilgan
tarzda** foydalanib o'g'irlaydi.

#### Ssenariy 1 — sotuvchi chegirma bilan o'g'irlik

Sotuvchining chegirma berish huquqi bor (bu normal — bozorlik qilish O'zbekistonda
savdo madaniyati). Hujum:

1. Mijoz 5 000 000 so'mlik qandil sotib oladi, naqd to'laydi.
2. Sotuvchi tizimga **20% chegirma** kiritadi → 4 000 000 so'm.
3. Mijozdan 5 000 000 oladi, kassaga 4 000 000 qo'yadi.
4. **1 000 000 so'm — cho'ntakka.** Kassa balansi to'g'ri. Qoldiq to'g'ri.
   Hech narsa "buzilmagan".

**Nega texnik himoya yolg'iz yetarli emas:** chegirma — qonuniy funksiya.
Uni o'chirish savdoni o'ldiradi.

**Choralar (chuqurlikda himoya):**

| Chora                                   | Qanday                                                | Cheklovi                                   |
| --------------------------------------- | ----------------------------------------------------- | ------------------------------------------ |
| **Chegirma limiti rolga bog'liq**       | `SELLER` → maks N%; undan yuqorisi `MANAGER` tasdig'i | N noma'lum — do'kon egasi belgilaydi (§15) |
| **Har chegirma `AuditLog` da**          | Kim, qancha, qaysi buyurtma, sabab (majburiy matn)    | Log o'qilmasa — foydasi yo'q               |
| **Sotuvchi bo'yicha chegirma hisoboti** | O'rtacha chegirma % — sotuvchilar kesimida            | Statistik anomaliya ≠ isbot                |
| **Mijozga chek/SMS**                    | Mijoz **yakuniy summani** ko'radi                     | Mijoz e'tibor bermasligi mumkin            |

> **Eng kuchli chora — texnik emas:** mijozga yuborilgan SMS'da yakuniy summa
> bo'lsa, sotuvchi qo'shimcha pul so'rashi mumkin emas — mijoz nomuvofiqlikni
> ko'radi. Bu `notification` moduli orqali (`docs/09`), lekin **xavfsizlik
> chorasi** sifatida qaraladi.

#### Ssenariy 2 — ombor xodimi qoldiqni "tuzatadi"

1. Xodim omborga bir dona LED lenta oladi.
2. Tizimda inventarizatsiya farqi paydo bo'ladi: 10 emas, 9.
3. Xodim `Inventory` tuzatishi kiritadi: "hisoblash xatosi, −1".
4. Qoldiq mos keladi. **Tovar yo'q.**

**Choralar:**

| Chora                                  | Qanday                                                                                                  |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| **Tuzatish huquqi ≠ hisoblash huquqi** | Sanaydigan odam tuzata olmaydi. `INVENTORY_COUNT` va `INVENTORY_ADJUST` — **alohida** huquq (`docs/06`) |
| **Har tuzatish sababli**               | Erkin matn majburiy, `AuditLog` ga                                                                      |
| **Summa chegarasi**                    | Tannarxi X dan katta tuzatish → `MANAGER` tasdig'i. X noma'lum (§15)                                    |
| **Tuzatish hisoboti**                  | Xodim kesimida: kim eng ko'p "tuzatadi"                                                                 |
| **Ikki kishi qoidasi**                 | Qimmat pozitsiyalarni ikki xodim sanaydi. Operatsion, texnik emas                                       |

#### Ssenariy 3 — kassir va naqd

`docs/10-crm-pos-analytics.md` §POS da: smena ochilishi/yopilishi, naqd
sanog'i, `DISCREPANCY` holati. Bu yerda takrorlanmaydi.

#### Umumiy printsip

> **Kelvin ichki o'g'irlikni to'sa olmaydi. U uni KO'RINADIGAN qiladi.**

Bu ataylab tanlangan pozitsiya. To'liq to'sish uchun har amalni ikkinchi odam
tasdiqlashi kerak bo'lardi — bu bitta do'konni ishlamaydigan holga keltiradi
(u yerda ba'zan **jami 3 kishi** ishlaydi). Shuning uchun model:

1. Har muhim amal — `AuditLog` da, **o'zgartirib bo'lmaydigan** (§11).
2. Anomaliya — hisobotda ko'rinadi.
3. Qaror — odamniki.

**Bu shuni anglatadiki:** agar `AuditLog` ishlamasa yoki hech kim hisobotni
o'qimasa — bu bo'lim **butunlay befoyda**. Shuning uchun §11 da audit log
immutability DB darajasida majburlanadi, va §15 da "kim hisobotni o'qiydi?"
ochiq savol sifatida turadi.
