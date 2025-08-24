// FILE: src/app/app/settings/ProfileForm.tsx
"use client";

import { useState } from "react";

type Props = {
  user: {
    id: string;
    name: string | null;
    email: string;
    phone: string | null;
  };
  action: (formData: FormData) => Promise<void>;
};

export default function ProfileForm({ user, action }: Props) {
  const [name, setName] = useState(user.name || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState<null | "ok" | "err">(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setOk(null);
    try {
      const fd = new FormData(e.currentTarget);
      await action(fd);
      setOk("ok");
    } catch {
      setOk("err");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid md:grid-cols-2 gap-4 mt-4">
      <div>
        <label className="block text-sm text-gray-600">Full name</label>
        <input
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded border px-3 py-2"
          placeholder="Your name"
        />
      </div>
      <div>
        <label className="block text-sm text-gray-600">Phone</label>
        <input
          name="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full rounded border px-3 py-2"
          placeholder="+44 07..."
        />
      </div>
      <div className="md:col-span-2">
        <label className="block text-sm text-gray-600">Email (read-only)</label>
        <input
          value={user.email}
          disabled
          className="w-full rounded border px-3 py-2 bg-gray-50"
        />
      </div>
      <div className="md:col-span-2 flex items-center gap-3">
        <button disabled={saving} className="btn-secondary">
          {saving ? "Saving..." : "Save changes"}
        </button>
        {ok === "ok" && <span className="text-green-600 text-sm">Saved</span>}
        {ok === "err" && (
          <span className="text-red-600 text-sm">Couldn’t save</span>
        )}
      </div>
    </form>
  );
}
