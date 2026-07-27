-- ============================================================================
--  Kelvin — xarid buyurtmasi raqami + summa invarianti (Faza 6, procurement)
-- ============================================================================

CREATE SEQUENCE IF NOT EXISTS purchase_order_number_seq;

ALTER TABLE "purchase_orders"
  ADD CONSTRAINT "purchase_orders_total_non_negative" CHECK ("total_amount" >= 0);

ALTER TABLE "purchase_order_items"
  ADD CONSTRAINT "po_items_qty_ordered_positive" CHECK ("quantity_ordered" > 0),
  ADD CONSTRAINT "po_items_qty_received_non_negative" CHECK ("quantity_received" >= 0),
  ADD CONSTRAINT "po_items_received_lte_ordered" CHECK ("quantity_received" <= "quantity_ordered");
