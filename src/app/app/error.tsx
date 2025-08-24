'use client';
export default function Error({ error }: { error: Error }) {
  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold text-red-600">Something went wrong</h1>
      <pre className="mt-2 whitespace-pre-wrap text-sm">{String(error?.message || error)}</pre>
    </div>
  );
}
