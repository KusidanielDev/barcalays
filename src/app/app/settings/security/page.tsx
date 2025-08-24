"use client";
import { useState } from "react";
import { Label, Input } from "@/components/Field";
import { useToast } from "@/hooks/useToast";

export default function SecurityPage(){
  const [curr, setCurr] = useState(""); const [pwd, setPwd] = useState(""); const [pwd2, setPwd2] = useState("");
  const { push } = useToast();

  async function submit(e: React.FormEvent){
    e.preventDefault();
    if (pwd !== pwd2) { push({ message: "Passwords do not match", type: "error" }); return; }
    const res = await fetch("/api/settings/security/change-password", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ currentPassword: curr, newPassword: pwd }) });
    if (res.ok) push({ message: "Password updated", type: "success" });
    else push({ message: "Update failed", type: "error" });
    setCurr(""); setPwd(""); setPwd2("");
  }
  return (
    <div>
      <h1 className="text-2xl font-bold text-barclays-navy">Security</h1>
      <form onSubmit={submit} className="card mt-4 space-y-3 max-w-lg">
        <div><Label>Current password</Label><Input type="password" value={curr} onChange={e=>setCurr(e.target.value)} required/></div>
        <div><Label>New password</Label><Input type="password" value={pwd} onChange={e=>setPwd(e.target.value)} required/></div>
        <div><Label>Confirm new password</Label><Input type="password" value={pwd2} onChange={e=>setPwd2(e.target.value)} required/></div>
        <button className="btn-primary">Change password</button>
      </form>
    </div>
  );
}
