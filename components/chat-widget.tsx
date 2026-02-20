"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

const SYSTEM_PROMPT = `Kamu adalah Nemu Assistant, asisten AI untuk platform Nemu — marketplace generasi baru di Indonesia.
Tugasmu: membantu penjual baru (seller) mendaftarkan toko mereka, mengisi katalog produk, dan memahami fitur Nemu.

Panduan onboarding:
1. Sambut penjual baru dan tanyakan nama toko mereka
2. Bantu isi profil toko (nama, deskripsi, kategori)
3. Panduan upload produk pertama (nama, harga, stok, foto)
4. Jelaskan fitur AI Agent — bagaimana agent bisa menjawab pesan pembeli otomatis
5. Jelaskan Nemu Wallet (USDC) — untuk transaksi agen di masa depan
6. Selamat! Toko siap. Bagikan link toko mereka.

Selalu ramah, singkat, dan praktis. Gunakan emoji sesekali 🎉. Jangan terlalu panjang.`;

const QUICK_REPLIES = [
  "Mulai setup toko 🏪",
  "Tanya tentang AI Agent 🤖",
  "Tentang Nemu Wallet 💰",
  "Cara tambah produk? 📦",
];

const STORAGE_KEY = "nemu_chat_history";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Message[];
        setMessages(parsed);
      } else {
        // First time: show welcome message
        const welcome: Message = {
          id: "welcome",
          role: "assistant",
          content: "Halo! Saya **Nemu Assistant** 👋\n\nSiap bantu kamu memaksimalkan toko di Nemu AI. Mau mulai dari mana?",
          timestamp: Date.now(),
        };
        setMessages([welcome]);
      }
    } catch {}
  }, []);

  // Save to localStorage whenever messages change
  useEffect(() => {
    if (messages.length === 0) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-50)));
    } catch {}
  }, [messages]);

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  // Track unread
  useEffect(() => {
    if (!open) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.role === "assistant") {
        setUnread((n) => n + 1);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  function handleOpen() {
    setOpen(true);
    setUnread(0);
    setTimeout(() => inputRef.current?.focus(), 300);
  }

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || loading) return;

      const userMsg: Message = {
        id: Date.now().toString(),
        role: "user",
        content: text.trim(),
        timestamp: Date.now(),
      };

      const newMessages = [...messages, userMsg];
      setMessages(newMessages);
      setInput("");
      setLoading(true);

      const assistantId = `asst-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "", timestamp: Date.now() },
      ]);

      try {
        // Build history for API: apply system prompt to first user message
        const apiMessages = newMessages.map((m, i) => {
          if (m.role === "user" && i === 0) {
            return { role: "user", content: `[Instruksi Sistem]\n${SYSTEM_PROMPT}\n\n[Pesan]\n${m.content}` };
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
          const chunk = decoder.decode(value);
          for (const line of chunk.split("\n")) {
            if (line.startsWith("data: ") && line !== "data: [DONE]") {
              try {
                const d = JSON.parse(line.slice(6));
                if (d.text) {
                  full += d.text;
                  setMessages((prev) =>
                    prev.map((m) => (m.id === assistantId ? { ...m, content: full } : m))
                  );
                }
              } catch {}
            }
          }
        }
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: "Maaf, ada masalah koneksi. Coba lagi ya 🙏" }
              : m
          )
        );
      } finally {
        setLoading(false);
      }
    },
    [messages, loading]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await sendMessage(input);
  }

  function clearHistory() {
    localStorage.removeItem(STORAGE_KEY);
    const welcome: Message = {
      id: "welcome-" + Date.now(),
      role: "assistant",
      content: "Chat direset! Halo lagi 👋 Ada yang bisa saya bantu?",
      timestamp: Date.now(),
    };
    setMessages([welcome]);
  }

  function renderContent(content: string) {
    // Simple bold rendering
    return content.split("**").map((part, i) =>
      i % 2 === 1 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>
    );
  }

  const showQuickReplies = messages.length <= 1;

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={handleOpen}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-white transition-all duration-300 hover:scale-110 ${open ? "scale-0 opacity-0" : "scale-100 opacity-100"}`}
        style={{ background: "linear-gradient(135deg, #E91E63, #C2185B)" }}
        aria-label="Buka Nemu Assistant"
      >
        <span className="text-2xl">🤖</span>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {/* Chat Panel */}
      <div
        className={`fixed bottom-6 right-6 z-50 flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-100 transition-all duration-300 origin-bottom-right ${
          open
            ? "w-[380px] h-[580px] scale-100 opacity-100"
            : "w-14 h-14 scale-0 opacity-0 pointer-events-none"
        }`}
        style={{ maxWidth: "calc(100vw - 48px)", maxHeight: "calc(100vh - 96px)" }}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-t-2xl"
          style={{ background: "linear-gradient(135deg, #E91E63, #C2185B)" }}
        >
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-xl flex-shrink-0">
            🤖
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm">Nemu Assistant</p>
            <p className="text-pink-200 text-xs">
              {loading ? "Sedang mengetik..." : "Online · Siap membantu"}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={clearHistory}
              className="text-white/60 hover:text-white/90 transition text-xs px-2 py-1 rounded-lg hover:bg-white/10"
              title="Reset chat"
            >
              🗑️
            </button>
            <button
              onClick={() => setOpen(false)}
              className="text-white/60 hover:text-white/90 transition p-1 rounded-lg hover:bg-white/10"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-sm mr-2 flex-shrink-0 mt-1"
                  style={{ background: "linear-gradient(135deg, #E91E63, #C2185B)" }}>
                  🤖
                </div>
              )}
              <div className={`max-w-[75%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col`}>
                <div
                  className={`px-3.5 py-2.5 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed ${
                    msg.role === "user"
                      ? "text-white rounded-tr-sm"
                      : "bg-gray-100 text-gray-800 rounded-tl-sm"
                  }`}
                  style={msg.role === "user" ? { backgroundColor: "#E91E63" } : {}}
                >
                  {msg.content === "" && loading ? (
                    <span className="flex gap-1 items-center py-0.5">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </span>
                  ) : (
                    renderContent(msg.content)
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Quick Replies */}
          {showQuickReplies && !loading && (
            <div className="flex flex-wrap gap-2 mt-2">
              {QUICK_REPLIES.map((qr) => (
                <button
                  key={qr}
                  onClick={() => sendMessage(qr)}
                  className="text-xs px-3 py-1.5 rounded-full border font-medium transition hover:text-white hover:border-transparent"
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
                  {qr}
                </button>
              ))}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-gray-100">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tanya Nemu Assistant..."
              disabled={loading}
              className="flex-1 px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 bg-gray-50 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white transition hover:opacity-90 disabled:opacity-40 flex-shrink-0"
              style={{ backgroundColor: "#E91E63" }}
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              )}
            </button>
          </form>
          <p className="text-xs text-gray-400 text-center mt-2">
            Nemu Assistant · MiniMax M2.5
          </p>
        </div>
      </div>
    </>
  );
}
