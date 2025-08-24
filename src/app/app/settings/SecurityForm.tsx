// FILE: src/app/app/settings/SecurityForm.tsx
"use client";

import { useState } from "react";

type Props = { action: (formData: FormData) => Promise<void> };

export default function SecurityForm({ action }: Props) {
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const fd = new FormData(e.currentTarget);
    try {
      await action(fd);
      (e.target as HTMLFormElement).reset();
      setMsg("Password updated.");
    } catch (err: any) {
      setMsg(err?.message || "Couldn’t update password.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid md:grid-cols-3 gap-4 mt-4">
      <div>
        <label className="block text-sm text-gray-600">Current password</label>
        <input
          name="current"
          type="password"
          className="w-full rounded border px-3 py-2"
          required
        />
      </div>
      <div>
        <label className="block text-sm text-gray-600">New password</label>
        <input
          name="pwd1"
          type="password"
          className="w-full rounded border px-3 py-2"
          minLength={8}
          required
        />
      </div>
      <div>
        <label className="block text-sm text-gray-600">
          Confirm new password
        </label>
        <input
          name="pwd2"
          type="password"
          className="w-full rounded border px-3 py-2"
          minLength={8}
          required
        />
      </div>
      <div className="md:col-span-3 flex items-center gap-3">
        <button disabled={saving} className="btn-secondary">
          {saving ? "Updating..." : "Update password"}
        </button>
        {msg && <span className="text-sm">{msg}</span>}
      </div>
    </form>
  );
}
