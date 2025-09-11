/*
  Warnings:

  - The `status` column on the `Payment` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "TxStatus" AS ENUM ('POSTED', 'PENDING', 'ERROR', 'REVERSED');

-- CreateEnum
CREATE TYPE "PayStatus" AS ENUM ('PENDING_OTP', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "PayMethod" AS ENUM ('BANK', 'INTERNAL', 'VENDOR');

-- CreateEnum
CREATE TYPE "Vendor" AS ENUM ('PAYPAL', 'WISE', 'REVOLUT');

-- CreateEnum
CREATE TYPE "IncomeInterval" AS ENUM ('WEEKLY', 'MONTHLY');

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "method" "PayMethod" NOT NULL DEFAULT 'BANK',
ADD COLUMN     "vendor" "Vendor",
ADD COLUMN     "vendorHandle" TEXT,
DROP COLUMN "status",
ADD COLUMN     "status" "PayStatus" NOT NULL DEFAULT 'PENDING_OTP';

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "adminMessage" TEXT,
ADD COLUMN     "status" "TxStatus" NOT NULL DEFAULT 'POSTED';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "fullName" TEXT;

-- CreateTable
CREATE TABLE "RecurringIncome" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amountPence" INTEGER NOT NULL,
    "interval" "IncomeInterval" NOT NULL DEFAULT 'MONTHLY',
    "nextRunAt" TIMESTAMP(3) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastRunAt" TIMESTAMP(3),

    CONSTRAINT "RecurringIncome_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecurringIncome_accountId_active_nextRunAt_idx" ON "RecurringIncome"("accountId", "active", "nextRunAt");

-- CreateIndex
CREATE INDEX "Payment_userId_createdAt_idx" ON "Payment"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "Transaction_accountId_postedAt_idx" ON "Transaction"("accountId", "postedAt");

-- AddForeignKey
ALTER TABLE "RecurringIncome" ADD CONSTRAINT "RecurringIncome_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringIncome" ADD CONSTRAINT "RecurringIncome_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
