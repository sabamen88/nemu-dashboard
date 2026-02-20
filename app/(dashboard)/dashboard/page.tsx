export const dynamic = 'force-dynamic';

import { getDemoSeller } from "@/lib/demo-session";
import { db } from "@/lib/db";
import { products, orders, messages } from "@/lib/schema";
import { eq, count, desc, and, sql, lte } from "drizzle-orm";
import { formatRupiah, ORDER_STATUS_LABELS } from "@/lib/utils";
import AgentToggle from "./agent-toggle";
import WalletCard from "./wallet-card";
import SellerIdentityCard from "./seller-identity-card";
import Link from "next/link";

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  shipped: "bg-indigo-100 text-indigo-700",
  done: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-600",
};

export default async function DashboardPage() {
  const seller = await getDemoSeller();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [productCount, todayOrderCount, unreadCount, walletTotal, recentOrders, lowStockResult] = await Promise.all([
    db.select({ count: count() }).from(products)
      .where(and(eq(products.sellerId, seller.id), eq(products.status, "active"))),
    db.select({ count: count() }).from(orders)
      .where(and(eq(orders.sellerId, seller.id), sql`${orders.createdAt} >= ${today}`)),
    db.select({ count: count() }).from(messages)
      .where(and(eq(messages.sellerId, seller.id), eq(messages.direction, "inbound"), eq(messages.handledBy, "agent"))),
    // wallet placeholder
    Promise.resolve([{ total: "0" }]),
    db.query.orders.findMany({
      where: eq(orders.sellerId, seller.id),
      orderBy: [desc(orders.createdAt)],
      limit: 5,
    }),
    db.select({ count: count() }).from(products)
      .where(and(eq(products.sellerId, seller.id), eq(products.status, "active"), lte(products.stock, 5))),
  ]);

  const lowStockCount = lowStockResult[0].count;

  const stats = [
    {
      label: "Produk Aktif",
      value: productCount[0].count,
      icon: "📦",
      color: "bg-blue-50 text-blue-600",
      href: "/catalog",
    },
    {
      label: "Pesanan Hari Ini",
      value: todayOrderCount[0].count,
      icon: "🛒",
      color: "bg-orange-50 text-orange-600",
      href: "/orders",
    },
    {
      label: "Pesan Belum Dibaca",
      value: unreadCount[0].count,
      icon: "💬",
      color: "bg-indigo-50 text-indigo-600",
      href: "/messages",
    },
    {
      label: "Wallet USDC",
      value: "Lihat →",
      icon: "💰",
      color: "bg-green-50 text-green-600",
      href: "/wallet",
    },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">

      {/* Founding Seller Banner */}
      {seller.isFoundingSeller && (
        <div className="rounded-2xl p-4 text-white flex items-center gap-4"
          style={{ background: 'linear-gradient(135deg, #4f39f6, #625fff)' }}>
          <span className="text-3xl">🏆</span>
          <div>
            <p className="font-bold text-lg">Kamu adalah Founding Seller Nemu AI!</p>
            <p className="text-indigo-100 text-sm">Nikmati keuntungan eksklusif dan akses prioritas ke fitur baru.</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Halo! 👋 Selamat datang kembali
        </h1>
        <p className="text-gray-500 mt-1">{seller.storeName} · <span className="text-gray-400">nemu-ai.com/toko/{seller.storeSlug}</span></p>
      </div>

      {/* Seller Identity Card */}
      <SellerIdentityCard
        storeName={seller.storeName}
        storeSlug={seller.storeSlug}
        tokoId={seller.tokoId ?? null}
        inviteCode={seller.inviteCode}
        isFoundingSeller={seller.isFoundingSeller}
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3 ${s.color}`}>
              {s.icon}
            </div>
            <div className="text-2xl font-bold text-gray-900 group-hover:text-gray-700">{s.value}</div>
            <div className="text-sm text-gray-500 mt-0.5">{s.label}</div>
          </Link>
        ))}
      </div>

      {/* Low Stock Alert */}
      {lowStockCount > 0 && (
        <Link
          href="/catalog"
          className="flex items-center gap-3 rounded-2xl px-5 py-4 text-white font-medium text-sm hover:opacity-90 transition"
          style={{ background: "linear-gradient(135deg, #4f39f6, #625fff)" }}
        >
          <span className="text-xl">⚠️</span>
          <span>
            <strong>{lowStockCount} produk hampir habis stok!</strong>{" "}
            Segera update katalogmu.
          </span>
          <span className="ml-auto text-indigo-200 text-xs font-semibold whitespace-nowrap">
            Lihat Katalog →
          </span>
        </Link>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* AI Agent Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center gap-2 mb-5">
              <span className="text-xl">🤖</span>
              <h2 className="font-bold text-gray-900">Agen AI WhatsApp</h2>
            </div>
            <AgentToggle seller={seller} />
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-4">
            <h2 className="font-bold text-gray-900 mb-4">Aksi Cepat</h2>
            <div className="space-y-2">
              <Link href="/catalog/new"
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition text-sm font-medium text-gray-700 border border-gray-200">
                <span className="text-base">➕</span> Tambah Produk
              </Link>
              <Link href="/orders"
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition text-sm font-medium text-gray-700 border border-gray-200">
                <span className="text-base">🛒</span> Lihat Semua Pesanan
              </Link>
              <a href={`https://nemu-ai.com/toko/${seller.storeSlug}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition text-sm font-medium text-gray-700 border border-gray-200">
                <span className="text-base">🏪</span> Buka Toko →
              </a>
            </div>
          </div>

          {/* Wallet Mini Card */}
          <div className="mt-4">
            <WalletCard />
          </div>
        </div>

        {/* Recent Orders */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-gray-900">Pesanan Terbaru</h2>
              <Link href="/orders" className="text-sm font-medium hover:underline" style={{ color: '#4f39f6' }}>
                Lihat semua →
              </Link>
            </div>

            {recentOrders.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-5xl mb-3">📦</div>
                <p className="font-semibold text-gray-700">Belum ada pesanan</p>
                <p className="text-sm text-gray-400 mt-1">Tambah produk untuk mulai berjualan</p>
                <Link href="/catalog/new"
                  className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 text-sm font-medium text-white rounded-xl transition hover:opacity-90"
                  style={{ backgroundColor: '#4f39f6' }}>
                  Tambah Produk Pertama
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">No.</th>
                      <th className="text-left pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Pembeli</th>
                      <th className="hidden sm:table-cell text-left pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Produk</th>
                      <th className="text-right pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Total</th>
                      <th className="text-center pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                      <th className="hidden sm:table-cell text-right pb-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Tanggal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {recentOrders.map((order) => {
                      const items = (order.items ?? []) as { productName: string; quantity: number }[];
                      return (
                        <tr key={order.id} className="hover:bg-gray-50 transition">
                          <td className="py-3 font-mono text-xs text-gray-400 whitespace-nowrap">
                            #{order.id.slice(-6).toUpperCase()}
                          </td>
                          <td className="py-3 font-medium text-gray-800 max-w-[100px] truncate">{order.buyerName}</td>
                          <td className="hidden sm:table-cell py-3 text-gray-500 max-w-[140px] truncate">
                            {items.map(i => `${i.quantity}× ${i.productName}`).join(", ")}
                          </td>
                          <td className="py-3 text-right font-bold text-gray-800 whitespace-nowrap">
                            {formatRupiah(Number(order.total))}
                          </td>
                          <td className="py-3 text-center">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold whitespace-nowrap ${STATUS_BADGE[order.status] ?? "bg-gray-100 text-gray-600"}`}>
                              {ORDER_STATUS_LABELS[order.status] ?? order.status}
                            </span>
                          </td>
                          <td className="hidden sm:table-cell py-3 text-right text-xs text-gray-400 whitespace-nowrap">
                            {new Date(order.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
