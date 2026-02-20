"use client";

export const dynamic = "force-dynamic";

import { useState, useRef, useEffect } from "react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

const DEMO_BUYERS = [
  { id: "1", name: "+62 812-3456-7890", preview: "Ada kaos putih ukuran M?", unread: 2, active: true },
  { id: "2", name: "+62 857-9876-5432", preview: "Berapa ongkirnya ke Surabaya?", unread: 0, active: false },
  { id: "3", name: "+62 821-1111-2222", preview: "Stok celana jeans masih ada?", unread: 1, active: false },
];

export default function MessagesPage() {
  const [selectedBuyer, setSelectedBuyer] = useState(DEMO_BUYERS[0]);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "user",
      content: "Halo kak, ada kaos putih ukuran M gak?",
      timestamp: new Date(Date.now() - 5 * 60000),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"buyer" | "owner">("buyer");
  const [agentEnabled, setAgentEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    // Add streaming assistant message
    const assistantId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: assistantId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
    }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) throw new Error("Chat API failed");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let full = "";

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ") && line !== "data: [DONE]") {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.text) {
                full += data.text;
                setMessages(prev => prev.map(m =>
                  m.id === assistantId ? { ...m, content: full } : m
                ));
              }
            } catch {}
          }
        }
      }
    } catch (err) {
      setMessages(prev => prev.map(m =>
        m.id === assistantId
          ? { ...m, content: "Maaf, agen sedang tidak bisa diakses. Coba lagi ya kak 🙏" }
          : m
      ));
    } finally {
      setLoading(false);
    }
  }

  function formatTime(d: Date) {
    return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="flex h-full bg-white overflow-hidden">
      {/* Left: Conversation List */}
      <div className={`${mobileShowChat ? 'hidden' : 'flex'} sm:flex flex-col w-full sm:w-80 border-r border-gray-100 flex-shrink-0`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">Pesan Pembeli</h2>
            <span className="text-xs bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full font-medium">
              {DEMO_BUYERS.reduce((a, b) => a + b.unread, 0)} baru
            </span>
          </div>
          {/* Mode Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setMode("buyer")}
              className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition-colors ${
                mode === "buyer"
                  ? "text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
              style={mode === "buyer" ? { backgroundColor: '#7B5CF0' } : {}}
            >
              🛍️ Pembeli
            </button>
            <button
              onClick={() => setMode("owner")}
              className={`flex-1 text-xs py-1.5 rounded-lg font-medium transition-colors ${
                mode === "owner"
                  ? "text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
              style={mode === "owner" ? { backgroundColor: '#7B5CF0' } : {}}
            >
              👤 Penjual
            </button>
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {DEMO_BUYERS.map((buyer) => (
            <button
              key={buyer.id}
              onClick={() => { setSelectedBuyer(buyer); setMobileShowChat(true); }}
              className={`w-full p-4 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 ${
                selectedBuyer.id === buyer.id ? "bg-indigo-50 border-l-2 border-l-indigo-500" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {buyer.name.slice(-4, -2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 truncate">{buyer.name}</span>
                    {buyer.unread > 0 && (
                      <span className="text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#7B5CF0' }}>
                        {buyer.unread}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{buyer.preview}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Agent Toggle */}
        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-700">Auto-Reply AI</p>
              <p className="text-xs text-gray-500">{agentEnabled ? "Aktif — menjawab otomatis" : "Nonaktif"}</p>
            </div>
            <button
              onClick={() => setAgentEnabled(!agentEnabled)}
              className={`relative w-10 h-6 rounded-full transition-colors ${
                agentEnabled ? "bg-green-500" : "bg-gray-300"
              }`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                agentEnabled ? "left-5" : "left-1"
              }`} />
            </button>
          </div>
        </div>
      </div>

      {/* Right: Chat View */}
      <div className={`${!mobileShowChat ? 'hidden' : 'flex'} sm:flex flex-1 flex-col min-w-0`}>
        {/* Chat Header */}
        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
          <button
            onClick={() => setMobileShowChat(false)}
            className="sm:hidden p-2 -ml-1 rounded-lg hover:bg-gray-100 text-gray-600 transition mr-1"
          >
            ←
          </button>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
            {selectedBuyer.name.slice(-4, -2)}
          </div>
          <div>
            <p className="font-medium text-gray-900 text-sm">{selectedBuyer.name}</p>
            <p className="text-xs text-gray-500">via WhatsApp Business</p>
          </div>
          <div className="ml-auto flex items-center gap-2 flex-shrink-0">
            {agentEnabled && (
              <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full whitespace-nowrap">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                Agen aktif
              </span>
            )}
          </div>
        </div>

        {/* Mode Banner */}
        {mode === "buyer" && (
          <div className="mx-3 mt-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700 flex items-center gap-1.5">
            <span className="flex-shrink-0">🎭</span>
            <span className="truncate font-medium">Mode Simulasi Pembeli — ketik seperti pembeli sungguhan</span>
          </div>
        )}
        {mode === "owner" && (
          <div className="mx-3 mt-2 px-3 py-2 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-indigo-700 flex items-center gap-1.5">
            <span className="flex-shrink-0">👤</span>
            <span className="truncate font-medium">Mode Pemilik Toko — tanya laporan atau stok</span>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white text-xs mr-2 flex-shrink-0 mt-1">
                  🤖
                </div>
              )}
              <div className="max-w-xs lg:max-w-md">
                <div
                  className={`px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "text-white rounded-tr-sm"
                      : "bg-gray-100 text-gray-800 rounded-tl-sm"
                  }`}
                  style={msg.role === "user" ? { backgroundColor: '#7B5CF0' } : {}}
                >
                  {msg.content || (
                    <span className="flex gap-1 items-center">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </span>
                  )}
                </div>
                <p className={`text-xs text-gray-400 mt-1 ${msg.role === "user" ? "text-right" : "text-left"}`}>
                  {msg.role === "assistant" && "🤖 Agen AI · "}
                  {formatTime(msg.timestamp)}
                </p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-100">
          <form onSubmit={sendMessage} className="flex gap-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                mode === "buyer"
                  ? "Ketik sebagai pembeli..."
                  : "Tanya agen kamu..."
              }
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 bg-gray-50"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-40"
              style={{ backgroundColor: '#7B5CF0' }}
            >
              {loading ? "..." : "Kirim"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
