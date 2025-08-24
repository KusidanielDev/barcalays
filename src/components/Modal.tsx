"use client";
import { useEffect } from "react";

export default function Modal({ open, onClose, title, children }:{ open:boolean; onClose:()=>void; title:string; children: React.ReactNode }) {
  useEffect(()=>{
    const fn = (e: KeyboardEvent)=> e.key==="Escape" && onClose();
    window.addEventListener("keydown", fn);
    return ()=> window.removeEventListener("keydown", fn);
  },[onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose} role="dialog" aria-modal="true">
      <div className="bg-white rounded-xl w-full max-w-lg shadow-lg" onClick={(e)=>e.stopPropagation()}>
        <div className="px-4 py-3 border-b font-semibold">{title}</div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
