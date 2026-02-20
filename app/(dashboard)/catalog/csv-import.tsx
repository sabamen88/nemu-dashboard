"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface ParsedProduct {
  name: string;
  price: number;
  stock: number;
  description?: string;
  weight?: number;
}

function parseCSV(text: string): ParsedProduct[] {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];

  // Auto-detect delimiter
  const delim = lines[0].includes(";") ? ";" : ",";
  const headers = lines[0].split(delim).map((h) =>
    h.trim().toLowerCase().replace(/['"]/g, "")
  );

  const colMap = {
    name: headers.findIndex((h) =>
      ["nama produk", "nama", "product name", "name", "judul"].some((k) => h.includes(k))
    ),
    price: headers.findIndex((h) =>
      ["harga", "price", "harga jual", "harga satuan"].some((k) => h.includes(k))
    ),
    stock: headers.findIndex((h) =>
      ["stok", "stock", "qty", "jumlah", "quantity"].some((k) => h.includes(k))
    ),
    description: headers.findIndex((h) =>
      ["deskripsi", "description", "keterangan"].some((k) => h.includes(k))
    ),
    weight: headers.findIndex((h) =>
      ["berat", "weight", "berat (gr)", "berat(gram)"].some((k) => h.includes(k))
    ),
  };

  const results: ParsedProduct[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(delim).map((c) => c.trim().replace(/^["']|["']$/g, ""));
    const name = colMap.name >= 0 ? cols[colMap.name] : "";
    if (!name) continue;

    const rawPrice = colMap.price >= 0 ? cols[colMap.price] : "0";
    const price = parseInt(rawPrice.replace(/[^\d]/g, ""), 10) || 0;
    const stock = colMap.stock >= 0 ? parseInt(cols[colMap.stock], 10) || 0 : 0;
    const description = colMap.description >= 0 ? cols[colMap.description] : undefined;
    const weight = colMap.weight >= 0 ? parseInt(cols[colMap.weight], 10) || undefined : undefined;

    results.push({ name, price, stock, description, weight });
  }

  return results;
}

export default function CsvImportButton() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<ParsedProduct[]>([]);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [imported, setImported] = useState(0);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setDone(false);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseCSV(text);
      if (parsed.length === 0) {
        setError("Tidak ada data produk yang valid. Pastikan file CSV memiliki kolom: Nama Produk, Harga, Stok.");
        return;
      }
      setPreview(parsed);
      setShowModal(true);
    };
    reader.readAsText(file, "utf-8");
    // Reset input so same file can be re-selected
    e.target.value = "";
  }

  async function handleImport() {
    if (preview.length === 0) return;
    setLoading(true);
    setError("");
    let success = 0;
    for (const p of preview) {
      try {
        const res = await fetch("/api/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: p.name,
            price: p.price,
            stock: p.stock,
            description: p.description || null,
            weight: p.weight || null,
            images: [],
            status: "active",
          }),
        });
        if (res.ok) success++;
      } catch {}
    }
    setImported(success);
    setLoading(false);
    setDone(true);
    setShowModal(false);
    setPreview([]);
    router.refresh();
  }

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleFile}
      />

      <button
        onClick={() => fileRef.current?.click()}
        className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition shadow-sm"
      >
        📥 Import CSV
      </button>

      {done && (
        <p className="text-xs text-green-600 font-medium mt-1">
          ✅ {imported} produk berhasil diimpor!
        </p>
      )}
      {error && (
        <p className="text-xs text-red-500 font-medium mt-1">{error}</p>
      )}

      {/* Preview Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">
                Preview Import CSV
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {preview.length} produk siap diimpor dari Tokopedia/Shopee
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left pb-3 font-semibold text-gray-600">Nama Produk</th>
                    <th className="text-right pb-3 font-semibold text-gray-600">Harga</th>
                    <th className="text-right pb-3 font-semibold text-gray-600">Stok</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {preview.slice(0, 20).map((p, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="py-2.5 pr-4 text-gray-800 max-w-xs truncate">{p.name}</td>
                      <td className="py-2.5 text-right text-gray-700 font-mono">
                        Rp {p.price.toLocaleString("id-ID")}
                      </td>
                      <td className="py-2.5 text-right text-gray-700">{p.stock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.length > 20 && (
                <p className="text-center text-sm text-gray-400 mt-4">
                  +{preview.length - 20} produk lainnya...
                </p>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3 justify-end">
              <button
                onClick={() => { setShowModal(false); setPreview([]); }}
                className="px-4 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition"
                disabled={loading}
              >
                Batal
              </button>
              <button
                onClick={handleImport}
                disabled={loading}
                className="px-6 py-2.5 text-sm font-semibold text-white rounded-xl hover:opacity-90 transition disabled:opacity-50"
                style={{ backgroundColor: "#4f39f6" }}
              >
                {loading ? "Mengimpor..." : `✅ Import ${preview.length} Produk`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
