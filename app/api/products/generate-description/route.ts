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

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, category } = body as { name?: string; category?: string };

  if (!name) {
    return NextResponse.json({ error: "Nama produk diperlukan" }, { status: 400 });
  }

  const cat = category ?? "default";
  const templates = getTemplates(cat);

  // Build a realistic description from the templates
  const lines = [
    `${name} — produk ${cat.toLowerCase()} pilihan terbaik untuk kamu!`,
    "",
    ...templates.slice(0, 4),
    "",
    `Produk original, bukan KW. Kami menjamin kualitas ${name} yang kamu beli.`,
    "Punya pertanyaan? Chat kami via WhatsApp — agen AI kami siap membantu 24/7!",
  ];

  const description = lines.join("\n");

  return NextResponse.json({ description });
}
