"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatRupiah } from "@/lib/utils";
import type { Product } from "@/lib/schema";

interface Props {
  products: Product[];
  filter?: string;
}

export default function CatalogGrid({ products, filter }: Props) {
  const router = useRouter();
  const [deleting, setDeleting] = useState<string | null>(null);

  const filtered = products.filter((p) => {
    if (filter === "active") return p.status === "active" && p.stock > 0;
    if (filter === "out") return p.stock === 0;
    return true;
  });

  async function handleDelete(id: string) {
    if (!confirm("Hapus produk ini? Tindakan ini tidak bisa dibatalkan.")) return;
    setDeleting(id);
    await fetch(`/api/products/${id}`, { method: "DELETE" });
    router.refresh();
    setDeleting(null);
  }

  if (filtered.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
        <div className="text-6xl mb-4">📦</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          {filter ? "Tidak ada produk dengan filter ini" : "Belum ada produk"}
        </h2>
        <p className="text-gray-400 mb-6">
          {filter
            ? "Coba pilih filter lain atau tambah produk baru."
            : "Tambah produk pertama kamu untuk mulai berjualan!"}
        </p>
        {!filter && (
          <Link
            href="/catalog/new"
            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white rounded-xl hover:opacity-90 transition"
            style={{ backgroundColor: '#E91E63' }}
          >
            ✨ Tambah Produk Pertama
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {filtered.map((product) => {
        const imgs = product.images as string[];
        const isOutOfStock = product.stock === 0;

        return (
          <div
            key={product.id}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow group"
          >
            {/* Image */}
            <div className="aspect-square bg-gray-100 relative overflow-hidden">
              {imgs.length > 0 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imgs[0]}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                  <span className="text-4xl">📷</span>
                  <span className="text-xs mt-1">No Image</span>
                </div>
              )}
              {/* Stock badge */}
              <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
                isOutOfStock
                  ? "bg-red-500 text-white"
                  : "bg-green-500 text-white"
              }`}>
                {isOutOfStock ? "Habis" : `Stok: ${product.stock}`}
              </div>
            </div>

            {/* Info */}
            <div className="p-3">
              <p className="font-semibold text-gray-900 text-sm truncate">{product.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">Stok: {product.stock} pcs</p>
              <p className="font-bold text-base mt-1" style={{ color: '#E91E63' }}>
                {formatRupiah(Number(product.price))}
              </p>
            </div>

            {/* Actions */}
            <div className="px-3 pb-3 flex gap-2">
              <Link
                href={`/catalog/${product.id}/edit`}
                className="flex-1 text-center py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                ✏️ Edit
              </Link>
              <button
                onClick={() => handleDelete(product.id)}
                disabled={deleting === product.id}
                className="flex-1 text-center py-1.5 text-xs font-medium text-red-500 border border-red-100 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
              >
                {deleting === product.id ? "..." : "🗑️ Hapus"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
