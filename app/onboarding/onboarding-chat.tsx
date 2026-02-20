"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

interface ChatMessage {
  id: string;
  role: "ai" | "user";
  content: string;
}

const STEPS = [
  { id: "language", label: "Mulai" },
  { id: "store_name", label: "Nama Toko" },
  { id: "category", label: "Kategori" },
  { id: "description", label: "Deskripsi" },
  { id: "phone", label: "WhatsApp" },
];

const CATEGORIES = [
  "Fashion & Pakaian",
  "Makanan & Minuman",
  "Elektronik",
  "Kecantikan & Perawatan",
  "Kerajinan & Hobi",
  "Lainnya",
];

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#7B5CF0' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
          <path d="M12 2 L13.5 9.5 L21 11 L13.5 12.5 L12 20 L10.5 12.5 L3 11 L10.5 9.5 Z"/>
          <circle cx="7" cy="4" r="1" fill="white" opacity="0.7"/>
          <circle cx="17" cy="4" r="1" fill="white" opacity="0.7"/>
          <circle cx="7" cy="18" r="1" fill="white" opacity="0.7"/>
          <circle cx="17" cy="18" r="1" fill="white" opacity="0.7"/>
        </svg>
      </div>
      <div className="bg-white border border-gray-100 shadow-sm px-4 py-3 rounded-2xl rounded-bl-sm">
        <span className="flex gap-1.5 items-center h-4">
          <span
            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <span
            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </span>
      </div>
    </div>
  );
}

