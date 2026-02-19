"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { formatRupiah, CATEGORIES } from "@/lib/utils";
import Link from "next/link";

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: "",
    category: CATEGORIES[0],
    price: "",
    stock: "1",
    weight: "",
    description: "",
  });

  async function uploadFile(file: File) {
    if (!file.type.startsWith("image/")) return;
    setUploadingImage(true);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      });
      const { uploadUrl, publicUrl } = await res.json();
      await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      setImages((prev) => [...prev, publicUrl]);
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) await uploadFile(file);
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) await uploadFile(file);
  }

  async function generateDescription() {
    if (!form.name) {
      setError("Masukkan nama produk dulu sebelum generate deskripsi.");
      return;
    }
    setGeneratingDesc(true);
    setError("");
    try {
      const res = await fetch("/api/products/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, category: form.category }),
      });
      const data = await res.json();
      if (data.description) {
        setForm((f) => ({ ...f, description: data.description }));
      }
    } catch {
      setError("Gagal generate deskripsi. Coba lagi.");
    } finally {
      setGeneratingDesc(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          category: form.category,
          price: Number(form.price.replace(/\D/g, "")),
          stock: Number(form.stock),
          weight: form.weight ? Number(form.weight) : undefined,
          description: form.description,
          images,
          status: "active",
        }),
      });
      if (!res.ok) throw new Error("Gagal menyimpan produk");
      router.push("/catalog");
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
          <h1 className="text-2xl font-bold text-gray-900">Tambah Produk Baru</h1>
          <p className="text-gray-500 text-sm mt-0.5">Isi informasi produk dengan lengkap</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Image Upload */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-bold text-gray-900 mb-4">📷 Foto Produk</h2>
          <div className="flex gap-3 flex-wrap">
            {images.map((img, i) => (
              <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-gray-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImages(images.filter((_, j) => j !== i))}
                  className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center font-bold hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ))}
            {images.length < 5 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                disabled={uploadingImage}
                className={`w-24 h-24 rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition ${
                  dragOver
                    ? "border-pink-400 bg-pink-50"
                    : "border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100"
                } disabled:opacity-50`}
              >
                {uploadingImage ? (
                  <span className="text-gray-400 text-xs">Upload...</span>
                ) : (
                  <>
                    <span className="text-2xl">+</span>
                    <span className="text-xs text-gray-400 mt-0.5">Foto</span>
                  </>
                )}
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>
          <p className="text-xs text-gray-400 mt-3">Maks 5 foto · Format: JPG, PNG · Seret & lepas untuk upload</p>
        </div>

        {/* Product Details */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="font-bold text-gray-900">📝 Informasi Produk</h2>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nama Produk <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:border-transparent"
              style={{ '--tw-ring-color': '#E91E63' } as React.CSSProperties}
              placeholder="contoh: Kaos Polos Premium Cotton"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Kategori <span className="text-red-500">*</span></label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 bg-white"
              style={{ '--tw-ring-color': '#E91E63' } as React.CSSProperties}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Harga (Rp) <span className="text-red-500">*</span></label>
              <input
                type="text"
                inputMode="numeric"
                value={form.price}
                onChange={(e) => {
                  const num = e.target.value.replace(/\D/g, "");
                  setForm({ ...form, price: num });
                }}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': '#E91E63' } as React.CSSProperties}
                placeholder="85000"
                required
              />
              {priceNum > 0 && (
                <p className="text-xs text-gray-500 mt-1.5 font-medium" style={{ color: '#E91E63' }}>
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
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': '#E91E63' } as React.CSSProperties}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Berat (gram)</label>
            <input
              type="number"
              min="0"
              value={form.weight}
              onChange={(e) => setForm({ ...form, weight: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': '#E91E63' } as React.CSSProperties}
              placeholder="Misal: 250"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-semibold text-gray-700">Deskripsi Produk</label>
              <button
                type="button"
                onClick={generateDescription}
                disabled={generatingDesc || !form.name}
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg text-white transition hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: '#E91E63' }}
              >
                {generatingDesc ? (
                  <><span>⏳</span> Generating...</>
                ) : (
                  <><span>✨</span> Generate Deskripsi AI</>
                )}
              </button>
            </div>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={5}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 resize-none"
              style={{ '--tw-ring-color': '#E91E63' } as React.CSSProperties}
              placeholder="Deskripsikan produkmu — bahan, ukuran, keunggulan, dll. Atau klik ✨ Generate Deskripsi AI!"
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
            style={{ backgroundColor: '#E91E63' }}
          >
            {loading ? "Menyimpan..." : "💾 Simpan Produk"}
          </button>
        </div>
      </form>
    </div>
  );
}
