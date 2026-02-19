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
      <div>
        <p className="text-sm text-gray-500 mb-4">
          Aktifkan AI agent untuk menjawab pesan pembeli otomatis di WhatsApp.
        </p>
        <button
          onClick={activate}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2.5 px-4 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {loading ? "Menyiapkan..." : "🤖 Aktifkan AI Agent"}
        </button>
      </div>
    );
  }

  if (seller.agentStatus === "provisioning") {
    return (
      <div className="text-center py-4">
        <div className="animate-spin text-3xl mb-2">⚙️</div>
        <p className="text-sm text-yellow-700 font-medium">Sedang menyiapkan agent...</p>
        <p className="text-xs text-gray-400 mt-1">Biasanya selesai dalam 10 detik</p>
      </div>
    );
  }

  if (seller.agentStatus === "active") {
    return (
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm font-medium text-green-700">Agent Aktif</span>
        </div>
        <button
          onClick={deactivate}
          disabled={loading}
          className="text-xs text-gray-400 hover:text-red-500 transition"
        >
          {loading ? "Menonaktifkan..." : "Nonaktifkan agent"}
        </button>
      </div>
    );
  }

  return null;
}
