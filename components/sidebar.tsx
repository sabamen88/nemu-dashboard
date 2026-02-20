"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { Seller } from "@/lib/schema";

const nav = [
  { href: "/dashboard", label: "Dashboard", emoji: "🏠" },
  { href: "/agent", label: "Agen AI", emoji: "🤖" },
  { href: "/catalog", label: "Katalog", emoji: "📦" },
  { href: "/orders", label: "Pesanan", emoji: "🛒" },
  { href: "/messages", label: "Pesan", emoji: "💬" },
  { href: "/wallet", label: "Wallet", emoji: "💰" },
  { href: "/analytics", label: "Analitik", emoji: "📊" },
  { href: "/settings", label: "Pengaturan", emoji: "⚙️" },
];

export default function Sidebar({ seller }: { seller: Seller }) {
  const path = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setMobileOpen(false);
  }, [path]);

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100">
        <Link href="/dashboard" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#E91E63' }}>
            <span className="text-white text-sm font-bold">N</span>
          </div>
          <div>
            <span className="font-bold text-xl leading-none" style={{ color: '#E91E63' }}>nemu</span>
            <span className="font-bold text-xl leading-none text-gray-900">AI</span>
          </div>
        </Link>
        <p className="text-xs text-gray-400 mt-2 ml-10">Seller Dashboard</p>
      </div>

      {/* Agent Status Banner */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium",
          seller.agentStatus === "active"
            ? "bg-green-50 text-green-700 border border-green-200"
            : seller.agentStatus === "provisioning"
            ? "bg-yellow-50 text-yellow-700 border border-yellow-200"
            : "bg-gray-50 text-gray-500 border border-gray-200"
        )}>
          <span className="text-sm">
            {seller.agentStatus === "active" ? "🟢" : seller.agentStatus === "provisioning" ? "🟡" : "⚫"}
          </span>
          <span>
            {seller.agentStatus === "active" && "Agen AI Aktif"}
            {seller.agentStatus === "provisioning" && "Menyiapkan agen..."}
            {seller.agentStatus === "inactive" && "Agen Nonaktif"}
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {nav.map(({ href, label, emoji }) => {
          const isActive = path === href || (href !== "/dashboard" && path.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                isActive
                  ? "text-white shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
              style={isActive ? { backgroundColor: '#E91E63' } : {}}
            >
              <span className="text-base">{emoji}</span>
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Store Info Bottom */}
      <div className="border-t border-gray-100 p-4 space-y-3">
        {seller.isFoundingSeller && (
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-lg border border-amber-200">
            <span className="text-sm">🏆</span>
            <span className="text-xs font-semibold text-amber-700">Founding Seller</span>
          </div>
        )}
        <div className="px-2">
          <p className="text-sm font-semibold text-gray-800 truncate">{seller.storeName}</p>
          <p className="text-xs text-gray-400 mt-0.5 truncate">nemu-ai.com/toko/{seller.storeSlug}</p>
        </div>
        <a
          href={`https://nemu-ai.com/toko/${seller.storeSlug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-xs font-medium px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
        >
          <span>Buka Toko</span>
          <span>→</span>
        </a>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#E91E63' }}>
            <span className="text-white text-xs font-bold">N</span>
          </div>
          <span className="font-bold text-lg" style={{ color: '#E91E63' }}>nemu</span>
          <span className="font-bold text-lg text-gray-900">AI</span>
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition"
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside className={cn(
        "lg:hidden fixed top-0 left-0 z-40 w-72 h-full bg-white flex flex-col shadow-xl transition-transform duration-300",
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <SidebarContent />
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-gray-200 flex-col h-screen sticky top-0">
        <SidebarContent />
      </aside>
    </>
  );
}
