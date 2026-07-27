-- ============================================================================
--  Kelvin — DB darajasidagi invariantlar
--
--  ⚠️ "Haqiqiy kafolat — constraint, test emas." docs/14-testing-strategy.md §4.3
--
--  1. Append-only (immutable) jadvallar: UPDATE/DELETE DB darajasida bloklanadi.
--     - audit_logs      — ichki o'g'irlik izi o'zgartirilmasin (docs/11 §11)
--     - stock_movements — qoldiq jurnali (docs/03 §3.5)
--     - ledger_entries  — double-entry, append-only (docs/03 §3.6)
--
--  2. Qoldiq manfiy bo'la olmaydi — oversell'ga qarshi so'nggi qatlam
--     (docs/06, docs/14 §4.3). Kod atomik UPDATE ishlatadi, lekin CHECK —
--     kafolat.
-- ============================================================================

-- --- 1. Append-only triggerlar ----------------------------------------------

CREATE OR REPLACE FUNCTION kelvin_forbid_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Jadval "%" append-only (immutable): % operatsiyasi taqiqlanadi',
    TG_TABLE_NAME, TG_OP
    USING ERRCODE = 'restrict_violation';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_logs_immutable
  BEFORE UPDATE OR DELETE ON "audit_logs"
  FOR EACH ROW EXECUTE FUNCTION kelvin_forbid_mutation();

CREATE TRIGGER stock_movements_immutable
  BEFORE UPDATE OR DELETE ON "stock_movements"
  FOR EACH ROW EXECUTE FUNCTION kelvin_forbid_mutation();

CREATE TRIGGER ledger_entries_immutable
  BEFORE UPDATE OR DELETE ON "ledger_entries"
  FOR EACH ROW EXECUTE FUNCTION kelvin_forbid_mutation();

-- --- 2. Qoldiq invariantlari (oversell'ga qarshi) ---------------------------

ALTER TABLE "stock_items"
  ADD CONSTRAINT "stock_items_on_hand_non_negative" CHECK ("on_hand" >= 0),
  ADD CONSTRAINT "stock_items_reserved_non_negative" CHECK ("reserved" >= 0),
  ADD CONSTRAINT "stock_items_reserved_not_over_on_hand" CHECK ("reserved" <= "on_hand");

-- --- 3. Rezerv/miqdor musbatligi --------------------------------------------

ALTER TABLE "stock_reservations"
  ADD CONSTRAINT "stock_reservations_quantity_positive" CHECK ("quantity" > 0);

ALTER TABLE "cart_items"
  ADD CONSTRAINT "cart_items_quantity_positive" CHECK ("quantity" > 0);

ALTER TABLE "order_items"
  ADD CONSTRAINT "order_items_quantity_positive" CHECK ("quantity" > 0);
