-- CreateEnum
CREATE TYPE "Status" AS ENUM ('CREATED', 'CLAIMED', 'RECLAIMED');

-- CreateTable
CREATE TABLE "Claim" (
    "id" TEXT NOT NULL,
    "claimId" INTEGER,
    "claimCode" TEXT NOT NULL,
    "payerAddress" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "amount" TEXT NOT NULL,
    "expiry" TIMESTAMP(3) NOT NULL,
    "recipient" TEXT,
    "secretHash" TEXT,
    "status" "Status" NOT NULL DEFAULT 'CREATED',
    "txHashCreate" TEXT,
    "txHashClaim" TEXT,
    "txHashReclaim" TEXT,
    "createdBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Claim_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Claim_claimId_key" ON "Claim"("claimId");

-- CreateIndex
CREATE UNIQUE INDEX "Claim_claimCode_key" ON "Claim"("claimCode");

-- CreateIndex
CREATE UNIQUE INDEX "Claim_secretHash_key" ON "Claim"("secretHash");

-- CreateIndex
CREATE INDEX "Claim_createdBy_idx" ON "Claim"("createdBy");
