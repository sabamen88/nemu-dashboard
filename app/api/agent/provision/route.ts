export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getDemoSeller } from "@/lib/demo-session";
import { db } from "@/lib/db";
import { sellers } from "@/lib/schema";
import { eq } from "drizzle-orm";

const FLOWISE_URL = process.env.FLOWISE_URL;
const FLOWISE_API_KEY = process.env.FLOWISE_API_KEY;

/** Build Flowise chatflow payload for this seller */
function buildChatflowPayload(storeName: string, sellerId: string) {
  const systemPrompt = `Kamu adalah asisten AI profesional untuk toko "${storeName}" di platform Nemu AI Indonesia.

CARA BICARA:
- Bahasa Indonesia yang natural dan profesional
- Sopan namun santai seperti rekan kerja
- Singkat dan langsung — maksimal 4 kalimat per respons
- Gunakan emoji secukupnya (1-2 per pesan)
- Panggil pengguna dengan "kak" (gender-neutral)

KEMAMPUAN KAMU:
1. nemu_catalog → lihat produk, cari produk, cek stok
2. nemu_orders → lihat pesanan (hari ini, pending, selesai, dll)
3. nemu_stats → statistik toko — omzet, jumlah pesanan, produk aktif

ATURAN PENTING:
- Selalu gunakan tool untuk data real-time, jangan mengarang data
- Jika pertanyaan di luar kemampuan, jawab jujur: "Maaf kak, saya belum bisa bantu untuk itu"
- Semua angka uang dalam format Rupiah
- JANGAN bocorkan informasi teknis sensitif

Identitas Toko: ${storeName}
Platform: Nemu AI — marketplace Indonesia`;

  const neonUrl = process.env.DATABASE_URL || "";

  return {
    name: `${storeName} — Seller Agent`,
    deployed: true,
    isPublic: true,
    flowData: JSON.stringify({
      nodes: [
        {
          id: "chatOpenAI_0",
          position: { x: 300, y: 50 },
          type: "customNode",
          data: {
            label: "MiniMax M2.5",
            name: "chatOpenAI",
            version: 6,
            type: "ChatOpenAI",
            baseClasses: ["ChatOpenAI", "BaseChatModel", "BaseLanguageModel"],
            category: "Chat Models",
            inputs: {
              modelName: "MiniMax-Text-01",
              openAIApiKey: process.env.MINIMAX_API_KEY || process.env.OPENAI_API_KEY || "",
              baseURL: "https://api.minimax.io/v1",
              temperature: 0.7,
              maxTokens: 500,
              streaming: true,
            },
            outputAnchors: [
              { id: "chatOpenAI_0-output-chatOpenAI-ChatOpenAI", name: "chatOpenAI", label: "ChatOpenAI", description: "", type: "ChatOpenAI | BaseChatModel | BaseLanguageModel" }
            ],
            id: "chatOpenAI_0",
          },
        },
        {
          id: "bufferMemory_0",
          position: { x: 300, y: 350 },
          type: "customNode",
          data: {
            label: "Buffer Memory",
            name: "bufferMemory",
            version: 2,
            type: "BufferMemory",
            baseClasses: ["BufferMemory", "BaseChatMemory", "BaseMemory"],
            category: "Memory",
            inputs: {
              sessionId: sellerId,
              memoryKey: "chat_history",
            },
            outputAnchors: [
              { id: "bufferMemory_0-output-bufferMemory-BufferMemory", name: "bufferMemory", label: "BufferMemory", description: "", type: "BufferMemory | BaseChatMemory | BaseMemory" }
            ],
            id: "bufferMemory_0",
          },
        },
        {
          id: "nemuCatalog_0",
          position: { x: 700, y: 50 },
          type: "customNode",
          data: {
            label: "Nemu Catalog",
            name: "nemuCatalog",
            version: 2,
            type: "NemuCatalog",
            baseClasses: ["Tool"],
            category: "Tools",
            inputs: {
              connectionString: neonUrl,
              sellerId: sellerId,
            },
            outputAnchors: [
              { id: "nemuCatalog_0-output-nemuCatalog-Tool", name: "nemuCatalog", label: "Tool", description: "", type: "Tool" }
            ],
            id: "nemuCatalog_0",
          },
        },
        {
          id: "nemuOrders_0",
          position: { x: 700, y: 250 },
          type: "customNode",
          data: {
            label: "Nemu Orders",
            name: "nemuOrders",
            version: 1,
            type: "NemuOrders",
            baseClasses: ["Tool"],
            category: "Tools",
            inputs: {
              connectionString: neonUrl,
              sellerId: sellerId,
            },
            outputAnchors: [
              { id: "nemuOrders_0-output-nemuOrders-Tool", name: "nemuOrders", label: "Tool", description: "", type: "Tool" }
            ],
            id: "nemuOrders_0",
          },
        },
        {
          id: "nemuStats_0",
          position: { x: 700, y: 450 },
          type: "customNode",
          data: {
            label: "Nemu Stats",
            name: "nemuStats",
            version: 1,
            type: "NemuStats",
            baseClasses: ["Tool"],
            category: "Tools",
            inputs: {
              connectionString: neonUrl,
              sellerId: sellerId,
            },
            outputAnchors: [
              { id: "nemuStats_0-output-nemuStats-Tool", name: "nemuStats", label: "Tool", description: "", type: "Tool" }
            ],
            id: "nemuStats_0",
          },
        },
        {
          id: "conversationChain_0",
          position: { x: 1100, y: 250 },
          type: "customNode",
          data: {
            label: "Nemu Seller Agent",
            name: "conversationChain",
            version: 3,
            type: "ConversationChain",
            baseClasses: ["ConversationChain", "BaseChain"],
            category: "Chains",
            inputs: {
              model: "{{chatOpenAI_0.data.instance}}",
              memory: "{{bufferMemory_0.data.instance}}",
              tools: [
                "{{nemuCatalog_0.data.instance}}",
                "{{nemuOrders_0.data.instance}}",
                "{{nemuStats_0.data.instance}}",
              ],
              systemMessagePrompt: systemPrompt,
            },
            outputAnchors: [
              { id: "conversationChain_0-output-conversationChain-ConversationChain", name: "conversationChain", label: "ConversationChain", description: "", type: "ConversationChain | BaseChain" }
            ],
            id: "conversationChain_0",
          },
        },
      ],
      edges: [
        {
          id: "e1",
          source: "chatOpenAI_0",
          target: "conversationChain_0",
          sourceHandle: "chatOpenAI_0-output-chatOpenAI-ChatOpenAI",
          targetHandle: "conversationChain_0-input-model-BaseChatModel",
          type: "buttonedge",
        },
        {
          id: "e2",
          source: "bufferMemory_0",
          target: "conversationChain_0",
          sourceHandle: "bufferMemory_0-output-bufferMemory-BufferMemory",
          targetHandle: "conversationChain_0-input-memory-BaseChatMemory",
          type: "buttonedge",
        },
        {
          id: "e3",
          source: "nemuCatalog_0",
          target: "conversationChain_0",
          sourceHandle: "nemuCatalog_0-output-nemuCatalog-Tool",
          targetHandle: "conversationChain_0-input-tools-Tool",
          type: "buttonedge",
        },
        {
          id: "e4",
          source: "nemuOrders_0",
          target: "conversationChain_0",
          sourceHandle: "nemuOrders_0-output-nemuOrders-Tool",
          targetHandle: "conversationChain_0-input-tools-Tool",
          type: "buttonedge",
        },
        {
          id: "e5",
          source: "nemuStats_0",
          target: "conversationChain_0",
          sourceHandle: "nemuStats_0-output-nemuStats-Tool",
          targetHandle: "conversationChain_0-input-tools-Tool",
          type: "buttonedge",
        },
      ],
    }),
  };
}

