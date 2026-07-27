-- ============================================================================
--  Kelvin — buyurtma raqami ketma-ketligi + summa invarianti (Faza 3)
--
--  docs/07 §7.3: "buyurtma summasi hech qachon manfiy emas" — chegirmalar
--  ustma-ust tushib narxni manfiyga tushira olmaydi (kod cap qiladi, CHECK —
--  so'nggi qatlam).
-- ============================================================================

-- Inson o'qiy oladigan buyurtma raqami uchun (KLV-2026-000042).
CREATE SEQUENCE IF NOT EXISTS order_number_seq;

-- Buyurtma va qator summalari manfiy bo'la olmaydi.
ALTER TABLE "orders"
  ADD CONSTRAINT "orders_total_non_negative"    CHECK ("total_amount"    >= 0),
  ADD CONSTRAINT "orders_subtotal_non_negative" CHECK ("subtotal_amount" >= 0),
  ADD CONSTRAINT "orders_discount_non_negative" CHECK ("discount_amount" >= 0);

ALTER TABLE "order_items"
  ADD CONSTRAINT "order_items_total_non_negative" CHECK ("total_amount" >= 0),
  ADD CONSTRAINT "order_items_unit_non_negative"  CHECK ("unit_amount"  >= 0);
