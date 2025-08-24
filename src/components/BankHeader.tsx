// FILE: src/components/BankHeader.tsx
"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

// Inline icons
const IconPhone = () => (
  <svg
    viewBox="0 0 24 24"
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <path d="M2 4.5C2 3.67 2.67 3 3.5 3h3A1.5 1.5 0 0 1 8 4.5v3A1.5 1.5 0 0 1 6.5 9H6c.5 2.5 2.5 4.5 5 5v-.5A1.5 1.5 0 0 1 12.5 12h3A1.5 1.5 0 0 1 17 13.5v3A1.5 1.5 0 0 1 15.5 18h-1A12.5 12.5 0 0 1 2 5.5v-1Z" />
  </svg>
);
const IconPin = () => (
  <svg
    viewBox="0 0 24 24"
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <path d="M12 21s7-4.87 7-11a7 7 0 1 0-14 0c0 6.13 7 11 7 11Z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
);
const IconSearch = () => (
  <svg
    viewBox="0 0 24 24"
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20L17 17" />
  </svg>
);
const IconChevron = ({ open }: { open?: boolean }) => (
  <svg
    viewBox="0 0 24 24"
    className={`w-4 h-4 transition-transform ${
      open ? "rotate-90" : "rotate-0"
    }`}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <path d="M8 5l8 7-8 7" />
  </svg>
);
const IconMenu = () => (
  <svg
    viewBox="0 0 24 24"
    className="w-6 h-6"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

// Mega menu data (unchanged)
export type Column = {
  title: string;
  items: { label: string; href: string }[];
};
export type Mega = { name: string; columns: Column[] };

const megaData: Mega[] = [
  {
    name: "Accounts",
    columns: [
      {
        title: "Accounts",
        items: [
          { label: "Compare current accounts", href: "#" },
          { label: "Barclays Bank Account", href: "#" },
          { label: "Premier Current Account", href: "#" },
          { label: "Joint bank account", href: "#" },
          { label: "Student bank account", href: "#" },
          { label: "Young person's account (16-17)", href: "#" },
          { label: "Children's bank account (11-15)", href: "#" },
        ],
      },
      {
        title: "Rewards",
        items: [
          { label: "Barclays Avios Rewards", href: "#" },
          { label: "Barclays Bank Account + Blue Rewards", href: "#" },
        ],
      },
      {
        title: "Tools and services",
        items: [
          { label: "Switch to Barclays", href: "#" },
          { label: "Barclays app", href: "#" },
          { label: "Debit cards & contactless", href: "#" },
          { label: "Overdrafts", href: "#" },
        ],
      },
      {
        title: "Help",
        items: [
          { label: "Current account FAQs", href: "#" },
          { label: "Lost, stolen or damaged card", href: "#" },
        ],
      },
    ],
  },
  {
    name: "Mortgages",
    columns: [
      {
        title: "Mortgages",
        items: [
          { label: "Find a mortgage", href: "#" },
          { label: "Remortgage", href: "#" },
          { label: "First-time buyer", href: "#" },
          { label: "Buy-to-let", href: "#" },
        ],
      },
      {
        title: "Calculators",
        items: [
          { label: "Affordability calculator", href: "#" },
          { label: "Monthly repayments", href: "#" },
        ],
      },
      {
        title: "Manage",
        items: [
          { label: "Switch rate", href: "#" },
          { label: "Overpayments", href: "#" },
        ],
      },
      {
        title: "Support",
        items: [
          { label: "Mortgage support hub", href: "#" },
          { label: "FAQs", href: "#" },
        ],
      },
    ],
  },
  {
    name: "Loans",
    columns: [
      {
        title: "Loans",
        items: [
          { label: "Personal loans", href: "#" },
          { label: "Car loans", href: "#" },
          { label: "Debt consolidation", href: "#" },
        ],
      },
      {
        title: "Rates",
        items: [
          { label: "Representative APR", href: "#" },
          { label: "Eligibility", href: "#" },
        ],
      },
      { title: "Tools", items: [{ label: "Loan calculator", href: "#" }] },
      { title: "Help", items: [{ label: "Loan FAQs", href: "#" }] },
    ],
  },
  {
    name: "Credit cards",
    columns: [
      {
        title: "Cards",
        items: [
          { label: "All credit cards", href: "#" },
          { label: "Balance transfer", href: "#" },
          { label: "Rewards", href: "#" },
        ],
      },
      {
        title: "Guides",
        items: [
          { label: "Choosing a card", href: "#" },
          { label: "Credit score tips", href: "#" },
        ],
      },
      {
        title: "Manage",
        items: [
          { label: "Activate card", href: "#" },
          { label: "Increase limit", href: "#" },
        ],
      },
      { title: "Support", items: [{ label: "Card help", href: "#" }] },
    ],
  },
  {
    name: "Savings",
    columns: [
      {
        title: "Accounts",
        items: [
          { label: "Easy-access savings", href: "#" },
          { label: "Fixed-term", href: "#" },
          { label: "ISAs", href: "#" },
        ],
      },
      {
        title: "For young people",
        items: [
          { label: "Children's savings", href: "#" },
          { label: "Young savers (16-17)", href: "#" },
        ],
      },
      {
        title: "Tools",
        items: [
          { label: "Savings goals", href: "#" },
          { label: "Regular saving", href: "#" },
        ],
      },
      { title: "Help", items: [{ label: "Savings FAQs", href: "#" }] },
    ],
  },
  {
    name: "Investments",
    columns: [
      {
        title: "Investing",
        items: [
          { label: "Start investing", href: "#" },
          { label: "Funds & shares", href: "#" },
        ],
      },
      {
        title: "Accounts",
        items: [
          { label: "Investment ISA", href: "#" },
          { label: "General Investment", href: "#" },
        ],
      },
      { title: "Learn", items: [{ label: "Guides & insights", href: "#" }] },
      { title: "Support", items: [{ label: "Investment help", href: "#" }] },
    ],
  },
  {
    name: "Insurance",
    columns: [
      {
        title: "Cover",
        items: [
          { label: "Travel insurance", href: "#" },
          { label: "Tech insurance", href: "#" },
          { label: "Life insurance", href: "#" },
        ],
      },
      {
        title: "Claims",
        items: [
          { label: "Make a claim", href: "#" },
          { label: "Track a claim", href: "#" },
        ],
      },
      { title: "Guides", items: [{ label: "What we cover", href: "#" }] },
      { title: "Support", items: [{ label: "Insurance FAQs", href: "#" }] },
    ],
  },
  {
    name: "Ways to bank",
    columns: [
      {
        title: "Mobile & online",
        items: [
          { label: "Barclays app", href: "#" },
          { label: "Online banking", href: "#" },
        ],
      },
      {
        title: "In branch",
        items: [
          { label: "Find a branch", href: "#" },
          { label: "Cash machines", href: "#" },
        ],
      },
      {
        title: "Cards & payments",
        items: [
          { label: "Contactless", href: "#" },
          { label: "Apple/Google Pay", href: "#" },
        ],
      },
      { title: "Security", items: [{ label: "Protect yourself", href: "#" }] },
    ],
  },
  {
    name: "Help & support",
    columns: [
      {
        title: "Popular help",
        items: [
          { label: "Report fraud", href: "#" },
          { label: "Card lost or stolen", href: "#" },
        ],
      },
      {
        title: "Guides",
        items: [
          { label: "Money worries", href: "#" },
          { label: "Accessibility", href: "#" },
        ],
      },
      {
        title: "Contact",
        items: [
          { label: "Contact us", href: "#" },
          { label: "Feedback", href: "#" },
        ],
      },
      {
        title: "Service status",
        items: [{ label: "Service updates", href: "#" }],
      },
    ],
  },
];

function useOutsideClose<T extends HTMLElement>(
  open: boolean,
  onClose: () => void
) {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (open && ref.current && !ref.current.contains(e.target as Node))
        onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose]);
  return ref;
}

