// FILE: src/components/AppFooterSimple.tsx
export default function AppFooterSimple() {
  return (
    <footer className="w-full border-t border-gray-200 bg-white">
      <div className="container py-4 text-sm text-gray-600 flex items-center justify-between">
        <span>© {new Date().getFullYear()} Barclays</span>
        <a href="mailto:support@barclays.example" className="underline">
          support@barclays.example
        </a>
      </div>
    </footer>
  );
}
