// FILE: src/components/AppFooter.tsx
export default function AppFooter() {
  return (
    <footer className="w-full bg-white border-t border-gray-200">
      <div className="container py-6 text-xs text-gray-600 flex flex-col md:flex-row gap-3 md:items-center justify-between">
        <div>
          © {new Date().getFullYear()} Barclays (demo). All rights reserved.
        </div>
        <div className="flex items-center gap-4">
          <a className="hover:underline" href="#">
            Privacy
          </a>
          <a className="hover:underline" href="#">
            Cookies
          </a>
          <a className="hover:underline" href="#">
            Security
          </a>
          <a className="hover:underline" href="#">
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}
