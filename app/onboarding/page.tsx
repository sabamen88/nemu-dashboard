"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { CATEGORIES, generateSlug } from "@/lib/utils";

type Step = "store_name" | "category" | "description" | "done";

export default function OnboardingPage() {
  const { user } = useUser();
  const router = useRouter();
  const [step, setStep] = useState<Step>("store_name");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    storeName: "",
    category: "",
    description: "",
  });
  const [error, setError] = useState("");

  async function handleSubmit() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/seller", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeName: form.storeName,
          storeSlug: generateSlug(form.storeName),
          category: form.category,
          description: form.description,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setStep("done");
      setTimeout(() => router.push("/dashboard"), 1500);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🛍️</div>
          <h1 className="text-2xl font-bold text-gray-900">Selamat datang di Nemu AI!</h1>
          <p className="text-gray-500 mt-1">Mari setup toko kamu — hanya butuh 2 menit</p>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {["store_name", "category", "description"].map((s, i) => (
            <div
              key={s}
              className={`h-2 flex-1 rounded-full transition-colors ${
                ["store_name", "category", "description"].indexOf(step) >= i
                  ? "bg-blue-500"
                  : "bg-gray-200"
              }`}
            />
          ))}
        </div>

        {/* Steps */}
        {step === "store_name" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama toko kamu apa?
              </label>
              <input
                type="text"
                value={form.storeName}
                onChange={(e) => setForm({ ...form, storeName: e.target.value })}
                placeholder="contoh: Toko Baju Sari"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              {form.storeName && (
                <p className="text-xs text-gray-400 mt-1">
                  Link toko: nemu-ai.com/toko/{generateSlug(form.storeName)}
                </p>
              )}
            </div>
            <button
              onClick={() => form.storeName.length >= 3 && setStep("category")}
              disabled={form.storeName.length < 3}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              Lanjut →
            </button>
          </div>
        )}

        {step === "category" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Toko kamu jual apa?
              </label>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setForm({ ...form, category: cat })}
                    className={`px-3 py-2 rounded-xl text-sm text-left border transition ${
                      form.category === cat
                        ? "border-blue-500 bg-blue-50 text-blue-700 font-medium"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStep("store_name")}
                className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50"
              >
                ← Kembali
              </button>
              <button
                onClick={() => form.category && setStep("description")}
                disabled={!form.category}
                className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-40"
              >
                Lanjut →
              </button>
            </div>
          </div>
        )}

        {step === "description" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deskripsi singkat toko kamu (opsional)
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="contoh: Toko pakaian wanita premium, pengiriman seluruh Indonesia"
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex gap-3">
              <button
                onClick={() => setStep("category")}
                className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50"
              >
                ← Kembali
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-40"
              >
                {loading ? "Membuat toko..." : "Buat Toko 🎉"}
              </button>
            </div>
          </div>
        )}

        {step === "done" && (
          <div className="text-center space-y-4">
            <div className="text-6xl">🎉</div>
            <h2 className="text-xl font-bold">Toko kamu sudah siap!</h2>
            <p className="text-gray-500">Sedang membuka dashboard...</p>
          </div>
        )}
      </div>
    </div>
  );
}
