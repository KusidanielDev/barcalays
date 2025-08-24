import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const account = await prisma.account.findUnique({ where: { id: params.id } });
  if (!account) return new NextResponse("Not found", { status: 404 });
  const tx = await prisma.transaction.findMany({ where: { accountId: account.id }, orderBy: { postedAt: "desc" }, take: 500 });
  const rows = [["Date","Description","Amount(pence)","BalanceAfter(pence)"]].concat(tx.map(t=>[t.postedAt.toISOString(), t.description, String(t.amount), String(t.balanceAfter)]));
  const csv = rows.map(r=>r.map(x=>`"${String(x).replace(/"/g,'""')}"`).join(",")).join("\n");
  return new NextResponse(csv, { status: 200, headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename=statement-${account.id}.csv` } });
}
