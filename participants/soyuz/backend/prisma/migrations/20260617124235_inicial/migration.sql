-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL,
    "card_last4" TEXT NOT NULL,
    "card_brand" TEXT NOT NULL,
    "holder_name" TEXT NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "installments" INTEGER NOT NULL DEFAULT 1,
    "installment_amount" INTEGER NOT NULL,
    "total_with_interest" INTEGER NOT NULL,
    "fee_cents" INTEGER NOT NULL,
    "net_amount" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiration" TEXT NOT NULL,
    "refundedAt" DATETIME,
    "idempotencyKey" TEXT
);

-- CreateIndex
CREATE UNIQUE INDEX "transactions_idempotencyKey_key" ON "transactions"("idempotencyKey");

-- CreateIndex
CREATE INDEX "transactions_status_idx" ON "transactions"("status");

-- CreateIndex
CREATE INDEX "transactions_card_last4_idx" ON "transactions"("card_last4");

-- CreateIndex
CREATE INDEX "transactions_created_at_idx" ON "transactions"("created_at");
