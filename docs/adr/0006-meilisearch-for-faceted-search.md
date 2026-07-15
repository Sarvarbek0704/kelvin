# ADR-0006 — Faceted search uchun Meilisearch

- **Holat:** Qabul qilingan · ⚠️ **shartli** — quyidagi "Qachon qayta ko'riladi" ni o'qing
- **Sana:** 2026-07-15

## Kontekst

Yoritgich katalogida **15+ filtrlanadigan atribut** bor: lyumen, rang harorati, CRI, IP darajasi, tsokol, quvvat, kuchlanish, dimmable, nur burchagi, lampa komplektda, nur manbai, o'rnatish turi, rang, material, brend, narx.

Mijoz filtr panelida har bir variant yonida **nechta natija borligini** ko'rishi kerak:

```
Rang harorati
  ☐ 2700K (34)
  ☐ 3000K (12)
  ☐ 4000K (56)
```

Bu **facet count** — va u qiyin. Har filtr uchun alohida `COUNT` so'rovi kerak, tanlangan boshqa filtrlarni hisobga olgan holda. 15 atribut → o'nlab agregat so'rov, har sahifa yuklanishida.

Qo'shimcha: **typo tolerance** ("люстро" → "люстра") va **ko'p tillilik** (bir mahsulot o'zbek lotin, o'zbek kirill va rus tilida qidiriladi).

## Qaror

**Meilisearch** — qidiruv indeksi sifatida.

**PostgreSQL — haqiqat manbai.** Meilisearch faqat **ID ro'yxatini** qaytaradi; narx va qoldiq PostgreSQL'dan qayta o'qiladi.

## Sabablar

### PostgreSQL nima qila oladi

Halol bo'lamiz: PostgreSQL ancha narsani qiladi.

- `JSONB` + **GIN index** → atribut bo'yicha filtr (`attributes @> '{"socket_type": "E27"}'`)
- `pg_trgm` → fuzzy matn qidiruv
- `tsvector` → full-text
- Agregat so'rov → facet count

**1000 SKU uchun bu yetarli.** Va PostgreSQL allaqachon bor — yangi servis, yangi backup, yangi monitoring kerak emas.

### Meilisearch nima qo'shadi

|                    | PostgreSQL                           | Meilisearch                     |
| ------------------ | ------------------------------------ | ------------------------------- |
| Facet count        | Qo'lda agregat, har filtr uchun      | **O'rnatilgan**, bitta so'rovda |
| Typo tolerance     | `pg_trgm` similarity — sozlash qiyin | **O'rnatilgan**                 |
| Ranking            | Qo'lda                               | O'rnatilgan, sozlanadigan       |
| Ko'p tilli qidiruv | Har til uchun alohida `tsvector`     | Bitta index, ko'p maydon        |
| Sinonim            | Qo'lda jadval                        | Konfiguratsiya                  |
| Sozlash            | Ko'p ish                             | `npx meilisearch`               |

Facet count — asosiy farq. PostgreSQL'da uni yozish mumkin, lekin har filtr o'zgarishida 15 ta agregat so'rov ishga tushadi va ular indeksdan to'liq foydalanmaydi.

### Nega Elasticsearch emas

- Og'ir (JVM, min 2 GB RAM). Bu **bitta do'kon**
- Sozlash murakkab
- Meilisearch bu miqyosda yetarli va bir necha daqiqada ishga tushadi

Elasticsearch — 100k+ SKU va murakkab agregatlar uchun. Kelvin unday emas.

## ⚠️ Bu qaror SHARTLI

**Halol tan olamiz: SKU soni NOMA'LUM.**

Bu qaror "yoritgichda atribut ko'p" degan **farazga** asoslangan. Lekin:

| SKU soni  | To'g'ri tanlov                                             |
| --------- | ---------------------------------------------------------- |
| < 500     | **PostgreSQL yetarli.** Meilisearch — ortiqcha murakkablik |
| 500–5 000 | Chegara. O'lchov kerak                                     |
| > 5 000   | Meilisearch o'zini oqlaydi                                 |

Real do'konda nechta SKU? **Bilmaymiz** — bu [00-vision-and-scope.md §6](../00-vision-and-scope.md) dagi ochiq savol.

**Shuning uchun arxitektura himoyalangan:** `SearchPort` interfeysi ortida ikki implementatsiya bo'lishi mumkin — `MeilisearchAdapter` va `PostgresSearchAdapter`. Almashtirish uchun chaqiruvchi kod o'zgarmaydi.

```ts
export interface SearchPort {
  search(query: SearchQuery): Promise<SearchResult>;
  index(variants: ProductVariant[]): Promise<void>;
  remove(variantIds: string[]): Promise<void>;
}
```

Bu **ataylab qilingan zaxira**: agar o'lchov Meilisearch keraksiz ekanini ko'rsatsa, uni bir modul almashtirish bilan olib tashlash mumkin.

## Sinxronizatsiya va uning xavfi

```
PostgreSQL (haqiqat) → outbox → BullMQ job → Meilisearch (index)
```

**Nomuvofiqlik muqarrar:** index bir necha soniya eskirgan bo'ladi.

**Nima bo'lishi mumkin:** mijoz qidiruvda "bor" deb ko'rsatilgan tovarni bosadi, mahsulot sahifasida "tugagan" chiqadi.

**Bu qabul qilinadi**, chunki:

- Qidiruv natijasi — **taxmin**, va'da emas
- Narx va qoldiq mahsulot sahifasida **PostgreSQL'dan** qayta o'qiladi
- **Oversell bo'lmaydi** — rezerv PostgreSQL'da atomik ([ADR-0007](./0007-atomic-conditional-reservation.md))

Ya'ni eskirgan index **noqulaylik** keltiradi, **pul yo'qotmaydi**. Bu farq muhim.

⚠️ **Qoida:** Meilisearch'dan **hech qachon** narx yoki qoldiq ko'rsatilmaydi. U faqat ID ro'yxatini beradi. Bu qoida buzilsa — mijozga eskirgan narx ko'rsatiladi va bu yuridik muammo.

## Oqibatlar

**Ijobiy:**

- Facet count tayyor
- Typo tolerance tayyor
- Qidiruv tez

**Salbiy:**

- **Yangi servis** — backup, monitoring, versiya yangilash
- **Ikkilangan ma'lumot** → sinxronizatsiya muammosi
- **RAM** — index xotirada. SKU o'sishi bilan o'sadi
- Index yo'qolsa qayta qurish kerak (job bor, lekin vaqt oladi)
- Dev muhitda yana bitta konteyner

## Qachon qayta ko'riladi

| Signal                           | Chora                                                |
| -------------------------------- | ---------------------------------------------------- |
| **SKU < 500 ekani aniqlansa**    | **Meilisearch'ni olib tashlash.** PostgreSQL yetarli |
| Sinxronizatsiya muammosi tez-tez | PostgreSQL'ga qaytish yoki CDC                       |
| Meilisearch RAM'i qimmat         | O'lchash, keyin qaror                                |

**Birinchi qator eng ehtimolli.** Agar do'konda 300 ta chiroq bo'lsa, bu ADR bekor qilinadi va bu **normal** — qaror o'lchovsiz qabul qilingan edi va o'lchov uni bekor qildi.

## Havolalar

- [05-catalog-and-search.md](../05-catalog-and-search.md)
- [02-architecture.md §8.3](../02-architecture.md)
