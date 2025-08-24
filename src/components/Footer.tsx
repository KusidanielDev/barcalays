export default function Footer() {
  return (
    <footer className="mt-16 bg-barclays-navy text-white">
      <div className="container py-10 grid gap-6 md:grid-cols-4">
        <div>
          <div className="font-semibold mb-2">Barclays (Demo)</div>
          <p className="text-sm opacity-90">This is an educational prototype. No real banking happens here.</p>
        </div>
        <div>
          <div className="font-semibold mb-2">Legal</div>
          <ul className="space-y-1 text-sm opacity-90">
            <li><a href="#">Terms &amp; Conditions</a></li>
            <li><a href="#">Privacy Policy</a></li>
            <li><a href="#">Accessibility</a></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold mb-2">Support</div>
          <ul className="space-y-1 text-sm opacity-90">
            <li><a href="#">Contact us</a></li>
            <li><a href="#">Help</a></li>
          </ul>
        </div>
        <div className="text-sm opacity-80">
          © 2025 Barclays (Demo). Built with Next.js & Prisma.
        </div>
      </div>
    </footer>
  );
}
