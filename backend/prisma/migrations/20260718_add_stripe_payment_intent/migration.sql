-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "stripe_payment_intent_id" VARCHAR(255);

-- CreateIndex
CREATE UNIQUE INDEX "payments_stripe_payment_intent_id_key" ON "payments"("stripe_payment_intent_id");

