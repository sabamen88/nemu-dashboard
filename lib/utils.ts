import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRupiah(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function generateTokoId(storeName: string): string {
  // Take first word(s) up to 9 chars, uppercase, strip spaces/special chars
  // "Toko Baju Ayu" → "BAJUAYU"
  // "Fashion Keren Jakarta" → "FASHIONKE"
  // Min 4 chars, max 9 chars
  const words = storeName.trim().split(/\s+/);
  // Skip common words like "Toko", "Store", "Shop", "Warung", "Kios"
  const skip = ['toko', 'store', 'shop', 'warung', 'kios'];
  const filtered = words.filter(w => !skip.includes(w.toLowerCase()));
  const base = (filtered.length > 0 ? filtered : words)
    .join('')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 9);
  return base.length >= 4 ? base : base.padEnd(4, '0');
}

export function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function timeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}d lalu`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}j lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari lalu`;
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Menunggu",
  confirmed: "Dikonfirmasi",
  shipped: "Dikirim",
  done: "Selesai",
  cancelled: "Dibatalkan",
};

export const CATEGORIES = [
  "Fashion & Pakaian",
  "Elektronik",
  "Makanan & Minuman",
  "Kecantikan",
  "Rumah & Dapur",
  "Olahraga",
  "Otomotif",
  "Buku & Alat Tulis",
  "Mainan & Hobi",
  "Umum",
];
