"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatRupiah } from "@/lib/utils";
import Link from "next/link";
import type { Product } from "@/lib/schema";

export default function EditProductForm({ product }: { product: Product }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [images, setImages] = useState<string[]>((product.images as string[]) ?? []);
  const [newImageUrl, setNewImageUrl] = useState("");

  const [form, setForm] = useState({
    name: product.name,
    price: String(Math.round(Number(product.price))),
    stock: String(product.stock),
    weight: product.weight ? String(product.weight) : "",
    description: product.description ?? "",
    status: product.status,
  });

  function addImageUrl() {
    const url = newImageUrl.trim();
    if (!url) return;
    if (images.length >= 5) {
      setError("Maksimal 5 foto");
      return;
    }
    setImages((prev) => [...prev, url]);
    setNewImageUrl("");
  }

  function removeImage(i: number) {
    setImages(images.filter((_, j) => j !== i));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          price: Number(form.price.replace(/\D/g, "")),
          stock: Number(form.stock),
          weight: form.weight ? Number(form.weight) : null,
          description: form.description || null,
          images,
          status: form.status,
        }),
      });
      if (!res.ok) throw new Error("Gagal menyimpan perubahan");
      router.push("/catalog");
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  const priceNum = Number(form.price.replace(/\D/g, ""));

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/catalog" className="p-2 rounded-xl hover:bg-gray-100 transition text-gray-500">
          ←
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Produk</h1>
          <p className="text-gray-500 text-sm mt-0.5">Perbarui informasi produk kamu</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Image Section */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-bold text-gray-900 mb-4">📷 Foto Produk</h2>

          {/* Current Images */}
          {images.length > 0 && (
            <div className="flex gap-3 flex-wrap mb-4">
              {images.map((img, i) => (
                <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-gray-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center font-bold hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add Image via URL */}
          {images.length < 5 && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                Tambah Foto via URL
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="https://example.com/foto-produk.jpg"
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addImageUrl())}
                />
                <button
                  type="button"
                  onClick={addImageUrl}
                  disabled={!newImageUrl.trim()}
                  className="px-4 py-2.5 text-sm font-semibold text-white rounded-xl transition hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: "#E91E63" }}
                >
                  + Tambah
                </button>
              </div>
            </div>
          )}
          <p className="text-xs text-gray-400 mt-3">Maks 5 foto · Tempel URL gambar dari internet</p>
        </div>

        {/* Product Details */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="font-bold text-gray-900">📝 Informasi Produk</h2>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Nama Produk <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Harga (Rp) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value.replace(/\D/g, "") })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                required
              />
              {priceNum > 0 && (
                <p className="text-xs mt-1.5 font-medium" style={{ color: "#E91E63" }}>
                  {formatRupiah(priceNum)}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Stok</label>
              <input
                type="number"
                min="0"
                value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Berat (gram)</label>
              <input
                type="number"
                min="0"
                value={form.weight}
                onChange={(e) => setForm({ ...form, weight: e.target.value })}
                placeholder="Contoh: 250"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 bg-white"
              >
                <option value="active">Aktif</option>
                <option value="draft">Draft</option>
                <option value="archived">Arsip</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Deskripsi Produk</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={5}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 resize-none"
              placeholder="Deskripsi produk..."
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
            ⚠️ {error}
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 pb-6">
          <Link
            href="/catalog"
            className="flex-1 text-center border border-gray-200 text-gray-600 py-3.5 rounded-xl font-semibold hover:bg-gray-50 transition"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={loading || !form.name || !form.price}
            className="flex-1 text-white py-3.5 rounded-xl font-semibold transition hover:opacity-90 disabled:opacity-40 shadow-sm"
            style={{ backgroundColor: "#E91E63" }}
          >
            {loading ? "Menyimpan..." : "💾 Simpan Perubahan"}
          </button>
        </div>
      </form>
    </div>
  );
}
