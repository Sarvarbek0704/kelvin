-- ============================================================================
--  Kelvin — yetkazib berish slot invariantlari (Faza 7)
--
--  ⚠️ Slot bron — inventory oversell BILAN BIR XIL race (docs/07 §8): cheklangan
--     resursni parallel so'rovlar orasida taqsimlash. Yechim ham bir xil:
--     atomik shartli UPDATE. CHECK — so'nggi himoya (over-booking bo'lmasin).
-- ============================================================================

ALTER TABLE "delivery_slots"
  ADD CONSTRAINT "delivery_slots_capacity_positive" CHECK ("capacity" > 0),
  ADD CONSTRAINT "delivery_slots_booked_non_negative" CHECK ("booked" >= 0),
  ADD CONSTRAINT "delivery_slots_booked_lte_capacity" CHECK ("booked" <= "capacity");

ALTER TABLE "delivery_zones"
  ADD CONSTRAINT "delivery_zones_price_non_negative" CHECK ("price_amount" >= 0);
