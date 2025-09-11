// FILE: src/app/admin/page.tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import AdminClient from "./AdminClient";
import {
  updateTransactionStatusAction,
  upsertRecurringIncomeAction,
  toggleRecurringIncomeAction,
  runRecurringIncomeNowAction,
  // NEW actions for OTP control (ensure these exist in ./actions)
  regenerateOtpAction,
  cancelPendingPaymentAction,
} from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  // --- Auth gate (unchanged) ---
  const session = await auth();
  const role = (session?.user as any)?.role;
  if (!session?.user?.email || role !== "ADMIN") redirect("/app");

  // --- Data for AdminClient / editor sections + pending OTP table ---
  const [counts, accounts, users, initialTx, tx, incomes, pending] =
    await Promise.all([
      getKpis(),
      prisma.account.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              approved: true,
              status: true,
            },
          },
        },
        take: 60,
      }),
      prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 60 }),
      prisma.transaction.findMany({
        orderBy: { postedAt: "desc" },
        include: { account: { select: { number: true } } },
        take: 18,
      }),
      prisma.transaction.findMany({
        orderBy: { postedAt: "desc" },
        include: { account: true },
        take: 30,
      }),
      prisma.recurringIncome.findMany({
        orderBy: { nextRunAt: "asc" },
        include: { account: true, user: true },
      }),
      prisma.payment.findMany({
        where: { status: "PENDING_OTP" },
        orderBy: { createdAt: "desc" },
        include: {
          fromAccount: { select: { name: true, number: true } },
          payee: {
            select: { name: true, sortCode: true, accountNumber: true },
          },
          user: { select: { email: true } },
        },
        take: 50,
      }),
    ]);

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-6 py-6 grid gap-10">
      {/* Organized admin console (tabs for KPI/Accounts/Users/Tx) */}
      <AdminClient
        counts={counts}
        initialAccounts={JSON.parse(JSON.stringify(accounts))}
        initialUsers={JSON.parse(JSON.stringify(users))}
        initialTx={JSON.parse(JSON.stringify(initialTx))}
      />

      {/* NEW: Pending OTP payments (clean table, no layout distortion) */}
      <section>
        <h2 className="text-xl font-semibold mb-3">Pending OTP payments</h2>
        <div className="rounded-xl border overflow-x-auto bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left">Created</th>
                <th className="px-3 py-2 text-left">User</th>
                <th className="px-3 py-2 text-left">From account</th>
                <th className="px-3 py-2 text-left">Payee / Vendor</th>
                <th className="px-3 py-2 text-left">Description</th>
                <th className="px-3 py-2 text-left">Method</th>
                <th className="px-3 py-2 text-right">Amount</th>
                <th className="px-3 py-2 text-left">OTP</th>
                <th className="px-3 py-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {pending.map((p) => (
                <tr key={p.id}>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {new Date(p.createdAt).toLocaleString()}
                  </td>
                  <td className="px-3 py-2">{p.user?.email ?? "—"}</td>
                  <td className="px-3 py-2">
                    {p.fromAccount?.name ?? "—"} ·{" "}
                    {p.fromAccount?.number ?? "—"}
                  </td>
                  <td className="px-3 py-2">
                    {p.method === "VENDOR"
                      ? `${p.vendor ?? ""} ${p.vendorHandle ?? ""}`.trim() ||
                        "—"
                      : p.payee?.name ?? "—"}
                  </td>
                  <td className="px-3 py-2">{p.description ?? "Payment"}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide border ${methodBadge(
                        p.method ?? "BANK"
                      )}`}
                    >
                      {p.method ?? "BANK"}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    £{(p.amountPence / 100).toFixed(2)}
                  </td>
                  <td className="px-3 py-2">
                    {p.otpCode ? (
                      <code className="px-1.5 py-0.5 rounded bg-gray-100">
                        {p.otpCode}
                      </code>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <form action={regenerateOtpAction}>
                        <input type="hidden" name="paymentId" value={p.id} />
                        <button className="border px-2 py-1 rounded text-xs">
                          Regenerate
                        </button>
                      </form>
                      <form action={cancelPendingPaymentAction}>
                        <input type="hidden" name="paymentId" value={p.id} />
                        <button className="border px-2 py-1 rounded text-xs">
                          Cancel
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
              {pending.length === 0 && (
                <tr>
                  <td
                    className="px-3 py-6 text-center text-gray-500"
                    colSpan={9}
                  >
                    No pending OTP payments.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Transaction Status Editor (unchanged) */}
      <section>
        <h2 className="text-xl font-semibold mb-3">
          Transactions (edit status)
        </h2>
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {tx.map((t) => (
            <div key={t.id} className="border rounded-xl p-3 bg-white">
              <div className="flex items-center justify-between text-sm">
                <div className="font-medium">
                  {t.account?.name || "Account"} · {t.account?.number || "—"}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(t.postedAt).toLocaleString()}
                </div>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span>{t.description}</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] uppercase border ${badge(
                    t.status as any
                  )}`}
                >
                  {t.status}
                </span>
              </div>
              {(t as any).adminMessage && (
                <div className="text-xs text-red-700 mt-1">
                  {(t as any).adminMessage}
                </div>
              )}
              <div
                className={`mt-1 font-semibold ${
                  t.amount < 0 ? "text-red-600" : "text-green-700"
                }`}
              >
                £{(Math.abs(t.amount) / 100).toFixed(2)}
              </div>
              <div className="text-xs text-gray-600">
                After: £{(t.balanceAfter / 100).toFixed(2)}
              </div>

              <form
                action={updateTransactionStatusAction}
                className="mt-2 grid grid-cols-1 gap-2"
              >
                <input type="hidden" name="txId" value={t.id} />
                <div className="flex items-center gap-2">
                  <select
                    name="status"
                    defaultValue={t.status as any}
                    className="border rounded px-2 py-1 text-xs"
                  >
                    <option>POSTED</option>
                    <option>PENDING</option>
                    <option>ERROR</option>
                    <option>REVERSED</option>
                  </select>
                  <input
                    name="adminMessage"
                    defaultValue={(t as any).adminMessage || ""}
                    placeholder="Admin message"
                    className="flex-1 border rounded px-2 py-1 text-xs"
                  />
                  <button className="border px-2 py-1 rounded text-xs">
                    Save
                  </button>
                </div>
              </form>
            </div>
          ))}
        </div>
      </section>

      {/* Recurring Income (unchanged) */}
      <section>
        <h2 className="text-xl font-semibold mb-3">
          Recurring Income (admin controlled)
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <form
            action={upsertRecurringIncomeAction}
            className="border rounded-xl p-3 bg-white grid gap-3"
          >
            <h3 className="font-medium">Create / Update</h3>
            <input type="hidden" name="id" />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-600">User</label>
                <select
                  name="userId"
                  required
                  className="w-full border rounded px-2 py-1"
                >
                  <option value="">Select</option>
                  {accounts
                    .map((a) => a.user)
                    .map((u) =>
                      u ? (
                        <option key={u.id} value={u.id}>
                          {(u as any).fullName || (u as any).name || u.email}
                        </option>
                      ) : null
                    )}
                  {/* fallback: also list all users (in case some accounts have no user included) */}
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {(u as any).fullName || (u as any).name || u.email}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-600">Account</label>
                <select
                  name="accountId"
                  required
                  className="w-full border rounded px-2 py-1"
                >
                  <option value="">Select</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} · {a.number}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-600">Name</label>
                <input
                  name="name"
                  placeholder="Salary"
                  className="w-full border rounded px-2 py-1"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-gray-600">Amount (pence)</label>
                <input
                  name="amountPence"
                  type="number"
                  min={1}
                  className="w-full border rounded px-2 py-1"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-600">Interval</label>
                <select
                  name="interval"
                  className="w-full border rounded px-2 py-1"
                >
                  <option>MONTHLY</option>
                  <option>WEEKLY</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-600">Next run at</label>
                <input
                  name="nextRunAt"
                  type="datetime-local"
                  className="w-full border rounded px-2 py-1"
                  required
                />
              </div>
            </div>
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" name="active" defaultChecked /> Active
            </label>
            <div>
              <button className="border px-3 py-1 rounded">Save</button>
            </div>
          </form>

          <div className="grid gap-3">
            {incomes.map((r) => (
              <div key={r.id} className="border rounded-xl p-3 bg-white">
                <div className="text-sm font-medium">
                  {r.name} · £{(r.amountPence / 100).toFixed(2)} ({r.interval})
                </div>
                <div className="text-xs text-gray-600">
                  Account: {r.account.name} · {r.account.number}
                </div>
                <div className="text-xs text-gray-600">
                  User:{" "}
                  {(r.user as any).fullName ||
                    (r.user as any).name ||
                    r.user.email}
                </div>
                <div className="text-xs">
                  Next run: {new Date(r.nextRunAt).toLocaleString()}{" "}
                  {r.active ? "• Active" : "• Paused"}
                </div>

                <form
                  action={toggleRecurringIncomeAction}
                  className="mt-2 inline-flex gap-2"
                >
                  <input type="hidden" name="id" value={r.id} />
                  <input
                    type="hidden"
                    name="active"
                    value={(!r.active).toString()}
                  />
                  <button className="border px-2 py-1 rounded text-xs">
                    {r.active ? "Pause" : "Resume"}
                  </button>
                </form>
                <form
                  action={runRecurringIncomeNowAction}
                  className="mt-2 inline-flex gap-2"
                >
                  <input type="hidden" name="id" value={r.id} />
                  <button className="border px-2 py-1 rounded text-xs">
                    Run now
                  </button>
                </form>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

async function getKpis() {
  const [users, accounts, cards, tx7d] = await Promise.all([
    prisma.user.count(),
    prisma.account.count(),
    prisma.card.count(),
    prisma.transaction.count({
      where: {
        postedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    }),
  ]);
  return { users, accounts, cards, tx7d };
}

function badge(s: "ERROR" | "PENDING" | "REVERSED" | "POSTED" | string) {
  switch (s) {
    case "ERROR":
      return "bg-red-50 text-red-700 border-red-200";
    case "PENDING":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "REVERSED":
      return "bg-gray-100 text-gray-700 border-gray-200";
    default:
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }
}

function methodBadge(m: "BANK" | "VENDOR" | string) {
  switch (m) {
    case "VENDOR":
      return "bg-blue-50 text-blue-700 border-blue-200";
    default:
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }
}
