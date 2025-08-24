// FILE: src/app/app/accounts/new/page.tsx
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewAccountPage() {
  const [name, setName] = useState("");
  const [type, setType] = useState("CURRENT");
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, type }),
    });
    if (res.ok) {
      router.push("/app/accounts");
    }
  }

  return (
    <div className="grid gap-6">
      <h1 className="text-xl font-bold text-barclays-navy">
        Open a new account
      </h1>
      <form className="card grid md:grid-cols-2 gap-4" onSubmit={submit}>
        <div>
          <label className="text-sm text-gray-600">Account name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Everyday Current"
            required
          />
        </div>
        <div>
          <label className="text-sm text-gray-600">Type</label>
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="CURRENT">Current</option>
            <option value="SAVINGS">Savings</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <button className="btn-primary">Create account</button>
        </div>
      </form>
    </div>
  );
}
