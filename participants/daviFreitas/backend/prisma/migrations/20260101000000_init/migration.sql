-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "status" TEXT NOT NULL,
    "card_last4" TEXT NOT NULL,
    "card_brand" TEXT NOT NULL,
    "holder_name" TEXT NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "installments" INTEGER NOT NULL,
    "installment_amount" INTEGER NOT NULL,
    "total_with_interest" INTEGER NOT NULL,
    "fee_cents" INTEGER NOT NULL,
    "net_amount" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "Transaction_card_last4_created_at_idx" ON "Transaction"("card_last4", "created_at");

-- CreateIndex
CREATE INDEX "Transaction_status_idx" ON "Transaction"("status");
