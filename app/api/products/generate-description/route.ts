export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

const CATEGORY_TEMPLATES: Record<string, string[]> = {
  "Fashion & Pakaian": [
    "Hadir dengan bahan premium pilihan yang nyaman dipakai seharian.",
    "Cocok untuk berbagai kesempatan — casual, hangout, atau kerja.",
    "Model yang stylish dan kekinian sesuai tren fashion Indonesia.",
    "Tersedia dalam berbagai ukuran, nyaman di semua tubuh.",
    "Perawatan mudah — bisa dicuci mesin, bahan tidak mudah melar.",
  ],
  "Elektronik": [
    "Performa tinggi dengan teknologi terkini untuk mendukung aktivitas harianmu.",
    "Desain ergonomis dan ringan, mudah dibawa kemana saja.",
    "Kompatibel dengan berbagai perangkat populer di Indonesia.",
    "Garansi resmi untuk ketenangan pikiran pembelian kamu.",
    "Hemat energi dan ramah lingkungan.",
  ],
  "Makanan & Minuman": [
    "Dibuat dari bahan-bahan pilihan segar dan berkualitas tinggi.",
    "Tanpa bahan pengawet berbahaya — aman untuk seluruh keluarga.",
    "Cita rasa autentik khas Indonesia yang bikin ketagihan.",
    "Kemasan higienis dan tahan lama, cocok untuk dibawa bepergian.",
    "Proses produksi bersertifikat BPOM dan halal MUI.",
  ],
  "Kecantikan": [
    "Formula khusus yang telah diuji secara dermatologis — aman untuk kulit sensitif.",
    "Bahan aktif alami pilihan untuk hasil maksimal.",
    "Bebas paraben, bebas SLS, dan ramah kulit.",
    "Cocok untuk iklim tropis Indonesia — ringan dan tidak lengket.",
    "Sudah tersertifikasi BPOM dan halal.",
  ],
  "Rumah & Dapur": [
    "Material berkualitas tinggi, tahan lama dan mudah dibersihkan.",
    "Desain minimalis yang cocok untuk semua gaya interior rumah.",
    "Ukuran praktis dan fungsional untuk kehidupan sehari-hari.",
    "Aman digunakan untuk seluruh keluarga.",
    "Hemat tempat dengan desain yang ergonomis.",
  ],
  "Olahraga": [
    "Dirancang untuk performa optimal saat berolahraga.",
    "Material breathable yang menyerap keringat dengan baik.",
    "Tahan lama menghadapi aktivitas fisik intens.",
    "Desain sporty yang tetap stylish di luar gym.",
    "Cocok untuk berbagai jenis olahraga — gym, lari, yoga, dll.",
  ],
  "default": [
    "Produk berkualitas tinggi dengan harga terjangkau.",
    "Dibuat dengan standar kualitas ketat untuk kepuasan pelanggan.",
    "Tersedia stok terbatas — pesan sekarang sebelum kehabisan.",
    "Pengiriman cepat ke seluruh Indonesia.",
    "Garansi kepuasan — jika tidak puas, kami siap membantu.",
  ],
};

function getTemplates(category: string): string[] {
  return CATEGORY_TEMPLATES[category] ?? CATEGORY_TEMPLATES["default"];
}

function buildFallbackDescription(name: string, category: string): string {
  const cat = category ?? "default";
  const templates = getTemplates(cat);
  const lines = [
    `${name} — produk ${cat.toLowerCase()} pilihan terbaik untuk kamu!`,
    "",
    ...templates.slice(0, 4),
    "",
    `Produk original, bukan KW. Kami menjamin kualitas ${name} yang kamu beli.`,
    "Punya pertanyaan? Chat kami — agen AI kami siap membantu 24/7!",
  ];
  return lines.join("\n");
}

async function generateWithMinimax(name: string, category: string): Promise<string> {
  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) throw new Error("MINIMAX_API_KEY not configured");

  const prompt = `Buat deskripsi produk yang menarik dalam Bahasa Indonesia untuk produk "${name}" dalam kategori "${category}". Tulis 3-4 kalimat, tonjolkan manfaat utama produk, dan akhiri dengan ajakan untuk membeli (call to action). Gunakan gaya bahasa natural seperti listing di Tokopedia atau Shopee yang profesional. Langsung tulis deskripsinya saja tanpa heading, label, atau penjelasan tambahan.`;

  const response = await fetch("https://api.minimax.io/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "MiniMax-Text-01",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 350,
      temperature: 0.8,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`MiniMax API error: ${err}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content as string | undefined;
  if (!content?.trim()) throw new Error("Empty response from MiniMax");
  return content.trim();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, category } = body as { name?: string; category?: string };

    if (!name) {
      return NextResponse.json({ error: "Nama produk diperlukan" }, { status: 400 });
    }

    const cat = category ?? "default";

    try {
      const description = await generateWithMinimax(name, cat);
      return NextResponse.json({ description });
    } catch (err) {
      console.warn("[generate-description] MiniMax failed, using fallback:", err);
      const description = buildFallbackDescription(name, cat);
      return NextResponse.json({ description });
    }
  } catch (err) {
    console.error("[generate-description POST]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
