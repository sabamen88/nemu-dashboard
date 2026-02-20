"use client";

import { useState } from "react";

interface SellerIdentityCardProps {
  storeName: string;
  storeSlug: string;
  tokoId: string | null;
  inviteCode: string;
  isFoundingSeller: boolean;
}

export default function SellerIdentityCard({
  storeName,
  storeSlug,
  tokoId,
  inviteCode,
  isFoundingSeller,
}: SellerIdentityCardProps) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    const id = tokoId ?? storeSlug;
    navigator.clipboard.writeText(id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-5">
      {/* Store avatar — first letter of store name */}
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-black text-white flex-shrink-0 select-none"
        style={{ background: "linear-gradient(135deg, #7B5CF0, #625fff)" }}
      >
        {storeName[0]?.toUpperCase() ?? "N"}
      </div>

      <div className="flex-1 min-w-0">
        {/* Store name + founding seller badge */}
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-lg font-bold text-gray-900 truncate">{storeName}</h2>
          {isFoundingSeller && (
            <span
              className="text-xs px-2 py-0.5 rounded-full font-semibold text-white flex-shrink-0"
              style={{ backgroundColor: "#7B5CF0" }}
            >
              🏆 Founding Seller
            </span>
          )}
        </div>

        {/* Toko ID — big and prominent */}
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-xs text-gray-400">Toko ID:</span>
          <span
            className="font-mono font-bold text-base tracking-wider"
            style={{ color: "#7B5CF0" }}
          >
            {tokoId ?? storeSlug}
          </span>
          <button
            onClick={handleCopy}
            title="Salin Toko ID"
            className="text-xs text-gray-400 hover:text-indigo-600 transition-colors"
          >
            {copied ? "✅" : "📋"}
          </button>
        </div>

        {/* Store URL + invite code */}
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <a
            href={`https://nemu-ai.com/toko/${storeSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-indigo-500 hover:underline truncate max-w-[180px]"
          >
            nemu-ai.com/toko/{storeSlug}
          </a>
          <span className="text-gray-300 hidden sm:block">|</span>
          <span className="text-xs text-gray-400">
            Kode undangan:{" "}
            <span className="font-mono font-semibold text-gray-700">{inviteCode}</span>
          </span>
        </div>
      </div>

      {/* AI Ready badge */}
      <div className="hidden sm:flex flex-col items-center gap-1 text-center flex-shrink-0">
        <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-xl">
          🤖
        </div>
        <span className="text-[10px] text-gray-400">AI Ready</span>
      </div>
    </div>
  );
}
