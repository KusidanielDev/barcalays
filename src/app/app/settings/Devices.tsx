// FILE: src/app/app/settings/Devices.tsx
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Props = {
  clearLoginHistoryAction: () => Promise<void>;
};

// We show recent login activity from AuditLog (action: "LOGIN").
// With JWT sessions you can’t “revoke” other devices globally without extra infra.
// This keeps it honest and useful.
export default async function Devices({ clearLoginHistoryAction }: Props) {
  const session = await auth();
  if (!session?.user?.email) return null;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    select: { id: true },
  });
  if (!user) return null;

  const logins = await prisma.auditLog.findMany({
    where: { userId: user.id, action: "LOGIN" },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, createdAt: true, ip: true, userAgent: true },
  });

  return (
    <div className="mt-4">
      <div className="text-sm text-gray-600 mb-3">
        We show your recent login activity. To sign out of this device, use the
        logout button in the header.
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500">
              <th className="py-2">Time</th>
              <th>IP</th>
              <th>User agent</th>
            </tr>
          </thead>
          <tbody>
            {logins.map((l) => (
              <tr key={l.id} className="border-t">
                <td className="py-2">
                  {new Date(l.createdAt).toLocaleString("en-GB")}
                </td>
                <td>{l.ip || "—"}</td>
                <td className="max-w-[40ch] truncate" title={l.userAgent || ""}>
                  {l.userAgent || "—"}
                </td>
              </tr>
            ))}
            {logins.length === 0 && (
              <tr>
                <td className="py-3 text-gray-600" colSpan={3}>
                  No login activity.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <form action={clearLoginHistoryAction} className="mt-4">
        <button className="btn-secondary">Clear login history</button>
      </form>
    </div>
  );
}
