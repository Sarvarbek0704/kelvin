-- ============================================================================
--  Kelvin — to'lov/ledger invariantlari (Faza 4)
--
--  docs/08 §6.4: ledger summasi manfiy bo'la olmaydi (manfiy pul — bu
--  qarama-qarshi yozuv, minus emas). Append-only trigger allaqachon
--  20260717000001 da. Bu yerda musbatlik CHECK'lari.
-- ============================================================================

ALTER TABLE "ledger_entries"
  ADD CONSTRAINT "ledger_entries_amount_positive" CHECK ("amount" > 0);

ALTER TABLE "payments"
  ADD CONSTRAINT "payments_amount_positive" CHECK ("amount" > 0);

ALTER TABLE "refunds"
  ADD CONSTRAINT "refunds_amount_positive" CHECK ("amount" > 0);
