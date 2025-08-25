// FILE: src/app/app/investments/page.tsx
import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";
export default function AppInvestments() {
  redirect("/app/invest");
}
