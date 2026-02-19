import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { sellers, products } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { formatRupiah } from "@/lib/utils";
import { Plus, Package } from "lucide-react";

export default async function CatalogPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const seller = await db.query.sellers.findFirst({ where: eq(sellers.clerkUserId, userId) });
  if (!seller) redirect("/onboarding");

  const items = await db.query.products.findMany({
    where: eq(products.sellerId, seller.id),
    orderBy: [desc(products.createdAt)],
  });

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Katalog Produk</h1>
          <p className="text-gray-500 mt-1">{items.length} produk terdaftar</p>
        </div>
        <Link
          href="/catalog/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition"
        >
          <Plus className="w-4 h-4" />
          Tambah Produk
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
          <div className="text-6xl mb-4">📦</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Belum ada produk</h2>
          <p className="text-gray-500 mb-6">Tambah produk pertama kamu untuk mulai berjualan</p>
          <Link
            href="/catalog/new"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition"
          >
            <Plus className="w-4 h-4" />
            Tambah Produk Pertama
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((product) => (
            <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">
              {/* Image */}
              <div className="aspect-square bg-gray-100 relative">
                {(product.images as string[]).length > 0 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={(product.images as string[])[0]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-12 h-12 text-gray-300" />
                  </div>
                )}
                <div className={`absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full font-medium ${
                  product.status === "active" ? "bg-green-100 text-green-700" :
                  product.status === "draft" ? "bg-yellow-100 text-yellow-700" :
                  "bg-gray-100 text-gray-600"
                }`}>
                  {product.status === "active" ? "Aktif" : product.status === "draft" ? "Draft" : "Arsip"}
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
                <div className="flex items-center justify-between mt-2">
                  <span className="font-bold text-blue-600">{formatRupiah(Number(product.price))}</span>
                  <span className="text-xs text-gray-400">Stok: {product.stock}</span>
                </div>
                <div className="flex gap-2 mt-3">
                  <button className="flex-1 text-xs border border-gray-200 text-gray-600 py-1.5 rounded-lg hover:bg-gray-50 transition">
                    Edit
                  </button>
                  <button className="flex-1 text-xs border border-red-100 text-red-500 py-1.5 rounded-lg hover:bg-red-50 transition">
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
