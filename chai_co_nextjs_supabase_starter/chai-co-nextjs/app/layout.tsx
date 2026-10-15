import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chai & Co. | Shop Management",
  description: "Shop operations for Chai & Co.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
