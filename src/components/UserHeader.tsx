// FILE: src/components/UserHeader.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

type NavItem = { href: string; label: string };

const RightIcon = ({
  href,
  label,
  path,
}: {
  href: string;
  label: string;
  path: string;
}) => (
  <Link
    href={href}
    className="p-2 rounded-lg hover:bg-gray-100"
    aria-label={label}
    title={label}
  >
    <svg
      viewBox="0 0 24 24"
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d={path} />
    </svg>
  </Link>
);

export default function UserHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [hasInvest, setHasInvest] = useState<boolean>(false);

  // Close mobile menu on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Ask the server if this user has an investment account
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/user/has-investment", {
          cache: "no-store",
        });
        const j = (await res.json()) as { has?: boolean };
        if (alive) setHasInvest(Boolean(j?.has));
      } catch {
        if (alive) setHasInvest(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const primary: NavItem[] = useMemo(() => {
    const base: NavItem[] = [
      { href: "/app", label: "Dashboard" },
      { href: "/app/accounts", label: "Accounts" },
      { href: "/app/transactions", label: "Transactions" },
      // NOTE: We intentionally exclude "Investments" by default.
      { href: "/app/payments", label: "Payments" },
    ];
    // Only show Investments tab if the user actually has an investment account
    return hasInvest
      ? [
          ...base.slice(0, 3),
          { href: "/app/invest", label: "Investments" },
          base[3],
        ]
      : base;
  }, [hasInvest]);

  return (
    <header className="w-full bg-white border-b border-gray-200">
      <div className="container h-16 flex items-center justify-between gap-3">
        <Link href="/app" className="flex items-center gap-2 min-w-0">
          <Image
            src="/images/logo.png"
            alt="Barclays logo"
            width={132}
            height={36}
            className="h-8 w-auto flex-shrink-0"
            priority
          />
          <span className="text-base md:text-lg font-semibold text-barclays-navy truncate max-w-[45vw] md:max-w-none">
            Barclays
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-5">
          {primary.map((i) => (
            <Link
              key={i.href}
              href={i.href}
              className="text-sm font-medium text-barclays-navy hover:underline"
              aria-current={pathname === i.href ? "page" : undefined}
            >
              {i.label}
            </Link>
          ))}
          <div className="flex items-center gap-1 pl-3 ml-2 border-l">
            <RightIcon
              href="/app/notifications"
              label="Notifications"
              path="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
            />
            <RightIcon
              href="/app/settings"
              label="Settings"
              path="M12 15a3 3 0 1 0 0-6m7.4 6a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V22a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H2a2 2 0 1 1 0-4h.09c.65 0 1.24-.39 1.51-1"
            />
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="btn-secondary ml-1"
            >
              Logout
            </button>
          </div>
        </nav>

        {/* Mobile menu button */}
        <button
          onClick={() => setOpen((o) => !o)}
          className="lg:hidden btn-secondary"
          aria-label="Open menu"
        >
          <svg
            viewBox="0 0 24 24"
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="lg:hidden border-t border-gray-200 bg-white">
          <div className="container py-3">
            <ul className="grid gap-1">
              {primary.map((i) => (
                <li key={i.href}>
                  <Link
                    href={i.href}
                    className="flex items-center gap-3 px-2 py-2 rounded hover:bg-gray-50"
                    aria-current={pathname === i.href ? "page" : undefined}
                  >
                    {i.label}
                  </Link>
                </li>
              ))}
              <li className="mt-2 flex items-center gap-2">
                <Link
                  href="/app/notifications"
                  className="btn-secondary flex-1"
                >
                  Notifications
                </Link>
                <Link href="/app/settings" className="btn-secondary flex-1">
                  Settings
                </Link>
              </li>
              <li className="mt-2">
                <button
                  onClick={() =>
                    signOut({
                      callbackUrl:
                        typeof window !== "undefined"
                          ? new URL("/", window.location.origin).toString()
                          : "/",
                    })
                  }
                  className="btn-secondary ml-1"
                >
                  Logout
                </button>
              </li>
            </ul>
          </div>
        </div>
      )}
    </header>
  );
}
