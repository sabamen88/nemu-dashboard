"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface StorePreview {
  storeName: string;
  category: string;
  description: string;
  productName: string;
  productPrice: string;
}

const ONBOARDING_SYSTEM = `Kamu adalah Nemu Assistant, asisten AI untuk platform Nemu — marketplace generasi baru di Indonesia.
Tugasmu: membantu penjual baru (seller) mendaftarkan toko mereka, mengisi katalog produk, dan memahami fitur Nemu.

Panduan onboarding:
1. Sambut penjual baru dan tanyakan nama toko mereka
2. Bantu isi profil toko (nama, deskripsi, kategori)
3. Panduan upload produk pertama (nama, harga, stok, foto)
4. Jelaskan fitur AI Agent — bagaimana agent bisa menjawab pesan pembeli otomatis
5. Jelaskan Nemu Wallet (USDC) — untuk transaksi agen di masa depan
6. Selamat! Toko siap. Bagikan link toko mereka.

Selalu ramah, singkat, dan praktis. Gunakan emoji sesekali 🎉. Jangan terlalu panjang. Maksimal 4 kalimat per balasan.`;

const STEPS = [
  { id: "store", label: "Setup Toko", icon: "🏪" },
  { id: "catalog", label: "Katalog", icon: "📦" },
  { id: "agent", label: "AI Agent", icon: "🤖" },
  { id: "done", label: "Selesai!", icon: "✅" },
];

const INITIAL_MESSAGE: Message = {
  id: "init",
  role: "assistant",
  content: "Halo! Selamat datang di **Nemu AI** 🎉\n\nSaya Nemu Assistant, siap bantu kamu membangun toko online pertama di platform Nemu.\n\nMulai dari mana? Ceritakan nama toko kamu!",
};

const QUICK_STARTS = [
  "Saya mau jualan fashion 👗",
  "Toko makanan & minuman 🍜",
  "Jualan elektronik 📱",
  "Toko kecantikan 💄",
];

