// FILE: src/components/SiteFooter.tsx
import Image from "next/image";

export default function SiteFooter() {
  const AppleIcon = () => (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
      <path d="M16.36 13.77c.03 3.26 2.86 4.35 2.89 4.36-.02.06-.45 1.54-1.49 3.05-.9 1.3-1.83 2.6-3.3 2.63-1.44.03-1.9-.85-3.54-.85-1.65 0-2.14.82-3.49.88-1.4.06-2.47-1.41-3.38-2.71-1.84-2.67-3.25-7.54-1.36-10.84.94-1.63 2.63-2.67 4.47-2.7 1.4-.03 2.73.94 3.54.94.8 0 2.43-1.15 4.12-.98.7.03 2.68.28 3.95 2.14-.1.06-2.35 1.37-2.41 4.08ZM13.9 2.96c.76-.9 1.29-2.15 1.15-3.4-1.1.05-2.37.74-3.14 1.64-.69.79-1.31 2.07-1.15 3.3 1.2.09 2.39-.61 3.14-1.54Z" />
    </svg>
  );
  const PlayIcon = () => (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
      <path d="M3 2l18 10-18 10z" />
    </svg>
  );
  const Facebook = () => (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
      <path d="M13 22v-8h3l1-4h-4V7.5c0-1.16.32-1.95 2-1.95H17V2.14C16.69 2.1 15.62 2 14.38 2 11.76 2 10 3.66 10 7.1V10H7v4h3v8h3Z" />
    </svg>
  );
  const LinkedIn = () => (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
      <path d="M6 6a2 2 0 1 1 0-4 2 2 0 0 1 0 4ZM4 8h4v12H4V8Zm6 0h4v2h.06c.56-1.06 1.94-2.18 4-2.18 4.28 0 5.07 2.82 5.07 6.48V20h-4v-5.5c0-1.32-.02-3.03-1.85-3.03-1.85 0-2.13 1.44-2.13 2.93V20h-4V8Z" />
    </svg>
  );
  const XIcon = () => (
    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
      <path d="M17.53 3H20l-6.75 7.72L21 21h-5.5l-4.3-5.08L6.2 21H4l7.23-8.27L3 3h5.6l3.9 4.84L17.53 3Z" />
    </svg>
  );

  return (
    <footer className="w-full bg-white border-t border-gray-200">
      <div className="container py-10">
        {/* Section 1 */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 pb-8 border-b">
          <div>
            <div className="font-semibold text-barclays-navy">Our products</div>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              {[
                "Current accounts",
                "Savings",
                "Loans",
                "Mortgages",
                "Insurance",
                "Credit cards",
              ].map((x) => (
                <li key={x}>
                  <a href="#" className="hover:underline">
                    {x}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="font-semibold text-barclays-navy">Help</div>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              {[
                "Help & FAQs",
                "Money worries",
                "Report fraud or a scam",
                "Report card lost or stolen",
                "Access to cash",
              ].map((x) => (
                <li key={x}>
                  <a href="#" className="hover:underline">
                    {x}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="font-semibold text-barclays-navy">
              Site information
            </div>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              {[
                "Important information",
                "Accessibility",
                "Privacy policy",
                "Cookie policy",
                "Security",
              ].map((x) => (
                <li key={x}>
                  <a href="#" className="hover:underline">
                    {x}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="font-semibold text-barclays-navy">Find us</div>
            <ul className="mt-3 space-y-2 text-sm text-gray-700">
              {["Find Barclays", "Service status", "Careers"].map((x) => (
                <li key={x}>
                  <a href="#" className="hover:underline">
                    {x}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Section 2 */}
        <div className="py-8 space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-barclays-navy">
                Download the Barclays app
              </span>
              <div className="flex items-center gap-2">
                <a
                  className="btn-secondary inline-flex items-center gap-2"
                  href="#"
                >
                  <AppleIcon /> App Store
                </a>
                <a
                  className="btn-secondary inline-flex items-center gap-2"
                  href="#"
                >
                  <PlayIcon /> Google Play
                </a>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="#"
                aria-label="Facebook"
                className="btn-secondary"
                title="Facebook"
              >
                <Facebook />
              </a>
              <a
                href="#"
                aria-label="LinkedIn"
                className="btn-secondary"
                title="LinkedIn"
              >
                <LinkedIn />
              </a>
              <a href="#" aria-label="X" className="btn-secondary" title="X">
                <XIcon />
              </a>
            </div>
          </div>
          <div className="text-xs text-gray-600 space-y-3">
            <p>
              Barclays Bank UK PLC and Barclays Bank PLC are each authorised by
              the Prudential Regulation Authority and regulated by the Financial
              Conduct Authority and the Prudential Regulation Authority.
            </p>
            <p>
              Barclays Insurance Services Company Limited and Barclays
              Investment Solutions Limited are each authorised and regulated by
              the Financial Conduct Authority.
            </p>
            <p>Registered office for all: 1 Churchill Place, London E14 5HP</p>
          </div>
          <div className="flex items-center gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Image
                key={i}
                src={`/images/footer-img-${i + 1}.png`}
                alt={`Footer badge ${i + 1}`}
                width={48} // 12 * 4
                height={32} //  8 * 4
                className="rounded bg-gray-200 object-contain"
              />
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
