"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Seller } from "@/lib/schema";

export default function AgentToggle({ seller }: { seller: Seller }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function activate() {
    setLoading(true);
    await fetch("/api/agent/provision", { method: "POST" });
    router.refresh();
    setLoading(false);
  }

  async function deactivate() {
    setLoading(true);
    await fetch("/api/agent/provision", { method: "DELETE" });
    router.refresh();
    setLoading(false);
  }

  if (seller.agentStatus === "inactive") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-lg">⚫</div>
          <div>
            <p className="font-semibold text-gray-700 text-sm">Agen AI Nonaktif</p>
            <p className="text-xs text-gray-500">Belum menjawab pesan pembeli</p>
          </div>
        </div>
        <button
          onClick={activate}
          disabled={loading}
          className="w-full text-white py-3 px-4 rounded-xl text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50 shadow-sm"
          style={{ backgroundColor: '#E91E63' }}
        >
          {loading ? "Menyiapkan Agen..." : "🤖 Aktifkan Agen AI"}
        </button>
        <p className="text-xs text-gray-400 text-center">
          Agen akan otomatis menjawab pembeli via WhatsApp
        </p>
      </div>
    );
  }

  if (seller.agentStatus === "provisioning") {
    return (
      <div className="text-center py-4">
        <div className="text-4xl mb-3 animate-spin">⚙️</div>
        <p className="text-sm font-semibold text-yellow-700">Sedang menyiapkan agen...</p>
        <p className="text-xs text-gray-400 mt-1">Biasanya selesai dalam 10–30 detik</p>
      </div>
    );
  }

  if (seller.agentStatus === "active") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
          <div className="relative">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-lg">🤖</div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse" />
          </div>
          <div>
            <p className="font-semibold text-green-700 text-sm">🟢 Agen AI Aktif</p>
            <p className="text-xs text-green-600">Menjawab pesan pembeli otomatis via WhatsApp</p>
          </div>
        </div>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span>Menjawab pertanyaan produk otomatis</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span>Notifikasi pesanan baru</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-500">✓</span>
            <span>Ringkasan harian pukul 08:00</span>
          </div>
        </div>
        <button
          onClick={deactivate}
          disabled={loading}
          className="text-xs text-gray-400 hover:text-red-500 transition underline"
        >
          {loading ? "Menonaktifkan..." : "Nonaktifkan agen"}
        </button>
      </div>
    );
  }

  return null;
}