export default function OnboardingPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [preview, setPreview] = useState<StorePreview>({
    storeName: "Toko Kamu",
    category: "Umum",
    description: "Ceritakan tentang toko kamu...",
    productName: "",
    productPrice: "",
  });
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Extract store info from conversation
  useEffect(() => {
    const allText = messages.map((m) => m.content).join(" ");
    // Simple heuristic: look for patterns
    const nameMatch = allText.match(/toko[^,.\n]*?([\w\s]{3,30})/i);
    if (nameMatch && messages.length > 2) {
      setPreview((p) => ({ ...p, storeName: nameMatch[1].trim() }));
    }

    // Step progression
    if (messages.length >= 8) setCurrentStep(3);
    else if (messages.length >= 5) setCurrentStep(2);
    else if (messages.length >= 3) setCurrentStep(1);
    else setCurrentStep(0);
  }, [messages]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    const assistantId = `a-${Date.now()}`;
    setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }]);

    try {
      // Build API messages with system prompt merged into first user message
      const apiMessages = newMessages.map((m, i) => {
        if (m.role === "user" && i === newMessages.findIndex((x) => x.role === "user")) {
          return {
            role: "user",
            content: `[Instruksi Sistem]\n${ONBOARDING_SYSTEM}\n\n[Pesan Penjual]\n${m.content}`,
          };
        }
        return { role: m.role, content: m.content };
      });

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages }),
      });

      if (!res.ok) throw new Error("Chat error");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let full = "";

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value).split("\n")) {
          if (line.startsWith("data: ") && line !== "data: [DONE]") {
            try {
              const d = JSON.parse(line.slice(6));
              if (d.text) {
                full += d.text;
                setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, content: full } : m));
              }
            } catch {}
          }
        }
      }

      // Update preview from AI response
      if (full.toLowerCase().includes("nama toko") || full.toLowerCase().includes("toko kamu")) {
        // Try to extract from user messages
        const lastUserMsg = newMessages.filter(m => m.role === "user").pop();
        if (lastUserMsg) {
          setPreview(p => ({ ...p, storeName: lastUserMsg.content.slice(0, 20) }));
        }
      }
    } catch {
      setMessages((prev) =>
        prev.map((m) => m.id === assistantId ? { ...m, content: "Maaf ada gangguan. Coba lagi ya 🙏" } : m)
      );
    } finally {
      setLoading(false);
    }
  }, [messages, loading]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  function renderContent(content: string) {
    return content.split("**").map((part, i) =>
      i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left: Chat */}
      <div className="flex-1 flex flex-col min-w-0 max-w-2xl mx-auto lg:mx-0 lg:max-w-none lg:w-1/2">
        {/* Header */}
        <div className="p-4 bg-white border-b border-gray-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #E91E63, #C2185B)" }}>
            <span className="text-white font-bold text-sm">N</span>
          </div>
          <div>
            <span className="font-bold text-lg" style={{ color: "#E91E63" }}>nemu</span>
            <span className="font-bold text-lg text-gray-900">AI</span>
            <span className="text-gray-400 text-sm ml-2">· Onboarding</span>
          </div>
          <button
            onClick={() => router.push("/dashboard")}
            className="ml-auto text-sm text-gray-400 hover:text-gray-600 transition px-3 py-1.5 rounded-lg hover:bg-gray-100"
          >
            Lewati →
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-4 py-3 bg-white border-b border-gray-100">
          <div className="flex items-center gap-1">
            {STEPS.map((step, i) => (
              <div key={step.id} className="flex items-center gap-1 flex-1">
                <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  i <= currentStep
                    ? "text-white"
                    : "bg-gray-100 text-gray-400"
                }`} style={i <= currentStep ? { backgroundColor: "#E91E63" } : {}}>
                  <span>{step.icon}</span>
                  <span className="hidden sm:inline">{step.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 rounded-full transition-all ${i < currentStep ? "bg-pink-300" : "bg-gray-200"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg mr-2 flex-shrink-0 mt-1"
                  style={{ background: "linear-gradient(135deg, #E91E63, #C2185B)" }}>
                  🤖
                </div>
              )}
              <div className={`max-w-[80%]`}>
                <div className={`px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed ${
                  msg.role === "user"
                    ? "text-white rounded-tr-sm"
                    : "bg-white text-gray-800 rounded-tl-sm shadow-sm border border-gray-100"
                }`} style={msg.role === "user" ? { backgroundColor: "#E91E63" } : {}}>
                  {msg.content === "" && loading ? (
                    <span className="flex gap-1 items-center">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </span>
                  ) : renderContent(msg.content)}
                </div>
              </div>
            </div>
          ))}

          {/* Quick starts — only on first message */}
          {messages.length === 1 && !loading && (
            <div className="flex flex-wrap gap-2 pl-10 mt-1">
              {QUICK_STARTS.map((qs) => (
                <button
                  key={qs}
                  onClick={() => sendMessage(qs)}
                  className="text-sm px-3 py-1.5 rounded-full border-2 font-medium transition hover:text-white hover:border-transparent"
                  style={{ borderColor: "#E91E63", color: "#E91E63" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#E91E63";
                    (e.currentTarget as HTMLButtonElement).style.color = "white";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = "";
                    (e.currentTarget as HTMLButtonElement).style.color = "#E91E63";
                  }}
                >
                  {qs}
                </button>
              ))}
            </div>
          )}

          {/* Finish button */}
          {currentStep === 3 && (
            <div className="flex justify-center mt-4">
              <button
                onClick={async () => {
                  try {
                    await fetch("/api/seller", {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ onboardingComplete: true }),
                    });
                  } catch {}
                  router.push("/dashboard");
                }}
                className="px-8 py-3 text-white font-semibold rounded-2xl shadow-lg transition hover:opacity-90 text-sm"
                style={{ background: "linear-gradient(135deg, #E91E63, #C2185B)" }}
              >
                🚀 Buka Dashboard Toko
              </button>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t border-gray-100">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ketik pesan kamu..."
              disabled={loading}
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 bg-gray-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white transition hover:opacity-90 disabled:opacity-40 flex-shrink-0"
              style={{ backgroundColor: "#E91E63" }}
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Right: Live Preview — hidden on mobile */}
      <div className="hidden lg:flex w-1/2 flex-col bg-white border-l border-gray-100 p-8">
        <h2 className="font-bold text-gray-900 text-lg mb-2">📱 Preview Toko</h2>
        <p className="text-gray-400 text-sm mb-6">Update otomatis saat kamu mengisi info toko</p>

        {/* Phone mockup */}
        <div className="flex-1 flex items-center justify-center">
          <div className="w-64 bg-white rounded-3xl shadow-2xl border-8 border-gray-900 overflow-hidden relative"
            style={{ height: 500 }}>
            {/* Status bar */}
            <div className="bg-gray-900 text-white text-xs py-1 px-4 flex justify-between">
              <span>9:41</span>
              <span>●●●</span>
            </div>

            {/* Store header */}
            <div className="px-4 py-3 border-b" style={{ background: "linear-gradient(135deg, #E91E63, #C2185B)" }}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {preview.storeName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-white text-xs font-bold truncate max-w-[140px]">{preview.storeName}</p>
                  <p className="text-pink-200 text-[10px]">{preview.category}</p>
                </div>
              </div>
            </div>

            {/* Store content */}
            <div className="p-3 space-y-2">
              <p className="text-[10px] text-gray-500 line-clamp-2">{preview.description}</p>

              <div className="grid grid-cols-2 gap-2 mt-2">
                {/* Product placeholders */}
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-gray-50 rounded-xl overflow-hidden border border-gray-100">
                    <div className="h-16 bg-gradient-to-br from-pink-50 to-pink-100 flex items-center justify-center">
                      {i === 1 && preview.productName ? (
                        <span className="text-2xl">📦</span>
                      ) : (
                        <div className="w-8 h-8 bg-gray-200 rounded-lg" />
                      )}
                    </div>
                    <div className="p-1.5">
                      <div className={`h-2 rounded ${i === 1 && preview.productName ? "bg-gray-700" : "bg-gray-200"}`}
                        style={{ width: i === 1 && preview.productName ? "100%" : `${50 + i * 10}%` }} />
                      <div className="h-2 bg-pink-200 rounded mt-1 w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom nav */}
            <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around py-2 px-1">
              {["🏠", "🔍", "🛒", "👤"].map((icon) => (
                <div key={icon} className="text-sm">{icon}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Steps Checklist */}
        <div className="mt-6 space-y-2">
          <p className="text-sm font-semibold text-gray-700 mb-3">Progres Setup</p>
          {STEPS.map((step, i) => (
            <div key={step.id} className="flex items-center gap-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                i < currentStep
                  ? "bg-green-500 text-white"
                  : i === currentStep
                  ? "text-white"
                  : "bg-gray-100 text-gray-400"
              }`} style={i === currentStep ? { backgroundColor: "#E91E63" } : {}}>
                {i < currentStep ? "✓" : step.icon}
              </div>
              <span className={`text-sm ${i <= currentStep ? "text-gray-800 font-medium" : "text-gray-400"}`}>
                {step.label}
              </span>
              {i === currentStep && (
                <span className="ml-auto text-xs text-pink-500 font-medium animate-pulse">Sedang berlangsung</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
