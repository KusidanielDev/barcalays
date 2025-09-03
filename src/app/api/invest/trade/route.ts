// FILE: src/app/api/invest/trade/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/invest/trade
 * Body: { accountId: string, symbol: string, side: "BUY"|"SELL", qty: number }
 * - Validates ownership & account type
 * - Creates/updates Security, Holding
 * - Debits/credits account balance
 * - Creates InvestOrder (+ marks FILLED)
 * - Records InvestCashTxn
 */
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const accountId: string | undefined = body.accountId;
    const symbolRaw: string | undefined = body.symbol;
    const side: "BUY" | "SELL" | undefined = body.side;
    const qty: number | undefined = Number(body.qty);

    if (!accountId || !symbolRaw || !side || !qty || qty <= 0) {
      return NextResponse.json(
        { error: "Missing or invalid fields." },
        { status: 400 }
      );
    }

    const symbol = String(symbolRaw).toUpperCase().trim();

    // Validate user + account ownership
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        userId: user.id,
        type: "INVESTMENT",
        status: { in: ["OPEN", "PENDING"] },
      },
    });
    if (!account) {
      return NextResponse.json(
        { error: "Investment account not found." },
        { status: 404 }
      );
    }

    // Get or create Security (simple placeholder name/exchange)
    let security = await prisma.security.findUnique({
      where: { symbol },
    });
    if (!security) {
      security = await prisma.security.create({
        data: {
          symbol,
          name: symbol,
          exchange: "XNYS",
          currency: "USD",
          kind: "EQUITY",
        },
      });
    }

    // --- Pricing model (deterministic pseudo price for  ) ---
    // You can wire this to a real quote API later.
    // Price in pence (GBP) for storage; do a simple seeded calc:
    const seed = symbol.split("").reduce((s, c) => s + c.charCodeAt(0), 0);
    const now = new Date();
    const wiggle =
      Math.sin((now.getUTCMinutes() / 60) * Math.PI * 2 + seed) * 0.03; // ±3%
    const baseGBP = symbol === "TSLA" ? 180 : symbol === "AAPL" ? 140 : 100;
    const priceGBP = Math.max(1, baseGBP * (1 + wiggle));
    const pricePence = Math.round(priceGBP * 100);
    const feePence = 100; // flat £1 fee for

    // --- Execute trade atomically ---
    const result = await prisma.$transaction(async (tx) => {
      // Refresh account (balance might change in tx)
      const acc = await tx.account.findUnique({
        where: { id: account.id },
      });
      if (!acc) throw new Error("Account disappeared");

      if (side === "BUY") {
        const cost = pricePence * qty + feePence;
        if (acc.balance < cost) {
          return { ok: false, code: 400, error: "Insufficient funds." };
        }

        // Upsert holding
        const existing = await tx.holding.findUnique({
          where: {
            accountId_securityId: {
              accountId: acc.id,
              securityId: security.id,
            },
          },
        });

        let newQty: number;
        let newAvg: number;
        if (!existing) {
          newQty = qty;
          newAvg = pricePence;
          await tx.holding.create({
            data: {
              accountId: acc.id,
              securityId: security.id,
              quantity: qty,
              avgCostP: pricePence,
            },
          });
        } else {
          const oldQty = Number(existing.quantity);
          const oldAvg = existing.avgCostP;
          newQty = oldQty + qty;
          newAvg = Math.round((oldQty * oldAvg + qty * pricePence) / newQty);

          await tx.holding.update({
            where: { id: existing.id },
            data: { quantity: newQty, avgCostP: newAvg },
          });
        }

        // Cash out
        await tx.account.update({
          where: { id: acc.id },
          data: { balance: { decrement: cost } },
        });

        // Order + cash txn
        const order = await tx.investOrder.create({
          data: {
            accountId: acc.id,
            securityId: security.id,
            side: "BUY",
            orderType: "MARKET",
            quantity: qty,
            limitPence: null,
            status: "FILLED",
            feePence,
            estCostPence: cost,
            placedAt: new Date(),
            filledAt: new Date(),
          },
        });
        await tx.investCashTxn.create({
          data: {
            accountId: acc.id,
            type: "FEE",
            amountPence: feePence,
            note: `Commission for ${symbol} BUY`,
          },
        });

        return { ok: true, orderId: order.id };
      } else {
        // SELL
        const holding = await tx.holding.findUnique({
          where: {
            accountId_securityId: {
              accountId: acc.id,
              securityId: security.id,
            },
          },
        });
        if (!holding || Number(holding.quantity) < qty) {
          return { ok: false, code: 400, error: "Not enough shares to sell." };
        }

        // Update holding
        const remain = Number(holding.quantity) - qty;
        if (remain <= 0) {
          await tx.holding.delete({ where: { id: holding.id } });
        } else {
          await tx.holding.update({
            where: { id: holding.id },
            data: { quantity: remain },
          });
        }

        // Credit cash (proceeds minus fee)
        const proceeds = pricePence * qty - feePence;
        await tx.account.update({
          where: { id: acc.id },
          data: { balance: { increment: proceeds } },
        });

        const order = await tx.investOrder.create({
          data: {
            accountId: acc.id,
            securityId: security.id,
            side: "SELL",
            orderType: "MARKET",
            quantity: qty,
            limitPence: null,
            status: "FILLED",
            feePence,
            estCostPence: -proceeds,
            placedAt: new Date(),
            filledAt: new Date(),
          },
        });
        await tx.investCashTxn.create({
          data: {
            accountId: acc.id,
            type: "FEE",
            amountPence: feePence,
            note: `Commission for ${symbol} SELL`,
          },
        });

        return { ok: true, orderId: order.id };
      }
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: result.code ?? 400 }
      );
    }
    return NextResponse.json({ ok: true, orderId: result.orderId });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Trade error" },
      { status: 500 }
    );
  }
}
