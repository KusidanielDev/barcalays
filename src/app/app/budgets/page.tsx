"use client";
import useSWR from "swr";
import { useState } from "react";
const fetcher=(u:string)=>fetch(u).then(r=>r.json());

export default function BudgetsPage(){
  const { data, mutate } = useSWR("/api/budgets", fetcher);
  const budgets = data?.budgets || [];
  const [f, setF] = useState({ name: "Monthly Budget", month: "2025-08", limit: 50000, categories: [{ category: "Food", limit: 20000 }, { category: "Transport", limit: 8000 }] });

  async function create(e: React.FormEvent){
    e.preventDefault();
    await fetch("/api/budgets", { method: "POST", headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ name: f.name, month: f.month, limit: f.limit, items: f.categories }) });
    mutate();
  }

  return (
    <div className="container py-10 grid md:grid-cols-2 gap-8">
      <div>
        <h1 className="text-2xl font-bold text-barclays-navy">Budgets</h1>
        <div className="card mt-4 divide-y">
          {budgets.map((b:any)=>(
            <div key={b.id} className="py-3">
              <div className="font-medium">{b.name} — {b.month}</div>
              <div className="text-xs text-gray-600">Limit £{(b.limit/100).toFixed(2)}</div>
              <ul className="mt-2 text-sm">
                {b.items.map((it:any)=>(<li key={it.id}>{it.category}: £{(it.limit/100).toFixed(2)}</li>))}
              </ul>
            </div>
          ))}
          {!budgets.length && <div className="py-6 text-sm text-gray-600">No budgets yet.</div>}
        </div>
      </div>
      <div>
        <h2 className="text-xl font-semibold text-barclays-navy">Create budget</h2>
        <form onSubmit={create} className="card mt-4 space-y-3">
          <div><label className="block text-sm">Name</label><input className="mt-1 w-full border rounded px-3 py-2" value={f.name} onChange={e=>setF({...f, name: e.target.value})}/></div>
          <div><label className="block text-sm">Month</label><input className="mt-1 w-full border rounded px-3 py-2" value={f.month} onChange={e=>setF({...f, month: e.target.value})}/></div>
          <div><label className="block text-sm">Total limit (pence)</label><input type="number" className="mt-1 w-full border rounded px-3 py-2" value={f.limit} onChange={e=>setF({...f, limit: parseInt(e.target.value||'0')})}/></div>
          <button className="btn-primary">Create</button>
        </form>
      </div>
    </div>
  );
}
