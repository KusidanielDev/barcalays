import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// narrow the type so TS can infer in .map()
type AuditRow = {
  id: string;
  createdAt: Date;
  action: string;
  meta: string | null; // stored as JSON string in SQLite
  user: { email: string | null } | null;
};

export default async function AuditPage() {
  const session = await auth();
  if ((session?.user as any)?.role !== "ADMIN") {
    return <div className="container py-10">Forbidden</div>;
  }

  // use select to get a strongly-typed shape
  const logs: AuditRow[] = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      createdAt: true,
      action: true,
      meta: true,
      user: { select: { email: true } },
    },
  });

  const fmt = (m: string | null) => {
    if (!m) return "";
    try {
      const obj = typeof m === "string" ? JSON.parse(m) : m;
      return JSON.stringify(obj, null, 0);
    } catch {
      return String(m);
    }
  };

  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold text-barclays-navy">Audit log</h1>
      <div className="card mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="py-2">Time</th>
              <th>User</th>
              <th>Action</th>
              <th>Meta</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-t">
                <td className="py-2">
                  {new Date(l.createdAt).toLocaleString("en-GB")}
                </td>
                <td>{l.user?.email}</td>
                <td>{l.action}</td>
                <td>
                  <pre className="whitespace-pre-wrap">{fmt(l.meta)}</pre>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
