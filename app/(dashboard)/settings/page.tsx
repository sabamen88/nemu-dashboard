export const dynamic = 'force-dynamic';

import { getDemoSeller } from "@/lib/demo-session";

export default async function SettingsPage() {
  const seller = await getDemoSeller();

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Pengaturan Toko</h1>
      <div className="space-y-6">
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
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
            Simpan Perubahan
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
          <h2 className="font-semibold">Link & Kode Undangan</h2>
          <div>
            <label className="block text-sm text-gray-500 mb-1">Link Toko</label>
            <code className="block bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm">
              nemu-ai.com/toko/{seller.storeSlug}
            </code>
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">Kode Undangan</label>
            <code className="block bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono font-bold tracking-wider">
              {seller.inviteCode}
            </code>
          </div>
        </div>

        {seller.agentWalletAddress && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="font-semibold mb-3">💰 Wallet Agent AI</h2>
            <code className="block bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs break-all">
              {seller.agentWalletAddress}
            </code>
          </div>
        )}
      </div>
    </div>
  );
}
