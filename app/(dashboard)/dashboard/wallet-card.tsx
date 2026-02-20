"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function WalletCard() {
  const [usdc, setUsdc] = useState<string | null>(null);
  const [address, setAddress] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/wallet")
      .then((r) => r.json())
      .then((d) => {
        if (d.balance) {
          setUsdc(d.balance.usdc ?? "0");
          setAddress(d.balance.address ?? "");
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const truncate = (addr: string) =>
    addr.length > 10 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : addr;

  return (
    <Link
      href="/wallet"
      className="group relative overflow-hidden rounded-2xl p-5 text-white transition-all hover:shadow-lg"
      style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)" }}
    >
      {/* Glow */}
      <div
        className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-20 group-hover:opacity-30 transition-opacity"
        style={{
          background: "radial-gradient(circle, #E91E63, transparent)",
          transform: "translate(30%, -30%)",
        }}
      />
      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-base">
            💰
          </div>
          <span className="text-xs font-medium text-white/60">Nemu Wallet</span>
          <span className="ml-auto text-xs bg-blue-500/30 text-blue-200 px-2 py-0.5 rounded-full border border-blue-400/30">
            Base Sepolia
          </span>
        </div>

        {loading ? (
          <div className="h-8 w-24 bg-white/10 rounded-lg animate-pulse mb-2" />
        ) : (
          <p className="text-2xl font-bold mb-1">
            {parseFloat(usdc ?? "0").toFixed(2)}
            <span className="text-sm ml-1 text-white/50">USDC</span>
          </p>
        )}

        {address && (
          <p className="text-xs text-white/40 font-mono">{truncate(address)}</p>
        )}

        <div className="mt-3 flex items-center gap-1 text-xs text-pink-300 group-hover:text-pink-200 transition">
          <span>Kelola wallet →</span>
        </div>
      </div>
    </Link>
  );
}
