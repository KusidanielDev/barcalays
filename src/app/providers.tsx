"use client";
import { ToastProvider } from "@/hooks/useToast";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>;
}
