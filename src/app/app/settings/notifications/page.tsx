"use client";
import useSWR from "swr";
import { useState, useEffect } from "react";

const fetcher = (u:string)=>fetch(u).then(r=>r.json());

export default function NotificationsPage(){
  const { data, mutate } = useSWR("/api/settings/notifications", fetcher);
  const [form, setForm] = useState({ emailTx: true, smsTx: false, appAlerts: true });
  useEffect(()=>{
    if (data?.pref) setForm({ emailTx: data.pref.emailTx, smsTx: data.pref.smsTx, appAlerts: data.pref.appAlerts });
  },[data]);

  async function save(){
    await fetch("/api/settings/notifications", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(form) });
    mutate();
  }
  return (
    <div>
      <h1 className="text-2xl font-bold text-barclays-navy">Notifications</h1>
      <div className="card mt-4 space-y-3 max-w-lg">
        <label className="flex items-center gap-2"><input type="checkbox" checked={form.emailTx} onChange={e=>setForm({...form, emailTx: e.target.checked})}/> Email me about transactions</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={form.smsTx} onChange={e=>setForm({...form, smsTx: e.target.checked})}/> SMS transaction alerts</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={form.appAlerts} onChange={e=>setForm({...form, appAlerts: e.target.checked})}/> In‑app alerts</label>
        <button onClick={save} className="btn-primary">Save preferences</button>
      </div>
    </div>
  );
}
