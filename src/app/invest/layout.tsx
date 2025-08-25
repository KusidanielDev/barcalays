// FILE: src/app/invest/layout.tsx
import Link from "next/link";
import "@/app/globals.css";

export default function InvestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const nav = [
    { href: "/invest", label: "My Hub" },
    { href: "/invest/find", label: "Find investments" },
    { href: "/invest/research", label: "News & research" },
    { href: "/invest/learn", label: "Learn & plan" },
    { href: "/invest/accounts", label: "Accounts & services" },
    { href: "/invest/manage", label: "Manage account" },
    { href: "/invest/help", label: "Help" },
  ];
  return (
    <html>
      <body>
        <header className="border-b bg-white">
          <div className="container h-14 flex items-center justify-between">
            <Link href="/invest" className="font-semibold text-barclays-navy">
              Smart Investor (Demo)
            </Link>
            <div className="hidden md:flex items-center gap-5">
              {nav.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="text-sm hover:underline"
                >
                  {n.label}
                </Link>
              ))}
              <div className="flex items-center gap-2">
                <input
                  placeholder="Search by name or EPIC"
                  className="border rounded px-3 py-1 text-sm"
                />
                <button className="btn-primary text-sm">Search</button>
              </div>
            </div>
          </div>
        </header>
        <main className="min-h-[80vh] bg-gray-50">{children}</main>
      </body>
    </html>
  );
}
