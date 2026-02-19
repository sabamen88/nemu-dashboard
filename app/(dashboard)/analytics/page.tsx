export const dynamic = 'force-dynamic';

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { sellers, orders, products, messages } from "@/lib/schema";
import { eq, count, sum, desc } from "drizzle-orm";
import { formatRupiah } from "@/lib/utils";

export default async function AnalyticsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const seller = await db.query.sellers.findFirst({ where: eq(sellers.clerkUserId, userId) });
  if (!seller) redirect("/onboarding");

  const [totalOrders, totalProducts, totalMessages] = await Promise.all([
    db.select({ count: count(), total: sum(orders.total) }).from(orders).where(eq(orders.sellerId, seller.id)),
    db.select({ count: count() }).from(products).where(eq(products.sellerId, seller.id)),
    db.select({ count: count() }).from(messages).where(eq(messages.sellerId, seller.id)),
  ]);

  const stats = [
    { label: "Total Pesanan", value: totalOrders[0].count, sub: formatRupiah(Number(totalOrders[0].total ?? 0)) + " GMV", icon: "🛒" },
    { label: "Total Produk", value: totalProducts[0].count, sub: "aktif di katalog", icon: "📦" },
    { label: "Total Pesan", value: totalMessages[0].count, sub: "dari pembeli", icon: "💬" },
    { label: "Wallet Agent", value: "0.00 USDC", sub: "saldo tersedia", icon: "💰" },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Analitik</h1>
        <p className="text-gray-500 mt-1">Performa toko kamu</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="text-3xl mb-2">{s.icon}</div>
            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
            <div className="text-sm font-medium text-gray-700">{s.label}</div>
            <div className="text-xs text-gray-400 mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
        <div className="text-5xl mb-3">📊</div>
        <h2 className="text-lg font-semibold text-gray-900">Analitik detail segera hadir</h2>
        <p className="text-gray-500 mt-2">Grafik penjualan, konversi pesan ke pesanan, dan produk terlaris akan tersedia di Sprint 2.</p>
      </div>
    </div>
  );
}
