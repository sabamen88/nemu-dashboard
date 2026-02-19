export const dynamic = 'force-dynamic';

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { sellers, products, orders, messages } from "@/lib/schema";
import { eq, count, desc } from "drizzle-orm";
import { formatRupiah } from "@/lib/utils";
import AgentToggle from "./agent-toggle";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const seller = await db.query.sellers.findFirst({
    where: eq(sellers.clerkUserId, userId),
  });
  if (!seller) redirect("/onboarding");

  const [productCount, pendingOrders, todayMessages, recentOrders] = await Promise.all([
    db.select({ count: count() }).from(products).where(eq(products.sellerId, seller.id)),
    db.select({ count: count() }).from(orders).where(eq(orders.sellerId, seller.id)),
    db.select({ count: count() }).from(messages).where(eq(messages.sellerId, seller.id)),
    db.query.orders.findMany({
      where: eq(orders.sellerId, seller.id),
      orderBy: [desc(orders.createdAt)],
      limit: 5,
    }),
  ]);

  const stats = [
    { label: "Total Produk", value: productCount[0].count, icon: "📦" },
    { label: "Pesanan Aktif", value: pendingOrders[0].count, icon: "🛒" },
    { label: "Pesan Masuk", value: todayMessages[0].count, icon: "💬" },
    { label: "Wallet Agent", value: "0.00 USDC", icon: "💰" },
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Halo! 👋 Selamat datang di {seller.storeName}
        </h1>
        <p className="text-gray-500 mt-1">
          Link toko:{" "}
          <a href={`https://nemu-ai.com/toko/${seller.storeSlug}`}
            className="text-blue-600 hover:underline" target="_blank">
            nemu-ai.com/toko/{seller.storeSlug}
          </a>
          {" · "}Kode undangan: <span className="font-mono font-medium">{seller.inviteCode}</span>
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="text-3xl mb-2">{s.icon}</div>
            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
            <div className="text-sm text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">🤖</span>
              <h2 className="font-semibold text-gray-900">Asisten AI WhatsApp</h2>
            </div>
            <AgentToggle seller={seller} />
            {seller.agentStatus === "active" && (
              <div className="mt-4 space-y-2 text-sm text-gray-600">
                <p>✅ Menjawab pertanyaan pembeli otomatis</p>
                <p>✅ Notifikasi pesanan baru</p>
                <p>✅ Ringkasan harian pukul 08:00</p>
                {seller.agentWalletAddress && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500">Wallet Agent</p>
                    <p className="font-mono text-xs truncate">{seller.agentWalletAddress}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Pesanan Terbaru</h2>
              <a href="/orders" className="text-sm text-blue-600 hover:underline">Lihat semua</a>
            </div>
            {recentOrders.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <div className="text-4xl mb-2">📦</div>
                <p>Belum ada pesanan</p>
                <p className="text-sm mt-1">Tambah produk untuk mulai berjualan</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="font-medium text-sm">{order.buyerName}</p>
                      <p className="text-xs text-gray-500">
                        {(order.items as { quantity: number; productName: string }[]).map((i) => `${i.quantity}× ${i.productName}`).join(", ")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-sm">{formatRupiah(Number(order.total))}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        order.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                        order.status === "confirmed" ? "bg-blue-100 text-blue-700" :
                        order.status === "done" ? "bg-green-100 text-green-700" :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        {order.status === "pending" ? "Menunggu" :
                         order.status === "confirmed" ? "Dikonfirmasi" :
                         order.status === "done" ? "Selesai" : order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
