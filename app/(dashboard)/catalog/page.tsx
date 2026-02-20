export const dynamic = 'force-dynamic';

import { getDemoSeller } from "@/lib/demo-session";
import { db } from "@/lib/db";
import { products } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { formatRupiah } from "@/lib/utils";
import Link from "next/link";
import CatalogGrid from "./catalog-grid";
import CsvImportButton from "./csv-import";

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  const seller = await getDemoSeller();

  const allProducts = await db.query.products.findMany({
    where: eq(products.sellerId, seller.id),
    orderBy: [desc(products.createdAt)],
  });

  const activeCount = allProducts.filter(p => p.status === "active" && p.stock > 0).length;
  const outOfStockCount = allProducts.filter(p => p.stock === 0).length;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Katalog Produk</h1>
          <p className="text-gray-500 mt-1">{allProducts.length} produk terdaftar</p>
        </div>
        <div className="flex items-center gap-3">
          <CsvImportButton />
          <Link
            href="/catalog/new"
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white rounded-xl shadow-sm hover:opacity-90 transition"
            style={{ backgroundColor: '#4f39f6' }}
          >
            <span>+</span> Tambah Produk
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {[
          { key: undefined, label: "Semua", count: allProducts.length },
          { key: "active", label: "Aktif", count: activeCount },
          { key: "out", label: "Habis Stok", count: outOfStockCount },
        ].map(({ key, label, count }) => {
          const isActive = filter === key || (!filter && !key);
          return (
            <Link
              key={label}
              href={key ? `/catalog?filter=${key}` : "/catalog"}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
                isActive
                  ? "text-white border-transparent shadow-sm"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
              style={isActive ? { backgroundColor: '#4f39f6', borderColor: '#4f39f6' } : {}}
            >
              {label}
              <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${
                isActive ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
              }`}>
                {count}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Grid */}
      <CatalogGrid products={allProducts} filter={filter} />
    </div>
  );
}
