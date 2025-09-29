/*
  Warnings:

  - You are about to drop the column `createdBy` on the `Claim` table. All the data in the column will be lost.
  - You are about to drop the column `token` on the `Claim` table. All the data in the column will be lost.
  - Added the required column `userId` to the `Claim` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Claim_createdBy_idx";

-- DropIndex
DROP INDEX "Claim_secretHash_key";

-- AlterTable
ALTER TABLE "Claim" DROP COLUMN "createdBy",
DROP COLUMN "token",
ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Claim_userId_idx" ON "Claim"("userId");

-- CreateIndex
CREATE INDEX "Claim_status_idx" ON "Claim"("status");

-- CreateIndex
CREATE INDEX "Claim_expiry_idx" ON "Claim"("expiry");

-- AddForeignKey
ALTER TABLE "Claim" ADD CONSTRAINT "Claim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
