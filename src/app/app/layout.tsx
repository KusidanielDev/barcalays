// FILE: src/app/app/layout.tsx
import UserHeader from "@/components/UserHeader";
import AppFooterSimple from "@/components/AppFooterSimple";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <UserHeader />
      <main className="container flex-1 py-6">{children}</main>
      <AppFooterSimple />
    </div>
  );
}
