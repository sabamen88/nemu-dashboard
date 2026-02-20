import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Nemu AI — Dashboard Penjual",
  description: "Kelola toko, produk, dan pesanan kamu dengan AI",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <meta name="theme-color" content="#4f39f6" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
