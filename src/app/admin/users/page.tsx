"use client";
import useSWR from "swr";
import { useState } from "react";

const fetcher=(u:string)=>fetch(u).then(r=>r.json());

export default function AdminUsersPage(){
  const [q, setQ] = useState("");
  const { data, mutate } = useSWR("/api/admin/users/search?q="+encodeURIComponent(q), fetcher);
  const users = data?.users || [];

  async function reset(id:string){
    await fetch("/api/admin/users/reset-password", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ userId: id }) });
    mutate();
  }

  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold text-barclays-navy">Users</h1>
      <input className="mt-4 w-full max-w-md rounded border px-3 py-2" placeholder="Search by email or name" value={q} onChange={e=>setQ(e.target.value)} />
      <div className="grid mt-4 gap-2">
        {users.map((u:any)=>(
          <div key={u.id} className="card flex items-center justify-between">
            <div>
              <div className="font-medium">{u.name}</div>
              <div className="text-sm text-gray-600">{u.email}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={()=>reset(u.id)} className="btn-secondary">Reset password</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
