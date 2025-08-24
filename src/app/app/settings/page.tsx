// FILE: src/app/app/settings/page.tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProfileForm from "./ProfileForm";
import SecurityForm from "./SecurityForm";
import Devices from "./Devices";
import {
  updateProfileAction,
  changePasswordAction,
  clearLoginHistoryAction,
} from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/login?from=/app/settings");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email! },
    select: { id: true, name: true, email: true, phone: true, createdAt: true },
  });
  if (!user) redirect("/login?from=/app/settings");

  return (
    <div className="container py-8 grid gap-6">
      <h1 className="text-2xl font-bold text-barclays-navy">Settings</h1>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 text-sm">
        <a href="#profile" className="btn-secondary">
          Profile
        </a>
        <a href="#security" className="btn-secondary">
          Security
        </a>
        <a href="#devices" className="btn-secondary">
          Devices
        </a>
      </div>

      {/* Profile */}
      <section id="profile" className="card">
        <div className="text-lg font-semibold text-barclays-navy">Profile</div>
        <ProfileForm user={user} action={updateProfileAction} />
      </section>

      {/* Security */}
      <section id="security" className="card">
        <div className="text-lg font-semibold text-barclays-navy">Security</div>
        <SecurityForm action={changePasswordAction} />
        <p className="text-xs text-gray-500 mt-2">
          Tip: use at least 12 characters with a mix of letters, numbers and
          symbols.
        </p>
      </section>

      {/* Devices */}
      <section id="devices" className="card">
        <div className="text-lg font-semibold text-barclays-navy">Devices</div>
        <Devices clearLoginHistoryAction={clearLoginHistoryAction} />
      </section>
    </div>
  );
}
