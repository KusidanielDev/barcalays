// FILE: src/app/app/invest/parts/InvestHeader.tsx
"use client";

export default function InvestHeader() {
  return (
    <div className="rounded-2xl border bg-white">
      <div className="px-4 py-3 border-b">
        <div className="flex items-center gap-3 flex-wrap">
          {[
            "My hub",
            "Find investments",
            "News & research",
            "Learn & plan",
            "Accounts & services",
            "Manage account",
            "Help",
          ].map((l) => (
            <div key={l} className="relative group">
              <button className="text-sm px-3 py-1.5 rounded-md hover:bg-gray-50">
                {l}
              </button>
              <div className="invisible group-hover:visible absolute mt-2 w-56 rounded-lg border bg-white shadow-lg z-20">
                {["Overview", "Explore", "Help"].map((x) => (
                  <a
                    key={x}
                    href="#"
                    className="block px-3 py-2 text-sm hover:bg-gray-50"
                  >
                    {x}
                  </a>
                ))}
              </div>
            </div>
          ))}

          <div className="ml-auto relative w-72">
            <input
              placeholder="Search shares, funds, ETFs…"
              className="w-full rounded-full border pl-10 pr-3 py-2 text-sm"
            />
            <svg
              className="absolute left-3 top-2.5 h-5 w-5 text-gray-500"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                cx="11"
                cy="11"
                r="7"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
