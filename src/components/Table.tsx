export function Table({ head, rows }:{ head: string[]; rows: React.ReactNode[][] }){
  return (
    <div className="overflow-x-auto border rounded-xl">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500">
            {head.map((h,i)=>(<th key={i} className="py-2 px-3">{h}</th>))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r,i)=>(
            <tr key={i} className="border-t">
              {r.map((c,j)=>(<td key={j} className="py-2 px-3">{c}</td>))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
