"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatRupiah, ORDER_STATUS_LABELS } from "@/lib/utils";
import type { Order } from "@/lib/schema";

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  shipped: "bg-indigo-100 text-indigo-700",
  done: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-600",
};

const TABS = [
  { key: "all", label: "Semua" },
  { key: "pending", label: "Menunggu" },
  { key: "confirmed", label: "Diproses" },
  { key: "shipped", label: "Dikirim" },
  { key: "done", label: "Selesai" },
];

interface OrdersClientProps {
  orders: Order[];
  pendingCount: number;
  activeStatus?: string;
}

function Spinner() {
  return (
    <span className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
  );
}

function OrderActions({ order }: { order: Order }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function updateStatus(newStatus: string) {
    setLoading(true);
    try {
      await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      router.refresh();
    } catch (err) {
      console.error("Gagal memperbarui status:", err);
    } finally {
      setLoading(false);
    }
  }

  if (order.status === "pending") {
    return (
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => updateStatus("confirmed")}
          disabled={loading}
          className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition hover:opacity-90 disabled:opacity-60 whitespace-nowrap"
          style={{ backgroundColor: "#4f39f6" }}
        >
          {loading ? <Spinner /> : "✅"} Konfirmasi
        </button>
        <button
          onClick={() => updateStatus("cancelled")}
          disabled={loading}
          className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200 transition disabled:opacity-60 whitespace-nowrap"
        >
          {loading ? <Spinner /> : "❌"} Batalkan
        </button>
      </div>
    );
  }

  if (order.status === "confirmed") {
    return (
      <button
        onClick={() => updateStatus("shipped")}
        disabled={loading}
        className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-100 text-indigo-700 border border-indigo-200 hover:bg-indigo-200 transition disabled:opacity-60 whitespace-nowrap"
      >
        {loading ? <Spinner /> : "🚚"} Tandai Dikirim
      </button>
    );
  }

  if (order.status === "shipped") {
    return (
      <button
        onClick={() => updateStatus("done")}
        disabled={loading}
        className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-green-100 text-green-700 border border-green-200 hover:bg-green-200 transition disabled:opacity-60 whitespace-nowrap"
      >
        {loading ? <Spinner /> : "✓"} Selesai
      </button>
    );
  }

  // done or cancelled — no action buttons
  return null;
}

export default function OrdersClient({
  orders: allOrders,
  pendingCount,
  activeStatus,
}: OrdersClientProps) {
  const filtered =
    activeStatus && activeStatus !== "all"
      ? allOrders.filter((o) => o.status === activeStatus)
      : allOrders;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pesanan</h1>
        <p className="text-gray-500 mt-1">
          {pendingCount > 0
            ? `${pendingCount} pesanan menunggu konfirmasi`
            : "Semua pesanan sudah diproses"}
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(({ key, label }) => {
          const isActive = (activeStatus ?? "all") === key;
          const count =
            key === "all"
              ? allOrders.length
              : allOrders.filter((o) => o.status === key).length;
          return (
            <Link
              key={key}
              href={key === "all" ? "/orders" : `/orders?status=${key}`}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition ${
                isActive
                  ? "text-white border-transparent shadow-sm"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
              style={
                isActive
                  ? { backgroundColor: "#4f39f6", borderColor: "#4f39f6" }
                  : {}
              }
            >
              {label}
              <span
                className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {count}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Orders Table or Empty State */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Belum ada pesanan
          </h2>
          <p className="text-gray-400">
            {activeStatus && activeStatus !== "all"
              ? "Tidak ada pesanan dengan status ini."
              : "Pesanan dari pembeli akan muncul di sini."}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {[
                    "ID Pesanan",
                    "Pembeli",
                    "Produk",
                    "Total",
                    "Status",
                    "Tanggal",
                    "Aksi",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-5 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((order) => {
                  const items = (order.items ?? []) as {
                    productName: string;
                    quantity: number;
                  }[];
                  return (
                    <tr key={order.id} className="hover:bg-gray-50 transition">
                      <td className="px-5 py-4 font-mono text-xs text-gray-400 whitespace-nowrap">
                        #{order.id.slice(-8).toUpperCase()}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-900">
                          {order.buyerName}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {order.buyerPhone}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-gray-600 max-w-[180px]">
                        <p className="truncate">
                          {items
                            .map((i) => `${i.quantity}× ${i.productName}`)
                            .join(", ")}
                        </p>
                      </td>
                      <td className="px-5 py-4 font-bold text-gray-900 whitespace-nowrap">
                        {formatRupiah(Number(order.total))}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
                            STATUS_BADGE[order.status] ??
                            "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {ORDER_STATUS_LABELS[order.status] ?? order.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-gray-400 whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-5 py-4">
                        <OrderActions order={order} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
