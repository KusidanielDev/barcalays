// FILE: src/components/Tidio.tsx
"use client";
import Script from "next/script";

export default function Tidio() {
  const key = process.env.NEXT_PUBLIC_TIDIO_KEY;
  if (!key) return null;
  return (
    <Script
      id="tidio"
      src={`//code.tidio.co/${key}.js`}
      strategy="afterInteractive"
    />
  );
}
