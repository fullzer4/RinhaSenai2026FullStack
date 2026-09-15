-- Etapa 7: idempotencia + indice otimizado para o limite diario.
--
-- OBS: o DEFAULT '' abaixo so existe para o ALTER TABLE nao quebrar caso ja
-- exista alguma linha na tabela; em um banco novo (o caso normal do
-- benchmark, que sempre roda a partir de um data.db limpo) a tabela estara
-- vazia e isso nao tem efeito pratico.

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN "idempotency_key" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_idempotency_key_key" ON "Transaction"("idempotency_key");

-- DropIndex (substituido pelo indice composto abaixo, que ja cobre o
-- filtro de limite diario: card_last4 + status='approved' + created_at)
DROP INDEX "Transaction_card_last4_created_at_idx";

-- CreateIndex
CREATE INDEX "Transaction_card_last4_status_created_at_idx" ON "Transaction"("card_last4", "status", "created_at");
