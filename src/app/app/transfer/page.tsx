"use client";
import useSWR from "swr";
import { useState } from "react";

const fetcher = (url: string) => fetch(url).then(r=>r.json());

export default function TransferPage() {
  const { data } = useSWR("/api/accounts", fetcher);
  const accounts = data?.accounts || [];
  const [fromId, setFromId] = useState<string>("");
  const [toId, setToId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [desc, setDesc] = useState<string>("");
  const [msg, setMsg] = useState<string>("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    const pence = Math.round(parseFloat(amount || "0") * 100);
    const res = await fetch("/api/transfer", { method: "POST", headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ fromAccountId: fromId, toAccountId: toId, amountPence: pence, description: desc }) });
    const j = await res.json();
    if (res.ok) setMsg("Transfer complete.");
    else setMsg(j.error || "Transfer failed.");
  }

  return (
    <div className="container py-10 max-w-xl">
      <h1 className="text-2xl font-bold text-barclays-navy">Make a transfer</h1>
      <form onSubmit={submit} className="card mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium">From</label>
          <select className="mt-1 w-full rounded border px-3 py-2" value={fromId} onChange={e=>setFromId(e.target.value)} required>
            <option value="">Select account</option>
            {accounts.map((a:any)=> <option key={a.id} value={a.id}>{a.name} • {a.number}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">To</label>
          <select className="mt-1 w-full rounded border px-3 py-2" value={toId} onChange={e=>setToId(e.target.value)} required>
            <option value="">Select account</option>
            {accounts.map((a:any)=> <option key={a.id} value={a.id}>{a.name} • {a.number}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Amount (GBP)</label>
          <input className="mt-1 w-full rounded border px-3 py-2" type="number" step="0.01" min="0.01" value={amount} onChange={e=>setAmount(e.target.value)} required />
        </div>
        <div>
          <label className="block text-sm font-medium">Description (optional)</label>
          <input className="mt-1 w-full rounded border px-3 py-2" value={desc} onChange={e=>setDesc(e.target.value)} />
        </div>
        <button className="btn-primary">Send</button>
        {msg && <div className="text-sm">{msg}</div>}
      </form>
    </div>
  );
}
