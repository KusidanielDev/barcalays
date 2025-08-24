"use client";
import { useState } from "react";

export default function Tabs({ tabs }:{ tabs: {id:string; label:string; content: React.ReactNode}[] }){
  const [active, setActive] = useState(tabs[0]?.id);
  return (
    <div>
      <div className="flex gap-2 border-b">
        {tabs.map(t=>(
          <button key={t.id} onClick={()=>setActive(t.id)} className={"px-3 py-2 " + (active===t.id?"border-b-2 border-barclays-blue text-barclays-navy font-medium":"text-gray-600")}>{t.label}</button>
        ))}
      </div>
      <div className="mt-4">{tabs.find(t=>t.id===active)?.content}</div>
    </div>
  );
}
