-- CreateTable
CREATE TABLE "pos_transactions" (
    "id" UUID NOT NULL,
    "shift_id" UUID NOT NULL,
    "number" TEXT NOT NULL,
    "payment_method" TEXT NOT NULL,
    "total_amount" BIGINT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'UZS',
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "warehouse_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pos_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pos_transaction_items" (
    "id" UUID NOT NULL,
    "transaction_id" UUID NOT NULL,
    "variant_id" UUID NOT NULL,
    "sku" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_amount" BIGINT NOT NULL,
    "total_amount" BIGINT NOT NULL,

    CONSTRAINT "pos_transaction_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_segments" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" JSONB NOT NULL,
    "description" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'MANUAL',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "customer_segments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_segment_members" (
    "id" UUID NOT NULL,
    "segment_id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "rfm_score" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_segment_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "banners" (
    "id" UUID NOT NULL,
    "title" JSONB NOT NULL,
    "image_url" TEXT NOT NULL,
    "link_url" TEXT,
    "position" TEXT NOT NULL DEFAULT 'HOME_HERO',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "banners_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "pos_transactions_number_key" ON "pos_transactions"("number");

-- CreateIndex
CREATE INDEX "pos_transactions_shift_id_idx" ON "pos_transactions"("shift_id");

-- CreateIndex
CREATE INDEX "pos_transaction_items_transaction_id_idx" ON "pos_transaction_items"("transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "customer_segments_code_key" ON "customer_segments"("code");

-- CreateIndex
CREATE INDEX "customer_segment_members_customer_id_idx" ON "customer_segment_members"("customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "customer_segment_members_segment_id_customer_id_key" ON "customer_segment_members"("segment_id", "customer_id");

-- CreateIndex
CREATE INDEX "banners_position_is_active_idx" ON "banners"("position", "is_active");

-- AddForeignKey
ALTER TABLE "pos_transactions" ADD CONSTRAINT "pos_transactions_shift_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "pos_shifts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pos_transaction_items" ADD CONSTRAINT "pos_transaction_items_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "pos_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_segment_members" ADD CONSTRAINT "customer_segment_members_segment_id_fkey" FOREIGN KEY ("segment_id") REFERENCES "customer_segments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