export default function BankHeader() {
  const [personalOpen, setPersonalOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const personalRef = useOutsideClose<HTMLDivElement>(personalOpen, () =>
    setPersonalOpen(false)
  );

  const names = megaData.map((m) => m.name);
  const activeMega = megaData.find((m) => m.name === active) || null;

  // NEW: close mobile menu after clicking a link
  const closeMobile = () => setMobileOpen(false);

  return (
    <header className="w-full bg-white border-b border-gray-200">
      {/* Top bar */}
      <div className="container py-6 md:py-10">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 md:gap-6">
            {/* LOGO + Name (name visible on mobile, safely truncated) */}
            <a href="/" className="flex items-center gap-2 min-w-0">
              <Image
                src="/images/logo.png"
                alt="Barclays"
                width={140}
                height={36}
                className="h-9 w-auto"
              />
              <span className="text-lg md:text-xl font-semibold text-barclays-navy truncate max-w-[40vw] md:max-w-none">
                Barclays
              </span>
            </a>

            {/* PERSONAL dropdown */}
            <div className="relative hidden md:block" ref={personalRef}>
              <button
                onClick={() => setPersonalOpen((v) => !v)}
                className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm md:text-base"
              >
                Personal <IconChevron open={personalOpen} />
              </button>
              {personalOpen && (
                <div className="absolute z-40 mt-2 w-56 rounded-xl border bg-white shadow-lg p-2">
                  {[
                    "Premier",
                    "Business",
                    "Wealth Management",
                    "Corporate",
                    "Private Bank",
                    "International banking",
                  ].map((x) => (
                    <a
                      key={x}
                      href="#"
                      className="block px-3 py-2 rounded-lg hover:bg-gray-50"
                    >
                      {x}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right utilities (desktop) */}
          <div className="hidden md:flex items-center gap-4 text-sm">
            <a
              href="#"
              className="inline-flex items-center gap-2 hover:underline"
            >
              <IconPhone /> Contact us
            </a>
            <a
              href="#"
              className="inline-flex items-center gap-2 hover:underline"
            >
              <IconPin /> Find Barclays
            </a>
            <a
              href="#"
              className="inline-flex items-center gap-2 hover:underline"
            >
              <IconSearch /> Search
            </a>
            <a href="/login" className="btn-secondary">
              Log in
            </a>
          </div>

          {/* Mobile actions */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setMobileOpen((o) => !o)}
              className="btn-secondary"
              aria-label="Open menu"
            >
              <IconMenu />
            </button>
          </div>
        </div>

        {/* Categories row (desktop) */}
        <nav className="mt-6 md:mt-10 hidden md:block">
          <ul className="flex flex-wrap items-center gap-x-5 gap-y-3 text-sm md:text-base text-barclays-navy font-medium">
            {names.map((n) => (
              <li key={n}>
                <button
                  onClick={() => setActive((prev) => (prev === n ? null : n))}
                  className={`hover:underline underline-offset-4 ${
                    active === n ? "text-barclays-blue" : ""
                  }`}
                >
                  {n}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Mega panel (desktop) */}
      {activeMega && (
        <div className="hidden md:block w-full bg-white border-t border-gray-200">
          <div className="container py-8 md:py-10">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {activeMega.columns.map((col) => (
                <div key={col.title}>
                  <div className="text-barclays-navy font-semibold">
                    {col.title}
                  </div>
                  <hr className="my-2 border-gray-200" />
                  <ul className="space-y-2">
                    {col.items.map((it) => (
                      <li key={it.label}>
                        <a className="hover:underline" href={it.href}>
                          {it.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* NEW: Mobile second row with Call/Find/Search/Login */}
      <div className="container pb-3 md:hidden">
        <div className="flex items-center justify-end gap-3">
          <span className="inline-flex items-center gap-2 text-sm text-barclays-navy">
            <IconPhone /> Call
          </span>
          <span className="inline-flex items-center gap-2 text-sm text-barclays-navy">
            <IconPin /> Find
          </span>
          <span className="inline-flex items-center gap-2 text-sm text-barclays-navy">
            <IconSearch /> Search
          </span>
          <a href="/login" className="btn-primary">
            Log in
          </a>
        </div>
      </div>

      {/* Mobile menu with accordions */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="container py-4">
            {/* Personal dropdown on mobile */}
            <details className="group">
              <summary className="flex items-center justify-between px-2 py-3 font-semibold cursor-pointer">
                Personal <IconChevron />
              </summary>
              <div className="pl-4 pb-3 pt-1 space-y-1">
                {[
                  "Premier",
                  "Business",
                  "Wealth Management",
                  "Corporate",
                  "Private Bank",
                  "International banking",
                ].map((x) => (
                  <a
                    key={x}
                    href="#"
                    className="block px-2 py-1 rounded hover:bg-gray-50"
                    onClick={closeMobile}
                  >
                    {x}
                  </a>
                ))}
              </div>
            </details>

            <hr className="my-2 border-gray-200" />

            {megaData.map((m) => (
              <details key={m.name} className="group">
                <summary className="flex items-center justify-between px-2 py-3 font-semibold cursor-pointer">
                  {m.name} <IconChevron />
                </summary>
                <div className="pl-4 pb-3 pt-1">
                  {m.columns.map((col) => (
                    <div key={col.title} className="mt-3">
                      <div className="text-sm text-barclays-navy font-semibold">
                        {col.title}
                      </div>
                      <hr className="my-1 border-gray-200" />
                      <ul className="space-y-1">
                        {col.items.map((it) => (
                          <li key={it.label}>
                            <a
                              className="block px-2 py-1 rounded hover:bg-gray-50"
                              href={it.href}
                              onClick={closeMobile}
                            >
                              {it.label}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
