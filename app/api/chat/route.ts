export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getDemoSeller } from "@/lib/demo-session";
import { db } from "@/lib/db";
import { products } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";

const MINIMAX_BASE_URL = "https://api.minimax.io/v1";
const MINIMAX_MODEL = "MiniMax-Text-01";
const FLOWISE_URL = process.env.FLOWISE_URL;
const FLOWISE_API_KEY = process.env.FLOWISE_API_KEY;

// MiniMax does not support role:system — merge into first user message
function buildMessages(
  systemPrompt: string,
  history: { role: string; content: string }[]
) {
  if (history.length === 0) return [];

  const merged = [...history];
  if (merged[0].role === "user") {
    merged[0] = {
      role: "user",
      content: `[Instruksi Sistem]\n${systemPrompt}\n\n[Pesan Pembeli]\n${merged[0].content}`,
    };
  }
  return merged;
}

function buildSystemPrompt(
  seller: {
    storeName: string;
    category: string;
    description: string | null;
    storeSlug: string;
    inviteCode: string;
    isFoundingSeller: boolean;
    aiCustomPrompt?: string | null;
  },
  catalog: { name: string; price: string; stock: number }[]
) {
  // Use custom prompt if set
  if (seller.aiCustomPrompt) {
    return seller.aiCustomPrompt;
  }

  const catalogText =
    catalog.length > 0
      ? catalog
          .map(
            (p) =>
              `- ${p.name}: Rp ${Number(p.price).toLocaleString("id-ID")} (stok: ${p.stock})`
          )
          .join("\n")
      : "Belum ada produk di katalog.";

  return `Kamu adalah agen AI untuk toko "${seller.storeName}" di platform Nemu AI.
Kamu adalah asisten penjual yang cerdas — bukan chatbot generik.

CARA BICARA:
- Bahasa Indonesia natural, seperti CS toko online profesional
- Sapaan: "kak" (gender-neutral)
- Singkat dan langsung — maksimal 3 kalimat per balasan
- Emoji boleh tapi tidak lebay (1-2 per pesan)
- Kalau tidak tahu, jujur: "saya cek dulu ya kak"

IDENTITAS TOKO:
- Nama: ${seller.storeName}
- Kategori: ${seller.category}
- Deskripsi: ${seller.description || "Toko online terpercaya di Nemu AI"}
- Link: https://nemu-ai.com/toko/${seller.storeSlug}
- Kode undangan: ${seller.inviteCode}
${seller.isFoundingSeller ? "- Status: Founding Seller 🏆" : ""}

KATALOG PRODUK (data real-time):
${catalogText}

ATURAN:
- Stok habis = bilang habis, jangan janji restock tanpa kepastian
- Ditawar/minta diskon = tolak sopan, tawarkan value lain
- Pertanyaan di luar kemampuan = eskalasi ke pemilik toko
- JANGAN beri info pribadi penjual (HP pribadi, alamat rumah, rekening)
- Semua pembelian lewat: https://nemu-ai.com/toko/${seller.storeSlug}

Kamu ditenagai oleh MiniMax M2.5 via Nemu AI.`;
}

/** Stream from Flowise prediction endpoint */
async function streamFromFlowise(
  chatflowId: string,
  messages: { role: string; content: string }[]
): Promise<Response> {
  const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
  if (!lastUserMessage) {
    return NextResponse.json({ error: "No user message" }, { status: 400 });
  }

  // Build conversation history for Flowise (exclude the last user message)
  const history = messages.slice(0, -1);

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (FLOWISE_API_KEY) headers["Authorization"] = `Bearer ${FLOWISE_API_KEY}`;

  const body: Record<string, unknown> = {
    question: lastUserMessage.content,
    streaming: true,
  };

  // Pass conversation history if we have it
  if (history.length > 0) {
    body.history = history.map((m) => ({
      role: m.role,
      content: m.content,
    }));
  }

  const response = await fetch(
    `${FLOWISE_URL}/api/v1/prediction/${chatflowId}`,
    {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60_000),
    }
  );

  if (!response.ok) {
    throw new Error(`Flowise prediction error: ${response.status}`);
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      try {
        while (reader) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          // Flowise streams events as SSE
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6).trim();
              if (data === "[DONE]") {
                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                continue;
              }
              try {
                // Flowise may send plain text or JSON
                const parsed = JSON.parse(data);
                const text =
                  parsed.token ?? // Flowise streaming token
                  parsed.text ??
                  parsed.choices?.[0]?.delta?.content ??
                  parsed.choices?.[0]?.text ??
                  null;
                if (text) {
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
                  );
                }
              } catch {
                // Plain text token from Flowise
                if (data && data !== "[DONE]") {
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ text: data })}\n\n`)
                  );
                }
              }
            }
          }
        }
      } finally {
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
}

/** Stream from MiniMax directly (fallback) */
async function streamFromMiniMax(
  seller: Parameters<typeof buildSystemPrompt>[0],
  catalog: { name: string; price: string; stock: number }[],
  messages: { role: string; content: string }[]
): Promise<Response> {
  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "MINIMAX_API_KEY not configured" }, { status: 500 });
  }

  const systemPrompt = buildSystemPrompt(seller, catalog);
  const minimaxMessages = buildMessages(systemPrompt, messages);

  const response = await fetch(`${MINIMAX_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MINIMAX_MODEL,
      messages: minimaxMessages,
      stream: true,
      max_tokens: 300,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error("MiniMax error:", err);
    return NextResponse.json({ error: "MiniMax API error", detail: err }, { status: 502 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      try {
        while (reader) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]") {
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              continue;
            }
            try {
              const parsed = JSON.parse(data);
              const text = parsed.choices?.[0]?.delta?.content;
              if (text) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
                );
              }
            } catch {}
          }
        }
      } finally {
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
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "messages required" }, { status: 400 });
    }

    const seller = await getDemoSeller();

    // ── Route to Flowise if seller has an active chatflow ──────────────────
    if (
      FLOWISE_URL &&
      seller.agentChatflowId &&
      seller.agentStatus === "active"
    ) {
      try {
        return await streamFromFlowise(seller.agentChatflowId, messages);
      } catch (err) {
        console.error("Flowise stream error, falling back to MiniMax:", err);
        // Fall through to MiniMax
      }
    }

    // ── MiniMax direct fallback ────────────────────────────────────────────
    const catalog = await db.query.products.findMany({
      where: eq(products.sellerId, seller.id),
      orderBy: [desc(products.createdAt)],
      limit: 20,
    });

    return await streamFromMiniMax(seller, catalog, messages);
  } catch (err) {
    console.error("Chat route error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
