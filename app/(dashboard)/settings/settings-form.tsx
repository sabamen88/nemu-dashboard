"use client";

import { useState } from "react";
import type { Seller } from "@/lib/schema";
import { CATEGORIES } from "@/lib/utils";

export default function SettingsForm({ seller }: { seller: Seller }) {
  const [form, setForm] = useState({
    storeName: seller.storeName,
    description: seller.description ?? "",
    category: seller.category,
    phone: seller.phone ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const storeUrl = `nemu-ai.com/toko/${seller.storeSlug}`;

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    await fetch("/api/seller", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).catch(() => {});
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pengaturan Toko</h1>
        <p className="text-gray-500 mt-1">Kelola informasi dan konfigurasi toko kamu</p>
      </div>

      {/* Store Info */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
        <h2 className="font-bold text-gray-900 text-lg">🏪 Informasi Toko</h2>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nama Toko</label>
          <input
            type="text"
            value={form.storeName}
            onChange={(e) => setForm({ ...form, storeName: e.target.value })}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': '#E91E63' } as React.CSSProperties}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Deskripsi Toko</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 resize-none"
            style={{ '--tw-ring-color': '#E91E63' } as React.CSSProperties}
            placeholder="Ceritakan tentang toko kamu..."
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Kategori Toko</label>
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

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nomor WhatsApp Bisnis</label>
          <div className="flex gap-2">
            <span className="flex items-center px-3 bg-gray-50 border border-gray-200 border-r-0 rounded-l-xl text-sm text-gray-500">
              +62
            </span>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="flex-1 border border-gray-200 rounded-r-xl px-4 py-3 text-sm focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': '#E91E63' } as React.CSSProperties}
              placeholder="8123456789"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 text-white rounded-xl text-sm font-semibold transition hover:opacity-90 disabled:opacity-50 shadow-sm"
          style={{ backgroundColor: '#E91E63' }}
        >
          {saving ? "Menyimpan..." : saved ? "✅ Tersimpan!" : "💾 Simpan Perubahan"}
        </button>
      </div>

      {/* Store Link & Invite Code */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="font-bold text-gray-900 text-lg">🔗 Link & Kode Undangan</h2>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Link Toko</label>
          <div className="flex gap-2">
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700 font-mono">
              {storeUrl}
            </div>
            <button
              onClick={() => copyToClipboard(`https://${storeUrl}`)}
              className="px-4 py-3 text-white text-sm font-medium rounded-xl hover:opacity-90 transition flex-shrink-0"
              style={{ backgroundColor: '#E91E63' }}
            >
              📋 Salin
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1.5">Bagikan link ini ke calon pembeli kamu</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5">Kode Undangan</label>
          <div className="flex gap-2">
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono font-bold text-gray-800 tracking-widest text-center">
              {seller.inviteCode}
            </div>
            <button
              onClick={() => copyToClipboard(seller.inviteCode)}
              className="px-4 py-3 text-white text-sm font-medium rounded-xl hover:opacity-90 transition flex-shrink-0"
              style={{ backgroundColor: '#E91E63' }}
            >
              📋 Salin
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1.5">Undang seller lain ke Nemu AI</p>
        </div>
      </div>

      {/* Wallet Address */}
      {seller.agentWalletAddress && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="font-bold text-gray-900 text-lg">💰 Wallet Agent AI</h2>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Alamat Wallet (Base)</label>
            <div className="flex gap-2">
              <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs font-mono text-gray-600 break-all">
                {seller.agentWalletAddress}
              </div>
              <button
                onClick={() => copyToClipboard(seller.agentWalletAddress!)}
                className="px-4 py-3 text-white text-sm font-medium rounded-xl hover:opacity-90 transition flex-shrink-0"
                style={{ backgroundColor: '#E91E63' }}
              >
                📋 Salin
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1.5">Wallet untuk menerima pembayaran via agent AI (USDC · Base)</p>
          </div>
        </div>
      )}

      {/* Founding Seller */}
      {seller.isFoundingSeller && (
        <div className="rounded-2xl p-5 text-white"
          style={{ background: 'linear-gradient(135deg, #E91E63, #C2185B)' }}>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">🏆</span>
            <p className="font-bold text-lg">Founding Seller</p>
          </div>
          <p className="text-pink-100 text-sm">
            Selamat! Kamu adalah bagian dari komunitas founding seller Nemu AI. 
            Nikmati komisi 0%, akses beta fitur eksklusif, dan badge Founding Seller di toko kamu.
          </p>
        </div>
      )}

      {/* Danger Zone */}
      <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-6 space-y-4">
        <h2 className="font-bold text-red-700 text-lg">⚠️ Integrasi WhatsApp</h2>
        <p className="text-gray-500 text-sm">
          Hubungkan nomor WhatsApp bisnis kamu ke Nemu AI untuk mengaktifkan fitur agen AI dan terima pesan pembeli langsung di dashboard.
        </p>
        <button
          disabled
          className="w-full py-3 text-gray-400 border border-gray-200 rounded-xl text-sm font-medium cursor-not-allowed bg-gray-50"
        >
          📱 Hubungkan WhatsApp (Segera Hadir)
        </button>
      </div>
    </div>
  );
}
