import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function NotificationsPage() {
  const session = await auth();
  const user = session?.user?.email
    ? await prisma.user.findUnique({ where: { email: session.user.email } })
    : null;
  if (!user) return <div className="container py-10">Not found</div>;
  const logs = await prisma.auditLog.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold text-barclays-navy">Notifications</h1>
      <div className="card mt-4 divide-y">
        {logs.map((l) => (
          <div key={l.id} className="py-3">
            <div className="font-medium">{l.action}</div>
            <div className="text-xs text-gray-600">
              {new Date(l.createdAt).toLocaleString("en-GB")}
            </div>
          </div>
        ))}
        {!logs.length && (
          <div className="py-6 text-sm text-gray-600">
            You are all caught up.
          </div>
        )}
      </div>
    </div>
  );
}
