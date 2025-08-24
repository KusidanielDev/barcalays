// FILE: src/app/admin/AdminClient.tsx
"use client";

import * as React from "react";
import {
  depositAction,
  withdrawAction,
  deleteAccountAction,
  updateAccountStatusAction,
  setUserRoleAction,
  setUserApprovedAction,
  setUserStatusAction,
  promoteAccountOwnerAction,
} from "./actions";
import { SubmitButton, ConfirmSubmit } from "@/app/admin/components/Buttons";

type KPI = { users: number; accounts: number; cards: number; tx7d: number };
type Account = {
  id: string;
  userId: string;
  name: string;
  type: string;
  number: string;
  sortCode: string;
  balance: number;
  currency: string;
  createdAt: string;
  status?: "PENDING" | "OPEN" | "FROZEN" | "CLOSED";
  user?: {
    id: string;
    name: string | null;
    email: string;
    role?: string;
    approved?: boolean | null;
    status?: string | null;
  };
};
type User = {
  id: string;
  name: string | null;
  email: string;
  role: "USER" | "ADMIN";
  approved: boolean;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
};
type Tx = {
  id: string;
  postedAt: string;
  description: string;
  amount: number;
  balanceAfter: number;
  account?: { number: string };
};

export default function AdminClient({
  counts,
  initialAccounts,
  initialUsers,
  initialTx,
}: {
  counts: KPI;
  initialAccounts: Account[];
  initialUsers: User[];
  initialTx: Tx[];
}) {
  const [tab, setTab] = React.useState<"accounts" | "users" | "tx" | "kpi">(
    "accounts"
  );

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
      <h1 className="text-2xl sm:text-3xl font-semibold mb-4">Admin Console</h1>

      {/* Tabs (scrollable on mobile) */}
      <nav
        className="relative -mx-4 sm:mx-0 overflow-x-auto"
        aria-label="Admin tabs"
      >
        <div className="inline-flex min-w-full sm:min-w-0 gap-1 border-b px-4 sm:px-0">
          <TabButton
            current={tab}
            setTab={setTab}
            id="accounts"
            label="Accounts"
          />
          <TabButton current={tab} setTab={setTab} id="users" label="Users" />
          <TabButton
            current={tab}
            setTab={setTab}
            id="tx"
            label="Transactions"
          />
          <TabButton current={tab} setTab={setTab} id="kpi" label="Overview" />
        </div>
      </nav>

      <div className="mt-6">
        {tab === "kpi" && <KpiPanel counts={counts} />}
        {tab === "accounts" && <AccountsPanel initial={initialAccounts} />}
        {tab === "users" && <UsersPanel initial={initialUsers} />}
        {tab === "tx" && <TxPanel initial={initialTx} />}
      </div>
    </div>
  );
}

