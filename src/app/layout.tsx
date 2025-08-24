// FILE: src/app/layout.tsx
import "./globals.css";
import Tidio from "@/components/Tidio";
import Providers from "./providers";

export const metadata = {
  title: "Barclays",
  description: "Barclays banking demo landing and app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Tidio />
          {children}
        </Providers>
      </body>
    </html>
  );
}
