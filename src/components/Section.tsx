export default function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="container py-10">
      <h2 className="text-xl md:text-2xl font-bold text-barclays-navy">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