/* ---------- Tabs ---------- */
function TabButton({
  current,
  setTab,
  id,
  label,
}: {
  current: string;
  setTab: (t: any) => void;
  id: "kpi" | "accounts" | "users" | "tx";
  label: string;
}) {
  const active = current === id;
  return (
    <button
      role="tab"
      aria-selected={active}
      className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors
        ${
          active
            ? "border-blue-600 text-blue-700"
            : "border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300"
        }`}
      onClick={() => setTab(id)}
    >
      {label}
    </button>
  );
}

/* ---------- Panels ---------- */
function KpiPanel({ counts }: { counts: KPI }) {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard label="Users" value={counts.users} />
      <KpiCard label="Accounts" value={counts.accounts} />
      <KpiCard label="Cards" value={counts.cards} />
      <KpiCard label="Tx (7d)" value={counts.tx7d} />
    </section>
  );
}

function AccountsPanel({ initial }: { initial: Account[] }) {
  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState<
    "ALL" | "PENDING" | "OPEN" | "FROZEN" | "CLOSED"
  >("ALL");
  const [visible, setVisible] = React.useState(12);

  const filtered = React.useMemo(() => {
    const t = q.trim().toLowerCase();
    return initial.filter((a) => {
      const matchText =
        !t ||
        a.number.toLowerCase().includes(t) ||
        a.user?.email.toLowerCase().includes(t) ||
        (a.user?.name ?? "").toLowerCase().includes(t);
      const matchStatus =
        status === "ALL" || (a.status ?? "PENDING") === status;
      return matchText && matchStatus;
    });
  }, [initial, q, status]);

  const slice = filtered.slice(0, visible);
  const canLoadMore = visible < filtered.length;

  return (
    <section className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <input
          type="search"
          placeholder="Search by number, email, or name"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setVisible(12);
          }}
          className="w-full sm:max-w-sm rounded-md border px-3 py-2"
        />
        <div className="flex gap-2">
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as any);
              setVisible(12);
            }}
            className="rounded-md border px-3 py-2 text-sm"
          >
            <option value="ALL">All statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="OPEN">OPEN</option>
            <option value="FROZEN">FROZEN</option>
            <option value="CLOSED">CLOSED</option>
          </select>
          <span className="text-sm self-center text-gray-500">
            {filtered.length} result{filtered.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {slice.map((a) => (
          <AccountCard key={a.id} a={a} />
        ))}
      </div>

      {canLoadMore && (
        <div className="flex justify-center">
          <button
            className="rounded-md border px-4 py-2 text-sm hover:bg-gray-50"
            onClick={() => setVisible((v) => v + 12)}
          >
            Load more
          </button>
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-sm text-gray-600">
          No accounts match your filters.
        </div>
      )}
    </section>
  );
}

function UsersPanel({ initial }: { initial: User[] }) {
  const [q, setQ] = React.useState("");
  const [role, setRole] = React.useState<"ALL" | "USER" | "ADMIN">("ALL");
  const [status, setStatus] = React.useState<
    "ALL" | "PENDING" | "APPROVED" | "REJECTED"
  >("ALL");

  const filtered = React.useMemo(() => {
    const t = q.trim().toLowerCase();
    return initial.filter((u) => {
      const matchText =
        !t ||
        (u.name ?? "").toLowerCase().includes(t) ||
        u.email.toLowerCase().includes(t);
      const matchRole = role === "ALL" || u.role === role;
      const matchStatus = status === "ALL" || u.status === status;
      return matchText && matchRole && matchStatus;
    });
  }, [initial, q, role, status]);

  return (
    <section className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
        <input
          type="search"
          placeholder="Search users by name or email"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full sm:max-w-sm rounded-md border px-3 py-2"
        />
        <div className="flex gap-2">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as any)}
            className="rounded-md border px-3 py-2 text-sm"
          >
            <option value="ALL">All roles</option>
            <option value="USER">USER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="rounded-md border px-3 py-2 text-sm"
          >
            <option value="ALL">All user statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
          <span className="text-sm self-center text-gray-500">
            {filtered.length} result{filtered.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((u) => (
          <UserCard key={u.id} u={u} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-sm text-gray-600">
          No users match your filters.
        </div>
      )}
    </section>
  );
}

function TxPanel({ initial }: { initial: Tx[] }) {
  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
      {initial.map((t) => (
        <div key={t.id} className="rounded-xl border bg-white p-3 text-sm">
          <div className="flex items-center justify-between">
            <div className="font-medium">{t.account?.number}</div>
            <div className="text-xs text-gray-500">
              {new Date(t.postedAt).toLocaleString()}
            </div>
          </div>
          <div className="text-gray-700 mt-1">{t.description}</div>
          <div className="tabular-nums font-semibold mt-1">
            {t.amount >= 0 ? "+" : "−"}
            {formatMoney(Math.abs(t.amount), "GBP")}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            After: {formatMoney(t.balanceAfter, "GBP")}
          </div>
        </div>
      ))}
      {initial.length === 0 && (
        <div className="text-sm text-gray-600">No transactions found.</div>
      )}
    </section>
  );
}

/* ---------- Cards ---------- */
function AccountCard({ a }: { a: Account }) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-medium">{a.number}</div>
          <div className="text-xs text-gray-500">{a.id}</div>
        </div>
        <span className="text-xs text-gray-500">
          {new Date(a.createdAt).toLocaleString()}
        </span>
      </div>

      <div className="text-sm">
        <div className="text-gray-700">
          <span className="font-medium">{a.user?.name ?? "—"}</span>{" "}
          <span className="text-gray-500">({a.user?.email})</span>
        </div>
        <div className="text-gray-600 mt-1">
          Type: <span className="font-medium">{a.type}</span> · Currency:{" "}
          <span className="font-medium">{a.currency}</span>
        </div>
        <div className="mt-1 tabular-nums">
          Balance:{" "}
          <span className="font-semibold">
            {formatMoney(a.balance ?? 0, a.currency ?? "GBP")}
          </span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <form
          action={updateAccountStatusAction}
          className="flex items-center gap-2"
        >
          <input type="hidden" name="accountId" value={a.id} />
          <select
            name="status"
            defaultValue={(a as any).status ?? "PENDING"}
            className="rounded-md border-gray-300 text-sm"
          >
            <option value="PENDING">PENDING</option>
            <option value="OPEN">OPEN</option>
            <option value="FROZEN">FROZEN</option>
            <option value="CLOSED">CLOSED</option>
          </select>
          <SubmitButton>Update</SubmitButton>
        </form>

        <form action={promoteAccountOwnerAction} className="sm:ml-auto">
          <input type="hidden" name="accountId" value={a.id} />
          <SubmitButton className="border-blue-300 text-blue-700 hover:bg-blue-50">
            Promote owner to ADMIN
          </SubmitButton>
        </form>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <form action={depositAction} className="flex items-center gap-2">
          <input type="hidden" name="accountId" value={a.id} />
          <input
            name="amount"
            type="number"
            step="0.01"
            placeholder="Amount"
            className="w-full rounded-md border px-2 py-1"
          />
          <SubmitButton>Deposit</SubmitButton>
        </form>

        <form action={withdrawAction} className="flex items-center gap-2">
          <input type="hidden" name="accountId" value={a.id} />
          <input
            name="amount"
            type="number"
            step="0.01"
            placeholder="Amount"
            className="w-full rounded-md border px-2 py-1"
          />
          <SubmitButton>Withdraw</SubmitButton>
        </form>
      </div>

      <form action={deleteAccountAction} className="pt-1">
        <input type="hidden" name="accountId" value={a.id} />
        <ConfirmSubmit confirmMessage="This will permanently delete the account, cards, and transactions. Continue?">
          Hard delete
        </ConfirmSubmit>
      </form>
    </div>
  );
}

function UserCard({ u }: { u: User }) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-medium">{u.name ?? "—"}</div>
          <div className="text-xs text-gray-500">{u.email}</div>
        </div>
        <div className="text-xs text-gray-500">
          {new Date(u.createdAt).toLocaleDateString()}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <form action={setUserRoleAction} className="flex items-center gap-2">
          <input type="hidden" name="userId" value={u.id} />
          <select
            name="role"
            defaultValue={u.role ?? "USER"}
            className="rounded-md border-gray-300 text-sm"
          >
            <option value="USER">USER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
          <SubmitButton>Set Role</SubmitButton>
        </form>

        <form
          action={setUserApprovedAction}
          className="flex items-center gap-2"
        >
          <input type="hidden" name="userId" value={u.id} />
          <select
            name="approved"
            defaultValue={String(u.approved)}
            className="rounded-md border-gray-300 text-sm"
          >
            <option value="true">Approved: true</option>
            <option value="false">Approved: false</option>
          </select>
          <SubmitButton>Save</SubmitButton>
        </form>

        <form
          action={setUserStatusAction}
          className="flex items-center gap-2 sm:col-span-2"
        >
          <input type="hidden" name="userId" value={u.id} />
          <select
            name="status"
            defaultValue={u.status ?? "APPROVED"}
            className="rounded-md border-gray-300 text-sm"
          >
            <option value="PENDING">PENDING</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
          </select>
          <SubmitButton>Set Status</SubmitButton>
        </form>
      </div>
    </div>
  );
}

/* ---------- UI helpers ---------- */
function KpiCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="text-sm text-gray-600">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  );
}
function formatMoney(pence: number, currency: string) {
  const n = Number(pence ?? 0) / 100;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).format(n);
  } catch {
    return `${currency} ${n.toFixed(2)}`;
  }
}
