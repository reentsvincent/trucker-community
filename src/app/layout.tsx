import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Trucker Community by cargovibe",
  description: "Die Community für LKW-Fahrer: Parkplätze, Recht, Technik, Jobs und mehr.",
};

export const viewport: Viewport = {
  themeColor: "#A085FF",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="de" className={inter.variable}>
      <body className="font-sans antialiased">
        <div className="mx-auto min-h-dvh max-w-xl bg-white pb-28 shadow-sm sm:border-x sm:border-line">
          {children}
        </div>
      </body>
    </html>
  );
}
