import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Table } from "@/components/Table";

export default async function DevicesPage() {
  const session = await auth();
  const user = session?.user?.email
    ? await prisma.user.findUnique({ where: { email: session.user.email } })
    : null;

  if (!user) return <div>Not found</div>;

  const logs = await prisma.auditLog.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // Build plain string cells; let <Table /> render them (no JSX map => no key lint)
  const rows = logs.map((l) => [
    new Date(l.createdAt).toLocaleString("en-GB"),
    l.ip || "—",
    (l.userAgent || "—").slice(0, 80),
    l.action,
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold text-barclays-navy">
        Devices & activity
      </h1>
      <div className="mt-4">
        <Table head={["Time", "IP", "Agent", "Action"]} rows={rows} />
      </div>
    </div>
  );
}
