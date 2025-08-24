import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";

function formatGBPFromPence(pence: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format((pence || 0) / 100);
}

export default async function ReceiptPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session?.user?.email) {
    redirect(
      `/login?callbackUrl=${encodeURIComponent("/app/receipt/" + params.id)}`
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
  });
  if (!user) redirect("/login");

  const p = await prisma.payment.findUnique({
    where: { id: params.id },
    include: {
      payee: true,
      fromAccount: true,
    },
  });

  if (!p) notFound();
  // Ensure the viewer owns the account/payment
  if (p.fromAccount.userId !== user.id) {
    redirect("/app");
  }

  const title =
    p.status === "COMPLETED"
      ? "Payment complete"
      : p.status === "PENDING_OTP"
      ? "Payment pending"
      : "Payment";

  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold text-barclays-navy">{title}</h1>

      <div className="card mt-4 space-y-2">
        <div className="flex justify-between">
          <div>Amount</div>
          <div className="font-semibold">
            {formatGBPFromPence(p.amountPence)}
          </div>
        </div>

        <div className="flex justify-between">
          <div>From</div>
          <div>{p.fromAccount.name}</div>
        </div>

        {p.isExternal && p.payee ? (
          <div className="flex justify-between">
            <div>To</div>
            <div>
              {p.payee.name} · {p.payee.sortCode} · {p.payee.accountNumber}
            </div>
          </div>
        ) : null}

        {p.description ? (
          <div className="flex justify-between">
            <div>Description</div>
            <div>{p.description}</div>
          </div>
        ) : null}

        <div className="flex justify-between">
          <div>Status</div>
          <div>{p.status}</div>
        </div>

        <div className="flex justify-between">
          <div>Reference</div>
          <div className="text-gray-600">{p.id}</div>
        </div>

        <div className="flex justify-between">
          <div>Created</div>
          <div>{new Date(p.createdAt).toLocaleString("en-GB")}</div>
        </div>
      </div>

      <div className="mt-6">
        <a href="/app" className="btn-secondary">
          Back to dashboard
        </a>
      </div>
    </div>
  );
}
