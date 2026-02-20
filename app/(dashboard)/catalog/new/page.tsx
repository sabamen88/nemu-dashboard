"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatRupiah, CATEGORIES } from "@/lib/utils";
import Link from "next/link";

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [error, setError] = useState("");
  const [uploadAvailable, setUploadAvailable] = useState<boolean | null>(null);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: "",
    category: CATEGORIES[0],
    price: "",
    stock: "1",
    weight: "",
    description: "",
  });

  useEffect(() => {
    fetch("/api/upload")
      .then((r) => r.json())
      .then((d: { available: boolean }) => setUploadAvailable(d.available))
      .catch(() => setUploadAvailable(false));
  }, []);

  function addImageUrl() {
    const url = newImageUrl.trim();
    if (!url) return;
    if (images.length >= 5) {
      setError("Maksimal 5 foto");
      return;
    }
    setImages((prev) => [...prev, url]);
    setNewImageUrl("");
    setError("");
  }

  function removeImage(i: number) {
    setImages(images.filter((_, j) => j !== i));
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (images.length >= 5) {
      setError("Maksimal 5 foto");
      return;
    }

    setError("");
    const slotIndex = images.length;
    setUploadingIndex(slotIndex);

    try {
      // Step 1: Get presigned upload URL
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      });
      if (!res.ok) throw new Error("Gagal mendapatkan URL upload");
      const { uploadUrl, publicUrl } = (await res.json()) as {
        uploadUrl: string;
        publicUrl: string;
      };

      // Step 2: PUT file to presigned URL
      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!putRes.ok) throw new Error("Gagal upload file");

      setImages((prev) => [...prev, publicUrl]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Gagal upload foto");
    } finally {
      setUploadingIndex(null);
      // Reset input so same file can be selected again
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
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
          price: Number(form.price.replace(/\D/g, "")),
          stock: Number(form.stock),
          weight: form.weight ? Number(form.weight) : undefined,
          description: form.description || undefined,
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

          {/* Current Images */}
          {(images.length > 0 || uploadingIndex !== null) && (
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
              {uploadingIndex !== null && (
                <div className="w-24 h-24 rounded-xl border-2 border-dashed border-pink-300 flex flex-col items-center justify-center gap-1 bg-pink-50">
                  <div className="w-5 h-5 border-2 border-pink-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-pink-500">Upload...</span>
                </div>
              )}
            </div>
          )}

          {images.length < 5 && (
            <div className="space-y-3">
              {/* File Upload Button (only shown when R2 is available) */}
              {uploadAvailable && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                    Upload File Foto
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                    disabled={uploadingIndex !== null}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingIndex !== null}
                    className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-600 hover:border-pink-400 hover:text-pink-600 hover:bg-pink-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploadingIndex !== null ? (
                      <>
                        <span className="w-4 h-4 border-2 border-pink-400 border-t-transparent rounded-full animate-spin" />
                        Mengupload...
                      </>
                    ) : (
                      <>
                        <span className="text-base">📁</span>
                        Pilih File dari Perangkat
                      </>
                    )}
                  </button>
                  <div className="my-3 flex items-center gap-3">
                    <div className="flex-1 h-px bg-gray-200" />
                    <span className="text-xs text-gray-400">atau</span>
                    <div className="flex-1 h-px bg-gray-200" />
                  </div>
                </div>
              )}

              {/* Add Image via URL */}
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
            </div>
          )}
          <p className="text-xs text-gray-400 mt-3">
            Maks 5 foto · {uploadAvailable ? "Upload file atau tempel URL gambar" : "Tempel URL gambar dari internet"}
          </p>
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
              placeholder="contoh: Kaos Polos Premium Cotton"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Kategori</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 bg-white"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
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
                onChange={(e) => {
                  const num = e.target.value.replace(/\D/g, "");
                  setForm({ ...form, price: num });
                }}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
                placeholder="85000"
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

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Berat (gram)</label>
            <input
              type="number"
              min="0"
              value={form.weight}
              onChange={(e) => setForm({ ...form, weight: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
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
                style={{ backgroundColor: "#E91E63" }}
              >
                {generatingDesc ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <span>✨</span> Generate Deskripsi AI
                  </>
                )}
              </button>
            </div>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={5}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 resize-none"
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
            style={{ backgroundColor: "#E91E63" }}
          >
            {loading ? "Menyimpan..." : "💾 Simpan Produk"}
          </button>
        </div>
      </form>
    </div>
  );
}
