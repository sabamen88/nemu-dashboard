export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getDemoSeller } from "@/lib/demo-session";
import { db } from "@/lib/db";
import { sellers } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { generateSlug } from "@/lib/utils";

// Step flow: language → welcome → store_name → category → description → phone → complete
const STEP_ORDER = ["language", "welcome", "store_name", "category", "description", "phone", "complete"];

function getNextStep(currentStep: string): string {
  const idx = STEP_ORDER.indexOf(currentStep);
  if (idx === -1 || idx >= STEP_ORDER.length - 1) return "complete";
  return STEP_ORDER[idx + 1];
}

function getStepNumber(step: string): number {
  return STEP_ORDER.indexOf(step) + 1;
}

function buildSystemPrompt(step: string, context: Record<string, string>): string {
  const contextStr = Object.entries(context)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");

  let stepInstruction = "";
  switch (step) {
    case "language":
      stepInstruction = `Sampaikan salam pembuka yang hangat dalam DUA bahasa (Indonesia dan English).
Contoh pesan: "Halo! Selamat datang di Nemu AI 👋 Mau pakai Bahasa Indonesia atau English? / Hello! Welcome to Nemu AI 👋 Would you like to continue in Bahasa Indonesia or English?"
HANYA tanya pilihan bahasa — jangan tanya hal lain.`;
      break;
    case "welcome":
      stepInstruction = `Perkenalkan Nemu AI dengan singkat dan semangat.
Jelaskan bahwa setup toko hanya butuh 2 menit.
Akhiri dengan pertanyaan: "Siap mulai? Kira-kira nama toko kamu apa?" (atau English jika user pilih English)
HANYA tanya nama toko — jangan tanya hal lain.`;
      break;
    case "store_name":
      stepInstruction = `Validasi nama toko yang diberikan user (minimal 3 karakter).
Jika valid: konfirmasi nama toko dengan semangat, tunjukkan slug yang akan dibuat (contoh: "toko-kamu"), lalu tanya kategori.
Jika tidak valid: minta ulang dengan ramah dan berikan contoh nama toko yang bagus.
HANYA tanya kategori jika nama sudah valid — jangan tanya hal lain.
Tawarkan 6 kategori: Fashion & Pakaian, Makanan & Minuman, Elektronik, Kecantikan & Perawatan, Kerajinan & Hobi, Lainnya.`;
      break;
    case "category":
      stepInstruction = `User memilih atau mengetik kategori toko.
Konfirmasi pilihan kategori dengan antusias.
Lanjut tanya deskripsi toko: "Ceritakan sedikit tentang tokomu — jual apa, untuk siapa?"
Bilang bahwa ini OPSIONAL dan bisa diisi nanti: "Boleh skip kalau mau, bisa diisi nanti 😊"
HANYA tanya deskripsi — jangan tanya hal lain.`;
      break;
    case "description":
      stepInstruction = `User memberikan deskripsi toko (atau skip).
Apresiasi deskripsinya (atau skip-nya) dengan hangat.
Tanya nomor WhatsApp untuk kontak pembeli.
Format yang diterima: +62xxx atau 08xxx
Jelaskan gunanya: "Nomor ini buat pembeli bisa langsung hubungi kamu via WhatsApp 📱"
HANYA tanya nomor WhatsApp — jangan tanya hal lain.`;
      break;
    case "phone":
      stepInstruction = `User memberikan nomor WhatsApp.
Validasi format nomor (+62xxx atau 08xxx atau format internasional lainnya).
Jika valid: konfirmasi dan katakan toko hampir siap!
Jika tidak valid: minta ulang dengan contoh yang benar.
Jika valid, ucapkan SELAMAT dengan sangat antusias! 🎉
Gunakan nama toko dari context.
Katakan: "Toko [NAMA TOKO] sudah aktif! Sekarang kamu bisa mulai tambah produk pertamamu 🚀"`;
      break;
    case "complete":
      stepInstruction = `Ucapkan selamat dengan sangat meriah! 🎉🎊
Sebutkan nama toko dari context.
Katakan toko sudah AKTIF dan siap menerima pembeli.
Motivasi seller: "Kamu luar biasa! Sekarang saatnya tambah produk pertamamu 🚀"
Buat seller merasa EXCITED, bukan lega.`;
      break;
  }

  return `Kamu adalah Nemu — asisten AI yang membantu penjual baru membuka toko online di Nemu AI Indonesia.

KEPRIBADIANMU:
- Ramah, sabar, dan menyemangati seperti teman yang supportif
- Bahasa mudah dipahami — seperti ngobrol WhatsApp, bukan formulir resmi
- Gunakan emoji secukupnya 😊
- TIDAK pernah pakai jargon teknis
- Jika user pakai English, balas dalam English
- Maksimal 3 kalimat per respons — singkat dan jelas

LANGKAH SAAT INI: ${step} (Langkah ${getStepNumber(step)} dari ${STEP_ORDER.length})
${contextStr ? `\nDATA YANG SUDAH DIKUMPULKAN:\n${contextStr}` : ""}

INSTRUKSI LANGKAH INI:
${stepInstruction}

ATURAN PENTING:
- Tanya SATU hal saja per pesan
- Jika jawaban tidak valid, minta dengan cara yang encouraging (tidak menyalahkan)
- Jika user bingung, berikan contoh konkret
- Setelah semua data terkumpul, ucapkan selamat dan informasikan toko sudah aktif`;
}

