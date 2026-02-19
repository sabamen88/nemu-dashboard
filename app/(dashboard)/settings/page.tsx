export const dynamic = 'force-dynamic';

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { sellers } from "@/lib/schema";
import { eq } from "drizzle-orm";

export default async function SettingsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const seller = await db.query.sellers.findFirst({ where: eq(sellers.clerkUserId, userId) });
  if (!seller) redirect("/onboarding");

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Pengaturan Toko</h1>

      <div className="space-y-6">
        {/* Store Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <h2 className="font-semibold">Informasi Toko</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Toko</label>
            <input defaultValue={seller.storeName}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
            <input defaultValue={seller.category}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
            <textarea defaultValue={seller.description ?? ""}  rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
            Simpan Perubahan
          </button>
        </div>

        {/* Store Links */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
          <h2 className="font-semibold">Link & Kode Undangan</h2>
          <div>
            <label className="block text-sm text-gray-500 mb-1">Link Toko</label>
            <div className="flex gap-2">
              <code className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm">
                nemu-ai.com/toko/{seller.storeSlug}
              </code>
              <button className="px-3 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition">
                Copy
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">Kode Undangan</label>
            <div className="flex gap-2">
              <code className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono font-bold tracking-wider">
                {seller.inviteCode}
              </code>
              <button className="px-3 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50 transition">
                Copy
              </button>
            </div>
          </div>
        </div>

        {/* Agent Wallet */}
        {seller.agentWalletAddress && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold mb-3">💰 Wallet Agent AI</h2>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Alamat Wallet (Base/USDC)</label>
              <code className="block bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs break-all">
                {seller.agentWalletAddress}
              </code>
              <p className="text-xs text-gray-400 mt-2">
                Wallet ini menerima pembayaran otomatis dari buyer agent via protokol x402
              </p>
            </div>
          </div>
        )}

        {/* Danger Zone */}
        <div className="bg-white rounded-xl border border-red-100 p-6">
          <h2 className="font-semibold text-red-600 mb-3">Zona Bahaya</h2>
          <button className="text-sm text-red-500 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-50 transition">
            Hapus Toko
          </button>
        </div>
      </div>
    </div>
  );
}
