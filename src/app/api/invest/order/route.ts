// FILE: src/app/api/invest/order/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { accountId, symbol, side, quantity } = await req.json();
  if (!accountId || !symbol || !side || !quantity) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  const account = await prisma.account.findFirst({
    where: { id: accountId, userId: user!.id },
  });
  if (!account)
    return NextResponse.json({ error: "Account not found" }, { status: 404 });

  // Get a mock price from the quotes endpoint
  const res = await fetch(
    `${
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    }/api/invest/quotes`,
    {
      method: "POST",
      body: JSON.stringify({ symbols: [symbol] }),
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    }
  );
  const { quotes } = await res.json();
  const priceP = quotes?.[0]?.priceP as number;
  if (!priceP)
    return NextResponse.json({ error: "Price unavailable" }, { status: 400 });

  // ensure Security
  let sec = await prisma.security.findUnique({
    where: { symbol: symbol.toUpperCase() },
  });
  if (!sec) {
    sec = await prisma.security.create({
      data: {
        symbol: symbol.toUpperCase(),
        name: symbol.toUpperCase(),
        currency: "GBP",
        kind: "EQUITY",
      },
    });
  }

  const qty = Number(quantity);
  const estCostP = Math.round(priceP * qty);
  const feeP = 600; // £6 commission like Smart Investor share trades (for the feel) :contentReference[oaicite:2]{index=2}
  const totalBuyP = estCostP + feeP;

  // Execute
  const result = await prisma.$transaction(async (tx) => {
    if (side === "BUY") {
      if (account.balance < totalBuyP) throw new Error("Insufficient cash");
      // upsert holding
      const existing = await tx.holding.findFirst({
        where: { accountId: account.id, securityId: sec!.id },
      });
      let newQty = qty,
        newAvg = priceP;
      if (existing) {
        const oldValue = existing.avgCostP * Number(existing.quantity);
        const newValue = priceP * qty;
        newQty = Number(existing.quantity) + qty;
        newAvg = Math.round((oldValue + newValue) / newQty);
        await tx.holding.update({
          where: { id: existing.id },
          data: {
            quantity: newQty.toFixed(8) as unknown as any,
            avgCostP: newAvg,
          },
        });
      } else {
        await tx.holding.create({
          data: {
            accountId: account.id,
            securityId: sec!.id,
            quantity: qty.toFixed(8) as unknown as any,
            avgCostP: priceP,
          },
        });
      }
      await tx.account.update({
        where: { id: account.id },
        data: { balance: account.balance - totalBuyP },
      });
      await tx.investCashTxn.create({
        data: { accountId: account.id, type: "FEE", amountPence: -feeP },
      });
      await tx.investOrder.create({
        data: {
          accountId: account.id,
          securityId: sec!.id,
          side: "BUY",
          orderType: "MARKET",
          quantity: qty.toFixed(8) as unknown as any,
          estCostPence: totalBuyP,
          feePence: feeP,
          status: "FILLED",
          filledAt: new Date(),
        },
      });
    } else if (side === "SELL") {
      const existing = await tx.holding.findFirst({
        where: { accountId: account.id, securityId: sec!.id },
      });
      if (!existing || Number(existing.quantity) < qty)
        throw new Error("Not enough shares");
      const remain = Number(existing.quantity) - qty;
      if (remain <= 0) {
        await tx.holding.delete({ where: { id: existing.id } });
      } else {
        await tx.holding.update({
          where: { id: existing.id },
          data: { quantity: remain.toFixed(8) as unknown as any },
        });
      }
      const proceeds = estCostP - feeP;
      await tx.account.update({
        where: { id: account.id },
        data: { balance: account.balance + proceeds },
      });
      await tx.investCashTxn.create({
        data: { accountId: account.id, type: "FEE", amountPence: -feeP },
      });
      await tx.investOrder.create({
        data: {
          accountId: account.id,
          securityId: sec!.id,
          side: "SELL",
          orderType: "MARKET",
          quantity: qty.toFixed(8) as unknown as any,
          estCostPence: proceeds,
          feePence: feeP,
          status: "FILLED",
          filledAt: new Date(),
        },
      });
    }
    return true;
  });

  return NextResponse.json({ ok: true });
}
