"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/utils";
import type { Seller } from "@/lib/schema";
import {
  LayoutDashboard, Package, ShoppingBag, MessageSquare,
  Settings, BarChart3, Bot, Zap
} from "lucide-react";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/catalog", label: "Produk", icon: Package },
  { href: "/orders", label: "Pesanan", icon: ShoppingBag },
  { href: "/messages", label: "Pesan", icon: MessageSquare },
  { href: "/analytics", label: "Analitik", icon: BarChart3 },
  { href: "/settings", label: "Pengaturan", icon: Settings },
];

export default function Sidebar({ seller }: { seller: Seller }) {
  const path = usePathname();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🛍️</span>
          <div>
            <p className="font-bold text-gray-900 text-sm leading-tight">Nemu AI</p>
            <p className="text-xs text-gray-500 truncate max-w-[140px]">{seller.storeName}</p>
          </div>
        </div>
      </div>

      {/* Agent Status */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium",
          seller.agentStatus === "active"
            ? "bg-green-50 text-green-700"
            : seller.agentStatus === "provisioning"
            ? "bg-yellow-50 text-yellow-700"
            : "bg-gray-100 text-gray-500"
        )}>
          <Bot className="w-3.5 h-3.5" />
          {seller.agentStatus === "active" && "AI Agent Aktif ✅"}
          {seller.agentStatus === "provisioning" && "AI Agent Menyiapkan..."}
          {seller.agentStatus === "inactive" && "AI Agent Nonaktif"}
          {seller.agentStatus === "error" && "AI Agent Error ⚠️"}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
              path === href || path.startsWith(href + "/")
                ? "bg-blue-50 text-blue-700 font-medium"
                : "text-gray-600 hover:bg-gray-100"
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
      </nav>

      {/* Founding Badge */}
      {seller.isFoundingSeller && (
        <div className="mx-3 mb-3 px-3 py-2 bg-amber-50 rounded-lg border border-amber-200">
          <div className="flex items-center gap-1.5 text-amber-700 text-xs font-medium">
            <Zap className="w-3.5 h-3.5" />
            Founding Seller 🏆
          </div>
        </div>
      )}

      {/* User */}
      <div className="px-4 py-4 border-t border-gray-100 flex items-center gap-3">
        <UserButton afterSignOutUrl="/sign-in" />
        <div className="text-xs text-gray-500 truncate">
          {seller.storeName}
        </div>
      </div>
    </aside>
  );
}
