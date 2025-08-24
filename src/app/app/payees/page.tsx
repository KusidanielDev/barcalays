"use client";
import useSWR from "swr";
import { useState } from "react";
import { Label, Input } from "@/components/Field";

const fetcher = (u:string)=>fetch(u).then(r=>r.json());

export default function PayeesPage() {
  const { data, mutate } = useSWR("/api/payees", fetcher);
  const payees = data?.payees || [];

  const [form, setForm] = useState({ name: "", sortCode: "", accountNumber: "", reference: "" });
  const [err, setErr] = useState<string| null>(null);

  async function addPayee(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const res = await fetch("/api/payees", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(form)});
    const j = await res.json();
    if (!res.ok) { setErr("Could not add payee"); return; }
    setForm({ name: "", sortCode: "", accountNumber: "", reference: "" });
    mutate();
  }

  async function remove(id: string) {
    if (!confirm("Remove payee?")) return;
    await fetch(`/api/payees/${id}`, { method: "DELETE" });
    mutate();
  }

  return (
    <div className="container py-10 grid md:grid-cols-2 gap-8">
      <div>
        <h1 className="text-2xl font-bold text-barclays-navy">Your payees</h1>
        <div className="mt-4 card divide-y">
          {payees.map((p:any)=>(
            <div key={p.id} className="py-3 flex items-center justify-between">
              <div>
                <div className="font-medium">{p.name}</div>
                <div className="text-xs text-gray-600">Sort {p.sortCode} · Acct {p.accountNumber}{p.reference?` · Ref ${p.reference}`:""}</div>
              </div>
              <button onClick={()=>remove(p.id)} className="text-sm underline">Remove</button>
            </div>
          ))}
          {!payees.length && <div className="py-6 text-sm text-gray-600">No payees yet.</div>}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-barclays-navy">Add a new payee</h2>
        <form onSubmit={addPayee} className="card mt-4 space-y-3">
          <div>
            <Label>Name</Label>
            <Input value={form.name} onChange={e=>setForm({...form, name: e.target.value})} required />
          </div>
          <div>
            <Label>Sort code (12-34-56)</Label>
            <Input value={form.sortCode} onChange={e=>setForm({...form, sortCode: e.target.value})} placeholder="12-34-56" pattern="\d{2}-\d{2}-\d{2}" required />
          </div>
          <div>
            <Label>Account number (8 digits)</Label>
            <Input value={form.accountNumber} onChange={e=>setForm({...form, accountNumber: e.target.value})} placeholder="12345678" pattern="\d{8}" required />
          </div>
          <div>
            <Label>Reference (optional)</Label>
            <Input value={form.reference} onChange={e=>setForm({...form, reference: e.target.value})} />
          </div>
          {err && <div className="text-sm text-red-600">{err}</div>}
          <button className="btn-primary">Save payee</button>
        </form>
      </div>
    </div>
  );
}
