// FILE: src/app/app/invest/parts/CreateInvestmentNudge.tsx
"use client";

export default function CreateInvestmentNudge() {
  async function create() {
    const res = await fetch("/api/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Investment Account",
        type: "INVESTMENT",
        currency: "GBP",
      }),
    });
    if (res.ok) location.reload();
    else alert("Could not create investment account");
  }

  return (
    <button
      onClick={create}
      className="inline-flex items-center rounded-md border border-gray-300 px-3 py-2 hover:bg-gray-50"
    >
      Create an investment account
    </button>
  );
}