function detectNextStep(
  currentStep: string,
  userMessage: string,
  context: Record<string, string>
): { nextStep: string; updatedContext: Record<string, string> } {
  const updated = { ...context };
  let nextStep = currentStep;

  switch (currentStep) {
    case "language": {
      const msg = userMessage.toLowerCase();
      if (
        msg.includes("indonesia") ||
        msg.includes("indo") ||
        msg.includes("bahasa") ||
        msg.includes("english") ||
        msg.includes("inggris") ||
        msg.length > 0
      ) {
        updated.language = msg.includes("english") || msg.includes("inggris") ? "english" : "indonesia";
        nextStep = "welcome";
      }
      break;
    }
    case "welcome": {
      // Any response moves to store_name collection
      if (userMessage.trim().length > 0) {
        nextStep = "store_name";
      }
      break;
    }
    case "store_name": {
      const name = userMessage.trim();
      if (name.length >= 3) {
        updated.storeName = name;
        updated.storeSlug = generateSlug(name);
        nextStep = "category";
      }
      break;
    }
    case "category": {
      const msg = userMessage.trim();
      if (msg.length > 0) {
        updated.category = msg;
        nextStep = "description";
      }
      break;
    }
    case "description": {
      const msg = userMessage.trim().toLowerCase();
      if (msg === "skip" || msg === "lewati" || msg === "nanti" || msg.length > 0) {
        updated.description = msg === "skip" || msg === "lewati" || msg === "nanti" ? "" : userMessage.trim();
        nextStep = "phone";
      }
      break;
    }
    case "phone": {
      // Validate phone: +62xxx, 08xxx, or any 8+ digit number
      const phone = userMessage.trim().replace(/\s/g, "");
      const phoneRegex = /^(\+62|62|08|8)\d{7,12}$/;
      if (phoneRegex.test(phone) || phone.match(/^\+?\d{8,15}$/)) {
        updated.phone = phone;
        nextStep = "complete";
      }
      break;
    }
    case "complete": {
      // Already done
      break;
    }
  }

  return { nextStep, updatedContext: updated };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message = "", step = "language", context = {} } = body as {
      message: string;
      step: string;
      context: Record<string, string>;
    };

    // Detect what step we should move to based on user's message
    const { nextStep, updatedContext } = detectNextStep(step, message, context);

    // If step is complete, save to DB
    if (nextStep === "complete" && step === "phone") {
      try {
        const seller = await getDemoSeller();
        const storeSlug = updatedContext.storeSlug || generateSlug(updatedContext.storeName || "toko-nemu");

        await db
          .update(sellers)
          .set({
            storeName: updatedContext.storeName || seller.storeName,
            storeSlug,
            category: updatedContext.category || seller.category,
            description: updatedContext.description || null,
            phone: updatedContext.phone || null,
            onboardingCompleted: true,
            onboardingComplete: true,
            updatedAt: new Date(),
          })
          .where(eq(sellers.id, seller.id));
      } catch (dbErr) {
        console.error("DB update error:", dbErr);
      }
    }

    // Build the prompt for THIS step (the next step we're executing)
    const activeStep = nextStep;
    const systemPrompt = buildSystemPrompt(activeStep, updatedContext);

    // Build messages array — merge system into first user message (MiniMax requirement)
    const isFirstMessage = !message || message.trim() === "";
    const apiMessages = isFirstMessage
      ? [
          {
            role: "user",
            content: `[Instruksi Sistem]\n${systemPrompt}\n\n[Pesan Penjual]\nMulai percakapan sekarang.`,
          },
        ]
      : [
          {
            role: "user",
            content: `[Instruksi Sistem]\n${systemPrompt}\n\n[Pesan Penjual]\n${message}`,
          },
        ];

    const apiKey = process.env.MINIMAX_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "MiniMax API key not configured" }, { status: 500 });
    }

    // Call MiniMax streaming
    const minimaxRes = await fetch("https://api.minimax.io/v1/text/chatcompletion_v2", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "MiniMax-Text-01",
        messages: apiMessages,
        stream: true,
        max_tokens: 300,
        temperature: 0.8,
      }),
    });

    if (!minimaxRes.ok) {
      const errText = await minimaxRes.text();
      console.error("MiniMax error:", errText);
      // Fallback: return a non-streaming default response
      const fallbackMsg = getFallbackMessage(activeStep, updatedContext);
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            new TextEncoder().encode(
              `data: ${JSON.stringify({ text: fallbackMsg })}\n\ndata: [DONE]\n\n`
            )
          );
          controller.close();
        },
      });
      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "X-Next-Step": nextStep,
          "X-Context": JSON.stringify(updatedContext),
        },
      });
    }

    // Stream the response from MiniMax through to client
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    (async () => {
      const reader = minimaxRes.body?.getReader();
      const decoder = new TextDecoder();

      try {
        while (reader) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6).trim();
              if (data === "[DONE]") {
                await writer.write(encoder.encode("data: [DONE]\n\n"));
                break;
              }
              try {
                const parsed = JSON.parse(data);
                // MiniMax streaming format: choices[0].delta.content
                const content =
                  parsed?.choices?.[0]?.delta?.content ||
                  parsed?.choices?.[0]?.text ||
                  parsed?.text ||
                  "";
                if (content) {
                  await writer.write(
                    encoder.encode(`data: ${JSON.stringify({ text: content })}\n\n`)
                  );
                }
              } catch {
                // Skip malformed lines
              }
            }
          }
        }
      } finally {
        await writer.close();
      }
    })();

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Next-Step": nextStep,
        "X-Context": JSON.stringify(updatedContext),
      },
    });
  } catch (err) {
    console.error("Onboarding chat error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function getFallbackMessage(step: string, context: Record<string, string>): string {
  switch (step) {
    case "language":
      return "Halo! Selamat datang di Nemu AI 👋 Mau pakai Bahasa Indonesia atau English? / Hello! Welcome to Nemu AI 👋 Would you like to continue in Bahasa Indonesia or English?";
    case "welcome":
      return "Seru banget! Yuk kita setup toko kamu sekarang — cuma butuh 2 menit ⚡ Kira-kira nama toko kamu apa?";
    case "store_name":
      return context.storeName
        ? `Keren! Toko "${context.storeName}" siap meluncur 🚀 Sekarang, pilih kategori produk kamu: Fashion & Pakaian, Makanan & Minuman, Elektronik, Kecantikan & Perawatan, Kerajinan & Hobi, atau Lainnya?`
        : "Hmm, nama tokonya minimal 3 karakter ya 😊 Contoh: 'Toko Baju Keren' atau 'Dapur Mama Rini'. Nama toko kamu apa?";
    case "category":
      return `Pilihan bagus! 🎯 Sekarang, ceritakan sedikit tentang tokomu — jual apa, untuk siapa? Boleh skip kalau mau, bisa diisi nanti 😊`;
    case "description":
      return "Oke, noted! 📝 Satu lagi — berapa nomor WhatsApp kamu? Format: +62xxx atau 08xxx. Ini buat pembeli bisa langsung hubungi kamu 📱";
    case "phone":
      return `🎉 SELAMAT! Toko ${context.storeName || "kamu"} sudah AKTIF! Kamu luar biasa! Sekarang saatnya tambah produk pertamamu dan mulai jualan 🚀`;
    case "complete":
      return `🎊 Toko ${context.storeName || "kamu"} sudah siap menerima pembeli! Yuk langsung buka dashboard dan tambah produk pertamamu! 🛍️`;
    default:
      return "Oke! Lanjut ke langkah berikutnya 😊";
  }
}
