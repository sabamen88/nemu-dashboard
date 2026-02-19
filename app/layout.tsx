import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Nemu AI — Dashboard Penjual",
  description: "Kelola toko, produk, dan pesanan kamu dengan AI",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const hasValidKey = publishableKey && publishableKey.startsWith("pk_");

  if (!hasValidKey) {
    return (
      <html lang="id">
        <body className={inter.className}>
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center p-8">
              <div className="text-5xl mb-4">⚙️</div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">Setup in progress</h1>
              <p className="text-gray-500">Add Clerk keys to complete setup.</p>
            </div>
          </div>
        </body>
      </html>
    );
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <html lang="id">
        <body className={inter.className}>{children}</body>
      </html>
    </ClerkProvider>
  );
}
