"use client";
import useSWR from "swr";
import { useState } from "react";
const fetcher=(u:string)=>fetch(u).then(r=>r.json());

export default function SupportPage(){
  const { data, mutate } = useSWR("/api/support/threads", fetcher);
  const threads = data?.threads || [];
  const [subject, setSubject] = useState(""); const [body, setBody] = useState("");

  async function create(e: React.FormEvent){
    e.preventDefault();
    await fetch("/api/support/threads", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ subject, body }) });
    setSubject(""); setBody(""); mutate();
  }
  async function reply(id:string, text:string){
    await fetch(`/api/support/threads/${id}/message`, { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ body: text }) });
    mutate();
  }

  return (
    <div className="container py-10 grid md:grid-cols-2 gap-8">
      <div>
        <h1 className="text-2xl font-bold text-barclays-navy">Support</h1>
        <div className="card mt-4 divide-y">
          {threads.map((t:any)=>(
            <div key={t.id} className="py-3">
              <div className="font-medium">{t.subject}</div>
              <div className="text-xs text-gray-600">Messages: {t.messages.length}</div>
              <details className="mt-2">
                <summary className="cursor-pointer text-sm underline">Open thread</summary>
                <ul className="mt-2 space-y-1 text-sm">
                  {t.messages.map((m:any)=>(<li key={m.id}><strong>{m.author}</strong>: {m.body}</li>))}
                </ul>
                <form onSubmit={(e)=>{e.preventDefault(); const v=(e.target as any).msg.value; (e.target as any).msg.value=""; reply(t.id, v);}} className="mt-2 flex gap-2">
                  <input name="msg" className="border rounded px-2 py-1 flex-1" placeholder="Reply..." />
                  <button className="btn-secondary">Send</button>
                </form>
              </details>
            </div>
          ))}
          {!threads.length && <div className="py-6 text-sm text-gray-600">No support threads yet.</div>}
        </div>
      </div>
      <div>
        <h2 className="text-xl font-semibold text-barclays-navy">New request</h2>
        <form onSubmit={create} className="card mt-4 space-y-3">
          <div><label className="block text-sm">Subject</label><input value={subject} onChange={e=>setSubject(e.target.value)} className="mt-1 w-full border rounded px-3 py-2" /></div>
          <div><label className="block text-sm">Message</label><textarea value={body} onChange={e=>setBody(e.target.value)} className="mt-1 w-full border rounded px-3 py-2 h-32" /></div>
          <button className="btn-primary">Create</button>
        </form>
      </div>
    </div>
  );
}
