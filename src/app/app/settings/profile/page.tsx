import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ProfilePage() {
  const session = await auth();
  const u = session?.user?.email
    ? await prisma.user.findUnique({ where: { email: session.user.email } })
    : null;
  if (!u) return <div>Not found</div>;
  return (
    <div>
      <h1 className="text-2xl font-bold text-barclays-navy">Profile</h1>
      <div className="card mt-4">
        <div className="text-sm text-gray-600">Name</div>
        <div className="font-medium">{u.name}</div>
        <div className="text-sm text-gray-600 mt-3">Email</div>
        <div className="font-medium">{u.email}</div>
      </div>
      <div className="mt-4 text-sm text-gray-600">
        Profile editing is out of scope for this — but wiring this to an update
        endpoint is straightforward.
      </div>
    </div>
  );
}
