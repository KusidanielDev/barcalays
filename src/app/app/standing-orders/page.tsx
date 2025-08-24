"use client";
import useSWR from "swr";
import { useState } from "react";
import { Label, Input, Select } from "@/components/Field";

const fetcher = (u:string)=>fetch(u).then(r=>r.json());

export default function StandingOrdersPage(){
  const { data, mutate } = useSWR("/api/standing-orders", fetcher);
  const { data: acctData } = useSWR("/api/accounts", fetcher);
  const { data: payeeData } = useSWR("/api/payees", fetcher);
  const accounts = acctData?.accounts || []; const payees = payeeData?.payees || [];
  const orders = data?.orders || [];

  const [form, setForm] = useState({ fromAccountId: "", payeeId: "", amount: "", schedule: "MONTHLY:1", note: "" });

  async function create(e: React.FormEvent){
    e.preventDefault();
    const pence = Math.round(parseFloat(form.amount||"0")*100);
    const res = await fetch("/api/standing-orders", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ fromAccountId: form.fromAccountId, payeeId: form.payeeId, amountPence: pence, schedule: form.schedule, note: form.note }) });
    if (res.ok) { setForm({ fromAccountId: "", payeeId: "", amount: "", schedule: "MONTHLY:1", note: "" }); mutate(); }
  }
  async function toggle(id:string, active:boolean){
    await fetch(`/api/standing-orders/${id}`, { method: "PATCH", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ active }) });
    mutate();
  }
  async function remove(id:string){
    if (!confirm("Delete standing order?")) return;
    await fetch(`/api/standing-orders/${id}`, { method: "DELETE" }); mutate();
  }

  return (
    <div className="container py-10 grid md:grid-cols-2 gap-8">
      <div>
        <h1 className="text-2xl font-bold text-barclays-navy">Standing orders</h1>
        <div className="card mt-4 divide-y">
          {orders.map((o:any)=>(
            <div key={o.id} className="py-3">
              <div className="font-medium">£{(o.amount/100).toFixed(2)} to {o.payee?.name || "—"} — {o.schedule}</div>
              <div className="text-xs text-gray-600">From {o.fromAccount?.name}</div>
              <div className="mt-2 flex gap-3">
                <button className="text-sm underline" onClick={()=>toggle(o.id, !o.active)}>{o.active?"Pause":"Resume"}</button>
                <button className="text-sm underline" onClick={()=>remove(o.id)}>Delete</button>
              </div>
            </div>
          ))}
          {!orders.length && <div className="py-6 text-sm text-gray-600">No standing orders.</div>}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-barclays-navy">New standing order</h2>
        <form onSubmit={create} className="card mt-4 space-y-3">
          <div><Label>From</Label>
            <Select value={form.fromAccountId} onChange={e=>setForm({...form, fromAccountId: e.target.value})} required>
              <option value="">Select</option>
              {accounts.map((a:any)=><option key={a.id} value={a.id}>{a.name} • {a.number}</option>)}
            </Select>
          </div>
          <div><Label>Payee</Label>
            <Select value={form.payeeId} onChange={e=>setForm({...form, payeeId: e.target.value})} required>
              <option value="">Select</option>
              {payees.map((p:any)=><option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
          </div>
          <div><Label>Amount (GBP)</Label><Input type="number" step="0.01" min="0.01" value={form.amount} onChange={e=>setForm({...form, amount: e.target.value})} required/></div>
          <div><Label>Schedule</Label>
            <Select value={form.schedule} onChange={e=>setForm({...form, schedule: e.target.value})}>
              <option value="MONTHLY:1">Monthly on 1st</option>
              <option value="MONTHLY:15">Monthly on 15th</option>
              <option value="WEEKLY:MON">Weekly on Monday</option>
            </Select>
          </div>
          <div><Label>Note</Label><Input value={form.note} onChange={e=>setForm({...form, note: e.target.value})}/></div>
          <button className="btn-primary">Create</button>
        </form>
      </div>
    </div>
  );
}
