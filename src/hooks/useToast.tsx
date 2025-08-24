"use client";
import { createContext, useContext, useState, useCallback } from "react";

type Toast = { id: number; message: string; type?: "success"|"error"|"info" };
const ToastCtx = createContext<{ toasts: Toast[]; push: (t: Omit<Toast,"id">)=>void; remove:(id:number)=>void }|null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((t: Omit<Toast,"id">)=>{
    const id = Date.now() + Math.floor(Math.random()*1000);
    setToasts((arr)=>[...arr, { id, ...t }]);
    setTimeout(()=>setToasts(arr=>arr.filter(x=>x.id!==id)), 4000);
  },[]);
  const remove = (id:number)=> setToasts(arr=>arr.filter(x=>x.id!==id));
  return <ToastCtx.Provider value={{ toasts, push, remove }}>
    {children}
    <div className="fixed bottom-4 right-4 space-y-2 z-50">
      {toasts.map(t=>(
        <div key={t.id} className={"rounded-md px-4 py-2 shadow text-white " + (t.type==="error"?"bg-red-600":t.type==="success"?"bg-green-600":"bg-gray-900")}>
          {t.message}
        </div>
      ))}
    </div>
  </ToastCtx.Provider>;
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
