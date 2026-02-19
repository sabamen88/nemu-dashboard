export const dynamic = 'force-dynamic';

import { getDemoSeller } from "@/lib/demo-session";
import { db } from "@/lib/db";
import { orders, products, messages } from "@/lib/schema";
import { eq, count, sum } from "drizzle-orm";
import { formatRupiah } from "@/lib/utils";

export default async function AnalyticsPage() {
  const seller = await getDemoSeller();

  const [orderStats, productStats, messageStats] = await Promise.all([
    db.select({ count: count(), total: sum(orders.total) })
      .from(orders)
      .where(eq(orders.sellerId, seller.id)),
    db.select({ count: count() })
      .from(products)
      .where(eq(products.sellerId, seller.id)),
    db.select({ count: count() })
      .from(messages)
      .where(eq(messages.sellerId, seller.id)),
  ]);

  const totalOrders = orderStats[0].count;
  const totalRevenue = Number(orderStats[0].total ?? 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const stats = [
    {
      label: "Total Pendapatan",
      value: formatRupiah(totalRevenue),
      sub: "Dari semua pesanan",
      icon: "💰",
      color: "from-green-400 to-green-600",
      textColor: "text-green-700",
      bg: "bg-green-50",
    },
    {
      label: "Total Pesanan",
      value: totalOrders.toString(),
      sub: "Semua status",
      icon: "🛒",
      color: "from-blue-400 to-blue-600",
      textColor: "text-blue-700",
      bg: "bg-blue-50",
    },
    {
      label: "Rata-rata Nilai Pesanan",
      value: formatRupiah(avgOrderValue),
      sub: "Per transaksi",
      icon: "📈",
      color: "from-purple-400 to-purple-600",
      textColor: "text-purple-700",
      bg: "bg-purple-50",
    },
    {
      label: "Produk Terlaris",
      value: productStats[0].count > 0 ? `${productStats[0].count} produk` : "—",
      sub: "Di katalog",
      icon: "🏆",
      color: "from-orange-400 to-orange-600",
      textColor: "text-orange-700",
      bg: "bg-orange-50",
    },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analitik Toko</h1>
        <p className="text-gray-500 mt-1">Performa {seller.storeName}</p>
      </div>

      {/* Founding Seller Benefit */}
      {seller.isFoundingSeller && (
        <div className="rounded-2xl p-5 flex items-start gap-4 text-white"
          style={{ background: 'linear-gradient(135deg, #E91E63, #C2185B)' }}>
          <span className="text-3xl mt-0.5">🏆</span>
          <div>
            <p className="font-bold text-lg">Keuntungan Founding Seller</p>
            <div className="mt-2 space-y-1.5 text-pink-100 text-sm">
              <div className="flex items-center gap-2">
                <span>✓</span>
                <span>Komisi 0% untuk 1000 transaksi pertama</span>
              </div>
              <div className="flex items-center gap-2">
                <span>✓</span>
                <span>Prioritas muncul di halaman utama Nemu AI</span>
              </div>
              <div className="flex items-center gap-2">
                <span>✓</span>
                <span>Akses beta fitur AI eksklusif</span>
              </div>
              <div className="flex items-center gap-2">
                <span>✓</span>
                <span>Badge "Founding Seller" di halaman toko</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4 ${s.bg}`}>
              {s.icon}
            </div>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className={`text-sm font-semibold mt-0.5 ${s.textColor}`}>{s.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Revenue Chart Placeholder */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-bold text-gray-900 text-lg">Grafik Pendapatan</h2>
          <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full">7 hari terakhir</span>
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="text-5xl mb-4">📊</div>
          <p className="font-semibold text-gray-700 text-lg">Grafik tersedia setelah 7 hari transaksi pertama</p>
          <p className="text-gray-400 text-sm mt-2 max-w-sm">
            Lakukan transaksi pertamamu dan data grafik akan mulai tersedia dalam 7 hari.
          </p>
        </div>

        {/* Fake chart bars for visual effect */}
        <div className="flex items-end justify-between gap-2 mt-2 px-4">
          {["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"].map((day, i) => (
            <div key={day} className="flex flex-col items-center gap-1.5 flex-1">
              <div
                className="w-full rounded-t-lg opacity-20"
                style={{
                  height: `${[20, 35, 28, 45, 38, 60, 25][i]}px`,
                  backgroundColor: '#E91E63',
                }}
              />
              <span className="text-xs text-gray-400">{day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* AI Agent Stats */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-bold text-gray-900 mb-4">🤖 Statistik Agen AI</h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Pesan Ditangani AI", value: messageStats[0].count, icon: "💬" },
            { label: "Pesanan via AI", value: "0", icon: "🛒" },
            { label: "Tingkat Konversi", value: "—", icon: "📈" },
          ].map((s) => (
            <div key={s.label} className="text-center p-4 bg-gray-50 rounded-xl">
              <div className="text-2xl mb-2">{s.icon}</div>
              <p className="text-xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
