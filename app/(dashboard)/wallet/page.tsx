"use client";

export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";

interface WalletBalance {
  address: string;
  eth: string;
  usdc: string;
  usdValue: string;
}

interface WalletTx {
  hash: string;
  type: "send" | "receive";
  amount: string;
  currency: string;
  counterparty: string;
  timestamp: string;
  status: string;
}

function truncateAddress(addr: string) {
  if (!addr || addr.length < 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatUSDC(amount: string) {
  const n = parseFloat(amount);
  if (isNaN(n)) return "0.00";
  return n.toFixed(2);
}

export default function WalletPage() {
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<WalletTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // Send form
  const [sendTo, setSendTo] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ ok?: boolean; error?: string } | null>(null);

  const fetchWallet = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/wallet");
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Gagal memuat wallet");
      }
      const data = await res.json();
      setBalance(data.balance);
      setTransactions(data.transactions ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  async function handleCopy() {
    if (!balance?.address) return;
    await navigator.clipboard.writeText(balance.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setSendResult(null);
    try {
      const res = await fetch("/api/wallet/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: sendTo, amount: sendAmount }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || "Transfer gagal");
      setSendResult({ ok: true });
      setSendTo("");
      setSendAmount("");
      // Refresh balance after send
      setTimeout(fetchWallet, 3000);
    } catch (e: unknown) {
      setSendResult({ error: e instanceof Error ? e.message : "Error" });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">💰 Nemu Wallet</h1>
        <p className="text-gray-500 mt-1">Kelola saldo USDC agen kamu di Base Sepolia</p>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin mb-4" />
          <p className="text-gray-500">Memuat wallet...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <p className="font-semibold text-red-700 mb-1">Gagal memuat wallet</p>
          <p className="text-sm text-red-500">{error}</p>
          <button
            onClick={fetchWallet}
            className="mt-4 px-4 py-2 text-sm font-semibold text-white rounded-xl hover:opacity-90"
            style={{ backgroundColor: "#E91E63" }}
          >
            Coba Lagi
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Balance Card */}
            <div
              className="lg:col-span-2 rounded-2xl p-6 text-white relative overflow-hidden"
              style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)" }}
            >
              {/* Decorative circles */}
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10"
                style={{ background: "radial-gradient(circle, #E91E63, transparent)", transform: "translate(30%, -30%)" }} />
              <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10"
                style={{ background: "radial-gradient(circle, #E91E63, transparent)", transform: "translate(-30%, 30%)" }} />

              <div className="relative">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">N</div>
                  <span className="text-sm text-white/70 font-medium">Nemu Agent Wallet</span>
                  <span className="ml-auto text-xs bg-blue-500/30 text-blue-200 px-2 py-1 rounded-full border border-blue-400/30">
                    Base Sepolia
                  </span>
                </div>

                <div className="mb-6">
                  <p className="text-white/50 text-xs mb-1 uppercase tracking-wider">Saldo USDC</p>
                  <p className="text-5xl font-bold tracking-tight">
                    {formatUSDC(balance?.usdc ?? "0")}
                    <span className="text-2xl ml-2 text-white/60">USDC</span>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-white/50 text-xs mb-1 uppercase tracking-wider">Alamat Wallet</p>
                    <p className="font-mono text-sm text-white/80">{truncateAddress(balance?.address ?? "")}</p>
                  </div>
                  <button
                    onClick={handleCopy}
                    className="ml-auto flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition text-white/80"
                  >
                    {copied ? "✓ Disalin!" : "📋 Salin"}
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-3">
              {/* Request Funding */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-bold text-gray-900 mb-2 text-sm">🪙 Isi Saldo (Testnet)</h3>
                <p className="text-xs text-gray-500 mb-4">
                  Minta saldo USDC testnet untuk mencoba fitur agen AI.
                </p>
                <button
                  onClick={async () => {
                    try {
                      await fetch("/api/wallet/send", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ to: balance?.address, amount: "0", _action: "fund" }),
                      });
                    } catch {}
                    alert("Permintaan funding dikirim ke pemilik wallet 🎉");
                  }}
                  className="w-full py-2.5 text-sm font-semibold text-white rounded-xl transition hover:opacity-90"
                  style={{ backgroundColor: "#E91E63" }}
                >
                  🚀 Minta Dana Testnet
                </button>
              </div>

              {/* Network Info */}
              <div className="bg-blue-50 rounded-2xl border border-blue-100 p-5">
                <h3 className="font-bold text-blue-900 mb-2 text-sm">ℹ️ Info Jaringan</h3>
                <div className="space-y-1.5 text-xs text-blue-700">
                  <div className="flex justify-between">
                    <span className="text-blue-500">Jaringan</span>
                    <span className="font-medium">Base Sepolia (Testnet)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-500">Token</span>
                    <span className="font-medium">USDC</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-500">ETH</span>
                    <span className="font-medium">{parseFloat(balance?.eth ?? "0").toFixed(4)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Send USDC */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-bold text-gray-900 mb-4">📤 Kirim USDC</h2>

              <form onSubmit={handleSend} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Alamat Penerima (0x...)
                  </label>
                  <input
                    type="text"
                    value={sendTo}
                    onChange={(e) => setSendTo(e.target.value)}
                    placeholder="0x742d35Cc6634C0532925a3b8..."
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-pink-300"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Jumlah (USDC)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={sendAmount}
                      onChange={(e) => setSendAmount(e.target.value)}
                      placeholder="10.00"
                      className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 pr-16"
                      required
                    />
                    <span className="absolute right-4 top-3 text-sm font-semibold text-gray-400">USDC</span>
                  </div>
                </div>

                {sendResult && (
                  <div className={`rounded-xl px-4 py-3 text-sm ${sendResult.ok ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"}`}>
                    {sendResult.ok ? "✅ Transfer berhasil! Saldo diperbarui dalam beberapa detik." : `⚠️ ${sendResult.error}`}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={sending || !sendTo || !sendAmount}
                  className="w-full py-3 text-sm font-semibold text-white rounded-xl transition hover:opacity-90 disabled:opacity-40"
                  style={{ backgroundColor: "#E91E63" }}
                >
                  {sending ? "Memproses transfer..." : "📤 Kirim USDC"}
                </button>
              </form>

              <p className="text-xs text-gray-400 mt-4 text-center">
                Transfer di Base Sepolia testnet · Gas disponsori otomatis
              </p>
            </div>

            {/* Transaction History */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900">📋 Riwayat Transaksi</h2>
                <button
                  onClick={fetchWallet}
                  className="text-xs text-gray-400 hover:text-gray-600 transition"
                >
                  🔄 Refresh
                </button>
              </div>

              {transactions.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-3">📭</div>
                  <p className="font-semibold text-gray-600 text-sm">Belum ada transaksi</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Transaksi akan muncul di sini setelah ada aktivitas
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {transactions.map((tx) => (
                    <div key={tx.hash} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-lg ${
                        tx.type === "receive" ? "bg-green-100" : "bg-red-100"
                      }`}>
                        {tx.type === "receive" ? "📥" : "📤"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800">
                          {tx.type === "receive" ? "Diterima" : "Dikirim"}
                        </p>
                        <p className="text-xs text-gray-400 truncate font-mono">
                          {truncateAddress(tx.counterparty)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${tx.type === "receive" ? "text-green-600" : "text-red-500"}`}>
                          {tx.type === "receive" ? "+" : "-"}{tx.amount} {tx.currency}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(tx.timestamp).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Full Address */}
      {balance && (
        <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4">
          <p className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Alamat Lengkap Wallet Agen</p>
          <div className="flex items-center gap-3">
            <p className="font-mono text-sm text-gray-700 break-all flex-1">{balance.address}</p>
            <button
              onClick={handleCopy}
              className="flex-shrink-0 text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-white transition"
            >
              {copied ? "✓" : "📋"}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Powered by PaySponge · Agent ID: 418fe093-4f1e-428a-a0e7-847ffd56b9e6
          </p>
        </div>
      )}
    </div>
  );
}