export default function OnboardingChat() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [step, setStep] = useState("language");
  const [context, setContext] = useState<Record<string, string>>({});
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [done, setDone] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasInitialized = useRef(false);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  }, []);

  const sendToAPI = useCallback(
    async (message: string, currentStep: string, currentContext: Record<string, string>) => {
      setIsTyping(true);
      setLoading(true);

      const aiMsgId = `ai-${Date.now()}`;

      try {
        const res = await fetch("/api/onboarding/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message, step: currentStep, context: currentContext }),
        });

        if (!res.ok) throw new Error("API error");

        // Read next step from headers
        const nextStep = res.headers.get("X-Next-Step") || currentStep;
        const contextHeader = res.headers.get("X-Context");
        if (contextHeader) {
          try {
            const newCtx = JSON.parse(contextHeader);
            setContext(newCtx);
            currentContext = newCtx;
          } catch {}
        }
        setStep(nextStep);

        // Stream the response
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let fullContent = "";

        setIsTyping(false);
        setMessages((prev) => [...prev, { id: aiMsgId, role: "ai", content: "" }]);
        scrollToBottom();

        while (reader) {
          const { done: streamDone, value } = await reader.read();
          if (streamDone) break;

          const chunk = decoder.decode(value, { stream: true });
          for (const line of chunk.split("\n")) {
            if (line.startsWith("data: ") && line !== "data: [DONE]") {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.text) {
                  fullContent += data.text;
                  setMessages((prev) =>
                    prev.map((m) => (m.id === aiMsgId ? { ...m, content: fullContent } : m))
                  );
                  scrollToBottom();
                }
              } catch {}
            }
          }
        }

        // Check if we've completed onboarding
        if (nextStep === "complete") {
          setDone(true);
          setTimeout(() => {
            router.push("/dashboard");
          }, 3000);
        }
      } catch {
        setIsTyping(false);
        setMessages((prev) => [
          ...prev,
          {
            id: aiMsgId,
            role: "ai",
            content: "Maaf ada gangguan teknis 🙏 Coba lagi ya!",
          },
        ]);
      } finally {
        setLoading(false);
        setIsTyping(false);
        scrollToBottom();
        // Re-focus input
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    },
    [router, scrollToBottom]
  );

  // Trigger opening message on mount
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    // Small delay so the page loads first
    const timer = setTimeout(() => {
      sendToAPI("", "language", {});
    }, 400);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSend = useCallback(
    async (text: string) => {
      if (!text.trim() || loading) return;

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: text.trim(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      scrollToBottom();

      await sendToAPI(text.trim(), step, context);
    },
    [loading, step, context, sendToAPI, scrollToBottom]
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    handleSend(input);
  }

  const stepIndex = step === "complete" ? STEPS.length : Math.max(0, STEPS.findIndex((s) => s.id === step));
  const progressPercent = Math.round((stepIndex / STEPS.length) * 100);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          {/* Logo */}
          <img
            src="https://cdn.jsdelivr.net/gh/sabamen88/nemu-assets@main/brand/nemu-logo.png"
            alt="Nemu AI"
            className="h-8 w-auto flex-shrink-0 object-contain"
          />
          <div className="flex-1 min-w-0">
            <p className="text-gray-500 text-xs font-medium">Setup toko — cuma 2 menit 🛍️</p>
          </div>
          <button
            onClick={() => router.push("/dashboard?skip_onboarding=1")}
            className="text-xs font-medium text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 hover:text-indigo-600 hover:border-indigo-200 transition flex-shrink-0"
          >
            Lewati
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-full transition-all duration-700 ease-out"
            style={{ width: `${progressPercent}%`, backgroundColor: "#7B5CF0" }}
          />
        </div>

        {/* Step dots — 5 steps */}
        <div className="max-w-lg mx-auto px-6 py-2.5 flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2 flex-1">
              <div
                className="h-1.5 flex-1 rounded-full transition-all duration-500"
                style={{ backgroundColor: i <= stepIndex ? "#7B5CF0" : "#E5E7EB" }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 py-4 space-y-3 pb-36">

          {/* Welcome hero — disappears after first user message */}
          {messages.filter(m => m.role === "user").length === 0 && (
            <div className="flex flex-col items-center text-center pt-6 pb-4">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4 shadow-md" style={{ background: "linear-gradient(135deg, #7B5CF0, #625fff)" }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="white">
                  <path d="M12 2 L13.5 9.5 L21 11 L13.5 12.5 L12 20 L10.5 12.5 L3 11 L10.5 9.5 Z"/>
                  <circle cx="7" cy="4" r="1" fill="white" opacity="0.7"/>
                  <circle cx="17" cy="4" r="1" fill="white" opacity="0.7"/>
                  <circle cx="7" cy="18" r="1" fill="white" opacity="0.7"/>
                  <circle cx="17" cy="18" r="1" fill="white" opacity="0.7"/>
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900">Selamat Datang di Nemu AI! 👋</h2>
              <p className="text-gray-500 text-sm mt-2 max-w-xs">Saya KIRA, asisten AI kamu. Buka toko online dalam 2 menit — tanpa ribet, tanpa formulir!</p>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-end gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "ai" && (
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#7B5CF0' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                    <path d="M12 2 L13.5 9.5 L21 11 L13.5 12.5 L12 20 L10.5 12.5 L3 11 L10.5 9.5 Z"/>
                    <circle cx="7" cy="4" r="1" fill="white" opacity="0.7"/>
                    <circle cx="17" cy="4" r="1" fill="white" opacity="0.7"/>
                    <circle cx="7" cy="18" r="1" fill="white" opacity="0.7"/>
                    <circle cx="17" cy="18" r="1" fill="white" opacity="0.7"/>
                  </svg>
                </div>
              )}
              <div className={`max-w-[82%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col`}>
                <div
                  className={`px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "text-white rounded-2xl rounded-br-sm shadow-sm"
                      : "bg-white text-gray-800 rounded-2xl rounded-bl-sm shadow-sm border border-gray-100"
                  }`}
                  style={msg.role === "user" ? { backgroundColor: "#7B5CF0" } : {}}
                >
                  {msg.content || (
                    <span className="flex gap-1.5 items-center h-4">
                      <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* AI typing indicator */}
          {isTyping && <TypingIndicator />}

          {/* Language tap buttons — shown instead of typing */}
          {step === "language" && !loading && messages.filter(m => m.role === "ai").length > 0 && (
            <div className="flex gap-3 mt-2">
              <button
                onClick={() => handleSend("Indonesia")}
                className="flex-1 py-3.5 rounded-2xl border-2 font-semibold text-sm transition-all active:scale-95 hover:shadow-md"
                style={{ borderColor: "#7B5CF0", color: "#7B5CF0", backgroundColor: "#faf5ff" }}
              >
                🇮🇩 Bahasa Indonesia
              </button>
              <button
                onClick={() => handleSend("English")}
                className="flex-1 py-3.5 rounded-2xl border-2 border-gray-200 font-semibold text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-95 hover:shadow-md"
              >
                🇺🇸 English
              </button>
            </div>
          )}

          {/* Category quick reply chips */}
          {step === "category" && !loading && messages.length > 0 && (
            <div className="flex flex-wrap gap-2 pl-10 mt-1">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleSend(cat)}
                  className="text-sm px-3 py-1.5 rounded-full border-2 font-medium transition-all hover:text-white hover:shadow-md active:scale-95"
                  style={{
                    borderColor: "#7B5CF0",
                    color: "#7B5CF0",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = "#7B5CF0";
                    (e.currentTarget as HTMLElement).style.color = "white";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = "";
                    (e.currentTarget as HTMLElement).style.color = "#7B5CF0";
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Skip button for description step */}
          {step === "description" && !loading && messages.length > 0 && (
            <div className="flex pl-10 mt-1">
              <button
                onClick={() => handleSend("skip")}
                className="text-sm px-4 py-1.5 rounded-full border border-gray-300 text-gray-400 hover:border-gray-400 hover:text-gray-500 transition-all"
              >
                Lewati dulu, isi nanti →
              </button>
            </div>
          )}

          {/* Completion celebration */}
          {done && (
            <div className="flex justify-center my-4">
              <div
                className="w-full max-w-sm px-6 py-5 rounded-2xl text-center text-white shadow-lg"
                style={{ background: "linear-gradient(135deg, #7B5CF0, #625fff)" }}
              >
                <div className="text-3xl mb-2">🎉🎊🚀</div>
                <p className="font-bold text-base">
                  {context.storeName ? `Toko "${context.storeName}" sudah AKTIF!` : "Toko kamu sudah AKTIF!"}
                </p>
                <div className="mt-3 mb-3 bg-white/20 rounded-xl px-4 py-3">
                  <p className="text-indigo-100 text-xs mb-1">Toko ID kamu</p>
                  <p className="font-mono font-black text-xl tracking-widest">
                    {/* Show a preview of what the Toko ID will be */}
                    {context.storeName
                      ? context.storeName.trim().split(/\s+/).filter(w => !['toko','store','shop','warung','kios'].includes(w.toLowerCase())).join('').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,9) || context.storeName.slice(0,9).toUpperCase()
                      : "—"}
                  </p>
                  <p className="text-indigo-200 text-[10px] mt-1">Toko ID kamu akan tampil di dashboard</p>
                </div>
                <p className="text-indigo-200 text-xs mt-1">Mengalihkan ke dashboard...</p>
                <div className="mt-2 h-1 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full"
                    style={{ animation: "progress-fill 3s linear forwards" }}
                  />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input bar — fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-lg mx-auto px-4 py-3">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                step === "language"
                  ? "Ketik 'Indonesia' atau 'English'..."
                  : step === "store_name"
                  ? "Nama toko kamu..."
                  : step === "phone"
                  ? "08xxx atau +62xxx"
                  : "Ketik pesan kamu..."
              }
              disabled={loading || done}
              autoComplete="off"
              className="flex-1 px-4 py-3 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:border-transparent bg-gray-50 disabled:opacity-60"
              style={{ "--tw-ring-color": "#7B5CF0" } as React.CSSProperties}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading || done}
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-white transition-all hover:opacity-90 disabled:opacity-40 active:scale-95 flex-shrink-0 shadow-sm"
              style={{ backgroundColor: "#7B5CF0" }}
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              )}
            </button>
          </form>
          <p className="text-center text-[10px] text-gray-400 mt-1.5">
            Nemu AI · Powered by MiniMax
          </p>
        </div>
      </div>

      <style jsx global>{`
        @keyframes progress-fill {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
}
