import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { getDemoSeller } from "@/lib/demo-session";
import { db } from "@/lib/db";
import { products, orders } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function buildSystemPrompt(seller: {
  storeName: string;
  category: string;
  description: string | null;
  storeSlug: string;
  inviteCode: string;
  isFoundingSeller: boolean;
}, catalog: { name: string; price: string; stock: number; description: string | null }[]) {
  const catalogText = catalog.length > 0
    ? catalog.map(p => `- ${p.name}: Rp ${Number(p.price).toLocaleString("id-ID")} (stok: ${p.stock})`).join("\n")
    : "Belum ada produk di katalog.";

  return `Kamu adalah agen AI untuk toko "${seller.storeName}" di platform Nemu AI.

Kamu berbicara bahasa Indonesia yang natural — seperti CS toko online profesional.
Santai tapi tepercaya. Singkat dan jelas. Gunakan "kak" untuk menyapa.

## Identitas Toko
- Nama: ${seller.storeName}
- Kategori: ${seller.category}
- Deskripsi: ${seller.description || "Toko online terpercaya"}
- Link toko: https://nemu-ai.com/toko/${seller.storeSlug}
- Kode undangan: ${seller.inviteCode}
${seller.isFoundingSeller ? "- Status: Founding Seller 🏆" : ""}

## Katalog Produk (real-time)
${catalogText}

## Prinsip Utama
- Jujur lebih penting dari ramah. Stok habis = bilang habis.
- Balas dalam 1-3 kalimat singkat. Orang malas baca panjang di WhatsApp.
- Kalau ditanya harga/stok, langsung jawab dari katalog di atas.
- Kalau produk tidak ada, sarankan produk lain yang relevan.
- Kalau diminta diskon/negosiasi, tolak dengan sopan dan tawarkan value lain.
- Jangan pernah memberikan informasi pribadi penjual.

## Cara Bicara
- Emoji boleh tapi jangan lebay (maks 1-2 per pesan)
- Kalau tidak tahu, bilang "saya cek dulu ya kak"
- Untuk pesanan, arahkan ke: https://nemu-ai.com/toko/${seller.storeSlug}

Kamu sedang dalam mode DEMO — tunjukkan bagaimana kamu akan merespons pembeli sungguhan.`;
}

export async function POST(req: NextRequest) {
  try {
    const { messages, mode = "buyer" } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "messages required" }, { status: 400 });
    }

    const seller = await getDemoSeller();

    // Fetch real catalog for context
    const catalog = await db.query.products.findMany({
      where: eq(products.sellerId, seller.id),
      orderBy: [desc(products.createdAt)],
      limit: 20,
    });

    const systemPrompt = buildSystemPrompt(seller, catalog);

    // Stream response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const anthropicStream = await client.messages.stream({
            model: "claude-haiku-3-5-latest",  // Fast + cheap for chat
            max_tokens: 256,
            system: systemPrompt,
            messages: messages.map((m: { role: string; content: string }) => ({
              role: m.role as "user" | "assistant",
              content: m.content,
            })),
          });

          for await (const chunk of anthropicStream) {
            if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`));
            }
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "Stream failed" })}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (err) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
