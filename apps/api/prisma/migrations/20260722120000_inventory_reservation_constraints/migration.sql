-- ============================================================================
--  Kelvin — inventory/rezerv invariantlari (Faza 3)
--
--  ⚠️ "Haqiqiy kafolat — constraint, test emas." docs/06 §1.6, §1.5
--
--  Asosiy qoldiq invariantlari (on_hand>=0, reserved<=on_hand) allaqachon
--  20260717000001_immutability_and_constraints da. Bu migratsiya rezerv/harakat
--  invariantlarini to'ldiradi.
-- ============================================================================

-- Rezerv egasi ANIQ BITTA bo'lishi shart (cart YOKI order — ikkalasi emas, hech
-- qaysi biri ham emas). Kod buni tekshiradi, lekin CHECK — so'nggi qatlam.
ALTER TABLE "stock_reservations"
  ADD CONSTRAINT "stock_reservations_single_owner" CHECK (
    ("order_id" IS NOT NULL AND "cart_id" IS NULL) OR
    ("order_id" IS NULL AND "cart_id" IS NOT NULL)
  );

-- Harakat jurnalida 0 miqdor ma'nosiz — har yozuv qoldiqni o'zgartirishi kerak.
ALTER TABLE "stock_movements"
  ADD CONSTRAINT "stock_movements_quantity_not_zero" CHECK ("quantity" <> 0);
