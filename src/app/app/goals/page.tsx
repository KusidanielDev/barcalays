"use client";
import useSWR from "swr";
import { useState } from "react";
const fetcher=(u:string)=>fetch(u).then(r=>r.json());

export default function GoalsPage(){
  const { data, mutate } = useSWR("/api/goals", fetcher);
  const goals = data?.goals || [];
  const [f, setF] = useState({ name: "Holiday fund", target: 100000, deadline: "" });
  async function create(e: React.FormEvent){ e.preventDefault(); await fetch("/api/goals", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(f) }); mutate(); }
  return (
    <div className="container py-10 grid md:grid-cols-2 gap-8">
      <div>
        <h1 className="text-2xl font-bold text-barclays-navy">Goals</h1>
        <div className="card mt-4 divide-y">
          {goals.map((g:any)=>(
            <div key={g.id} className="py-3">
              <div className="font-medium">{g.name}</div>
              <div className="text-xs text-gray-600">Target £{(g.target/100).toFixed(2)}{g.deadline?` by ${new Date(g.deadline).toLocaleDateString("en-GB")}`:""}</div>
            </div>
          ))}
          {!goals.length && <div className="py-6 text-sm text-gray-600">No goals yet.</div>}
        </div>
      </div>
      <div>
        <h2 className="text-xl font-semibold text-barclays-navy">Create goal</h2>
        <form onSubmit={create} className="card mt-4 space-y-3">
          <div><label className="block text-sm">Name</label><input className="mt-1 w-full border rounded px-3 py-2" value={f.name} onChange={e=>setF({...f, name: e.target.value})}/></div>
          <div><label className="block text-sm">Target (pence)</label><input type="number" className="mt-1 w-full border rounded px-3 py-2" value={f.target} onChange={e=>setF({...f, target: parseInt(e.target.value||'0')})}/></div>
          <div><label className="block text-sm">Deadline</label><input type="date" className="mt-1 w-full border rounded px-3 py-2" value={f.deadline} onChange={e=>setF({...f, deadline: e.target.value})}/></div>
          <button className="btn-primary">Create</button>
        </form>
      </div>
    </div>
  );
}
