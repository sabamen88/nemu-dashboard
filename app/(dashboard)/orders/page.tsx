export const dynamic = 'force-dynamic';

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { sellers, orders } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { formatRupiah, ORDER_STATUS_LABELS } from "@/lib/utils";

export default async function OrdersPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const seller = await db.query.sellers.findFirst({ where: eq(sellers.clerkUserId, userId) });
  if (!seller) redirect("/onboarding");

  const items = await db.query.orders.findMany({
    where: eq(orders.sellerId, seller.id),
    orderBy: [desc(orders.createdAt)],
    limit: 50,
  });

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    confirmed: "bg-blue-100 text-blue-700",
    shipped: "bg-purple-100 text-purple-700",
    done: "bg-green-100 text-green-700",
    cancelled: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Pesanan</h1>
        <p className="text-gray-500 mt-1">{items.filter((o) => o.status === "pending").length} pesanan menunggu konfirmasi</p>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Belum ada pesanan</h2>
          <p className="text-gray-500">Pesanan dari pembeli akan muncul di sini</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Pembeli</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Produk</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Waktu</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-sm">{order.buyerName}</div>
                    <div className="text-xs text-gray-400">{order.buyerPhone}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {(order.items as { quantity: number; productName: string }[])
                      .map((i) => `${i.quantity}× ${i.productName}`)
                      .join(", ")}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-sm">{formatRupiah(Number(order.total))}</div>
                    {order.isAgentOrder && <div className="text-xs text-blue-500">🤖 Agent</div>}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[order.status] ?? "bg-gray-100 text-gray-600"}`}>
                      {ORDER_STATUS_LABELS[order.status] ?? order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-400">
                    {new Date(order.createdAt).toLocaleDateString("id-ID")}
                  </td>
                  <td className="px-6 py-4">
                    {order.status === "pending" && (
                      <button className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition">
                        Konfirmasi
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
