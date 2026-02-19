"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES, generateSlug } from "@/lib/utils";

type Step = "store_name" | "category" | "done";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("store_name");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ storeName: "", category: "" });
  const [error, setError] = useState("");

  async function handleSubmit() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/seller", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeName: form.storeName,
          storeSlug: generateSlug(form.storeName),
          category: form.category,
          onboardingComplete: true,
        }),
      });
      if (!res.ok) throw new Error("Gagal menyimpan");
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
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🛍️</div>
          <h1 className="text-2xl font-bold text-gray-900">Selamat datang di Nemu AI!</h1>
          <p className="text-gray-500 mt-1">Mari setup toko kamu — hanya butuh 1 menit</p>
        </div>

        {step === "store_name" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nama toko kamu apa?</label>
              <input type="text" value={form.storeName}
                onChange={(e) => setForm({ ...form, storeName: e.target.value })}
                placeholder="contoh: Toko Baju Sari"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus />
            </div>
            <button onClick={() => form.storeName.length >= 3 && setStep("category")}
              disabled={form.storeName.length < 3}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-40 transition">
              Lanjut →
            </button>
          </div>
        )}

        {step === "category" && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Toko kamu jual apa?</label>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map((cat) => (
                  <button key={cat} onClick={() => setForm({ ...form, category: cat })}
                    className={`px-3 py-2 rounded-xl text-sm text-left border transition ${
                      form.category === cat ? "border-blue-500 bg-blue-50 text-blue-700 font-medium" : "border-gray-200 hover:border-gray-300"
                    }`}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex gap-3">
              <button onClick={() => setStep("store_name")}
                className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50">
                ← Kembali
              </button>
              <button onClick={handleSubmit} disabled={!form.category || loading}
                className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 disabled:opacity-40">
                {loading ? "Membuat toko..." : "Buat Toko 🎉"}
              </button>
            </div>
          </div>
        )}

        {step === "done" && (
          <div className="text-center space-y-4">
            <div className="text-6xl">🎉</div>
            <h2 className="text-xl font-bold">Toko kamu sudah siap!</h2>
            <p className="text-gray-500">Membuka dashboard...</p>
          </div>
        )}
      </div>
    </div>
  );
}
