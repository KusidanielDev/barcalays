-- CreateTable
CREATE TABLE "Security" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "exchange" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "kind" TEXT NOT NULL DEFAULT 'EQUITY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Security_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricePoint" (
    "id" TEXT NOT NULL,
    "securityId" TEXT NOT NULL,
    "asOf" TIMESTAMP(3) NOT NULL,
    "pricePence" INTEGER NOT NULL,

    CONSTRAINT "PricePoint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Holding" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "securityId" TEXT NOT NULL,
    "quantity" DECIMAL(38,8) NOT NULL,
    "avgCostP" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Holding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestOrder" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "securityId" TEXT NOT NULL,
    "side" TEXT NOT NULL,
    "orderType" TEXT NOT NULL,
    "quantity" DECIMAL(38,8) NOT NULL,
    "limitPence" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "feePence" INTEGER,
    "estCostPence" INTEGER,
    "placedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "filledAt" TIMESTAMP(3),

    CONSTRAINT "InvestOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestCashTxn" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amountPence" INTEGER NOT NULL,
    "postedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,

    CONSTRAINT "InvestCashTxn_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Security_symbol_key" ON "Security"("symbol");

-- CreateIndex
CREATE INDEX "PricePoint_securityId_asOf_idx" ON "PricePoint"("securityId", "asOf");

-- CreateIndex
CREATE UNIQUE INDEX "Holding_accountId_securityId_key" ON "Holding"("accountId", "securityId");

-- CreateIndex
CREATE INDEX "InvestOrder_accountId_placedAt_idx" ON "InvestOrder"("accountId", "placedAt");

-- AddForeignKey
ALTER TABLE "PricePoint" ADD CONSTRAINT "PricePoint_securityId_fkey" FOREIGN KEY ("securityId") REFERENCES "Security"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Holding" ADD CONSTRAINT "Holding_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Holding" ADD CONSTRAINT "Holding_securityId_fkey" FOREIGN KEY ("securityId") REFERENCES "Security"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestOrder" ADD CONSTRAINT "InvestOrder_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestOrder" ADD CONSTRAINT "InvestOrder_securityId_fkey" FOREIGN KEY ("securityId") REFERENCES "Security"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestCashTxn" ADD CONSTRAINT "InvestCashTxn_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;
