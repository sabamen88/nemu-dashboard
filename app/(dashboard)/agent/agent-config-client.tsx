"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Seller } from "@/lib/schema";

interface Props {
  seller: Seller;
  agentMsgToday: number;
  flowiseUrl: string;
}

function StatusBadge({ status }: { status: string }) {
  const configs = {
    active: { bg: "bg-green-50", border: "border-green-200", text: "text-green-700", dot: "bg-green-500", label: "Aktif" },
    provisioning: { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-700", dot: "bg-yellow-500", label: "Menyiapkan..." },
    inactive: { bg: "bg-gray-50", border: "border-gray-200", text: "text-gray-500", dot: "bg-gray-400", label: "Nonaktif" },
    error: { bg: "bg-red-50", border: "border-red-200", text: "text-red-600", dot: "bg-red-500", label: "Error" },
  };
  const c = configs[status as keyof typeof configs] ?? configs.inactive;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${c.bg} ${c.border} ${c.text}`}>
      <span className={`w-2 h-2 rounded-full ${c.dot} ${status === "active" ? "animate-pulse" : ""}`} />
      {c.label}
    </span>
  );
}

export default function AgentConfigClient({ seller, agentMsgToday, flowiseUrl }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [savingPrompt, setSavingPrompt] = useState(false);
  const [customPrompt, setCustomPrompt] = useState(seller.aiCustomPrompt ?? "");
  const [promptSaved, setPromptSaved] = useState(false);
  const [error, setError] = useState("");
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"idle" | "success" | "error">("idle");

  const isActive = seller.agentStatus === "active";
  const chatflowId = (seller as Record<string, unknown>).agentChatflowId as string | undefined;
  const chatbotUrl = flowiseUrl && chatflowId ? `${flowiseUrl}/chatbot/${chatflowId}` : null;

  async function handleActivate() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/agent/provision", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengaktifkan agen");
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeactivate() {
    setLoading(true);
    setError("");
    try {
      await fetch("/api/agent/provision", { method: "DELETE" });
      router.refresh();
    } catch {
      setError("Gagal menonaktifkan agen");
    } finally {
      setLoading(false);
    }
  }

  async function handleSavePrompt() {
    setSavingPrompt(true);
    setPromptSaved(false);
    try {
      const res = await fetch("/api/seller", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aiCustomPrompt: customPrompt || null }),
      });
      if (!res.ok) throw new Error("Gagal menyimpan");
      setPromptSaved(true);
      setTimeout(() => setPromptSaved(false), 3000);
    } catch {
      setError("Gagal menyimpan kepribadian AI");
    } finally {
      setSavingPrompt(false);
    }
  }

  async function handleSyncCatalog() {
    setSyncLoading(true);
    setSyncStatus("idle");
    setError("");
    try {
      await fetch("/api/agent/provision", { method: "DELETE" });
      const res = await fetch("/api/agent/provision", { method: "POST" });
      if (!res.ok) throw new Error("Gagal sinkronisasi katalog");
      setSyncStatus("success");
      setTimeout(() => setSyncStatus("idle"), 4000);
      router.refresh();
    } catch (e: unknown) {
      setSyncStatus("error");
      setError(e instanceof Error ? e.message : "Gagal menyinkronkan katalog");
      setTimeout(() => setSyncStatus("idle"), 4000);
    } finally {
      setSyncLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">🤖 Konfigurasi Agen AI</h1>
        <p className="text-sm text-gray-500 mt-1">
          Kelola asisten AI yang menjawab pertanyaan penjual dan pembeli secara otomatis.
        </p>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
          ⚠️ {error}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 mb-1">Status Agen</p>
          <StatusBadge status={seller.agentStatus} />
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 mb-1">Pesan dijawab hari ini</p>
          <p className="text-2xl font-bold text-gray-900">{agentMsgToday}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 mb-1">Model AI</p>
          <p className="text-sm font-semibold text-gray-700">MiniMax M2.5</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 mb-1">Engine</p>
          <p className="text-sm font-semibold text-gray-700">
            {chatflowId ? "Flowise" : "Direct API"}
          </p>
        </div>
      </div>

      {/* Agent Status Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Status & Kontrol Agen</h2>

        {isActive ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="relative">
                <span className="text-2xl">🤖</span>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-green-700 text-sm">Agen AI Aktif</p>
                <p className="text-xs text-green-600">
                  {chatflowId
                    ? `Chatflow ID: ${chatflowId.substring(0, 8)}...`
                    : "Mode demo — tanpa Flowise"}
                </p>
              </div>
              <StatusBadge status="active" />
            </div>

            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="flex items-center gap-2 text-green-600">
                <span>✓</span><span>Menjawab pertanyaan produk</span>
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <span>✓</span><span>Cek pesanan otomatis</span>
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <span>✓</span><span>Statistik toko real-time</span>
              </div>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <button
                onClick={handleDeactivate}
                disabled={loading || syncLoading}
                className="text-xs text-gray-400 hover:text-red-500 transition underline"
              >
                {loading ? "Menonaktifkan..." : "Nonaktifkan agen"}
              </button>
              <button
                onClick={handleSyncCatalog}
                disabled={loading || syncLoading}
                className="text-xs px-3 py-1.5 rounded-lg border font-medium transition hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
                style={{
                  borderColor: syncStatus === "success" ? "#22c55e" : "#4f39f6",
                  color: syncStatus === "success" ? "#22c55e" : "#4f39f6",
                  backgroundColor:
                    syncStatus === "success"
                      ? "#f0fdf4"
                      : syncStatus === "error"
                      ? "#fff1f2"
                      : "white",
                }}
              >
                {syncLoading ? (
                  <>
                    <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Menyinkronkan...
                  </>
                ) : syncStatus === "success" ? (
                  "✓ Katalog tersinkron!"
                ) : (
                  "🔄 Sync Katalog"
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-xl">
              <span className="text-2xl">⚫</span>
              <div>
                <p className="font-semibold text-gray-700 text-sm">Agen AI Nonaktif</p>
                <p className="text-xs text-gray-400">Klik tombol di bawah untuk mengaktifkan</p>
              </div>
            </div>

            <button
              onClick={handleActivate}
              disabled={loading || seller.agentStatus === "provisioning"}
              className="w-full text-white py-3 px-4 rounded-xl text-sm font-semibold transition hover:opacity-90 disabled:opacity-50 shadow-sm"
              style={{ backgroundColor: "#4f39f6" }}
            >
              {loading || seller.agentStatus === "provisioning"
                ? "⏳ Menyiapkan Agen..."
                : "🚀 Aktifkan Agen AI"}
            </button>

            <p className="text-xs text-gray-400 text-center">
              Agen akan langsung aktif dan siap menjawab pertanyaan
            </p>
          </div>
        )}
      </div>

      {/* Test Agent Panel */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-2">
          🧪 Test Agen AI
          {!chatflowId && (
            <span className="ml-2 text-xs font-normal text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              Mode Demo
            </span>
          )}
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          {chatbotUrl
            ? "Agen AI kamu berjalan di Flowise. Test langsung di bawah ini."
            : "Chat dengan agen AI langsung dari sini. Gunakan tombol chat di pojok kanan bawah."}
        </p>

        {chatbotUrl ? (
          <iframe
            src={chatbotUrl}
            className="w-full rounded-xl border border-gray-200"
            style={{ height: "500px" }}
            title="Nemu Agent AI"
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-4 py-8 bg-gray-50 rounded-xl border border-dashed border-gray-300">
            <span className="text-4xl">💬</span>
            <div className="text-center">
              <p className="font-medium text-gray-700">Chat widget tersedia di semua halaman</p>
              <p className="text-sm text-gray-400 mt-1">Klik ikon chat di pojok kanan bawah untuk mulai</p>
            </div>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent("open-chat-widget"))}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white transition hover:opacity-90"
              style={{ backgroundColor: "#4f39f6" }}
            >
              💬 Buka Chat Sekarang
            </button>
          </div>
        )}
      </div>

      {/* Kepribadian AI */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-1">🎭 Kepribadian AI</h2>
        <p className="text-sm text-gray-500 mb-4">
          Kustomisasi cara agen AI berbicara. Kosongkan untuk menggunakan template bawaan Nemu.
        </p>

        <textarea
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          placeholder={`Contoh:
Kamu adalah asisten AI untuk toko "${seller.storeName}".
Selalu sapa pembeli dengan "Halo kak!" dan berbicara dengan nada ramah.
Fokus pada produk [kategori toko] dan berikan rekomendasi yang personal.`}
          rows={8}
          className="w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:border-transparent resize-none font-mono"
          style={{ focusRingColor: "#4f39f6" } as React.CSSProperties}
        />

        <div className="flex items-center justify-between mt-3">
          <p className="text-xs text-gray-400">
            {customPrompt.length} karakter{customPrompt.length > 2000 ? " (terlalu panjang — maks 2000)" : ""}
          </p>
          <button
            onClick={handleSavePrompt}
            disabled={savingPrompt || customPrompt.length > 2000}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: "#4f39f6" }}
          >
            {savingPrompt ? "Menyimpan..." : promptSaved ? "✓ Tersimpan!" : "Simpan Kepribadian AI"}
          </button>
        </div>

        {customPrompt && (
          <button
            onClick={() => setCustomPrompt("")}
            className="mt-2 text-xs text-gray-400 hover:text-gray-600 transition underline"
          >
            Reset ke template bawaan
          </button>
        )}
      </div>

      {/* Technical Info (collapsed by default) */}
      {chatflowId && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-3">🔧 Info Teknis</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">Flowise Chatflow ID</span>
              <span className="font-mono text-gray-700 text-xs">{chatflowId}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">Flowise URL</span>
              <a href={flowiseUrl} target="_blank" rel="noopener" className="text-indigo-500 hover:underline text-xs">
                {flowiseUrl}
              </a>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">Seller ID</span>
              <span className="font-mono text-gray-700 text-xs">{seller.id.substring(0, 16)}...</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