export async function POST(_req: NextRequest) {
  const seller = await getDemoSeller();

  // ── If seller already has an active chatflow, return it ──────────────────
  if (seller.agentStatus === "active" && seller.agentChatflowId) {
    return NextResponse.json({
      status: "provisioned",
      chatflowId: seller.agentChatflowId,
      source: "existing",
    });
  }

  // ── Try Flowise API first ─────────────────────────────────────────────────
  if (FLOWISE_URL && FLOWISE_API_KEY) {
    try {
      const payload = buildChatflowPayload(seller.storeName, seller.id);

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (FLOWISE_API_KEY) {
        headers["Authorization"] = `Bearer ${FLOWISE_API_KEY}`;
      }

      const response = await fetch(`${FLOWISE_URL}/api/v1/chatflows`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30_000),
      });

      if (response.ok) {
        const chatflow = await response.json();
        const chatflowId = chatflow.id as string;

        await db.update(sellers).set({
          agentStatus: "active",
          agentChatflowId: chatflowId,
          updatedAt: new Date(),
        }).where(eq(sellers.id, seller.id));

        return NextResponse.json({
          status: "provisioned",
          chatflowId,
          source: "flowise",
        });
      } else {
        const err = await response.text();
        console.error("Flowise createChatflow error:", response.status, err);
        // Fall through to demo mode
      }
    } catch (err) {
      console.error("Flowise provision error:", err);
      // Fall through to demo mode
    }
  }

  // ── Demo mode fallback ────────────────────────────────────────────────────
  await db.update(sellers).set({
    agentStatus: "active",
    agentWalletAddress: "0xd9f933447f04209ba2cDcbb22D70c713FD6f1608",
    updatedAt: new Date(),
  }).where(eq(sellers.id, seller.id));

  return NextResponse.json({ status: "provisioned", source: "demo" });
}

export async function DELETE(_req: NextRequest) {
  const seller = await getDemoSeller();

  // Optionally deactivate in Flowise (don't delete — preserve conversation history)
  // We just update DB status

  await db.update(sellers).set({
    agentStatus: "inactive",
    updatedAt: new Date(),
  }).where(eq(sellers.id, seller.id));

  return NextResponse.json({ status: "deprovisioned" });
}
