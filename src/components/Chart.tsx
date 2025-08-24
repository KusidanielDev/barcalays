type Point = { x: number; y: number };
export default function Chart({ data, height=160 }:{ data: number[]; height?: number }){
  const max = Math.max(1, ...data);
  const step = 100 / Math.max(1, data.length-1);
  const pts = data.map((v,i)=>({ x: i*step, y: height - (v/max)*height }));
  return (
    <svg viewBox={`0 0 100 ${height}`} className="w-full">
      <polyline fill="none" stroke="currentColor" strokeWidth="2" points={pts.map(p=>`${p.x},${p.y}`).join(" ")} />
    </svg>
  );
}
