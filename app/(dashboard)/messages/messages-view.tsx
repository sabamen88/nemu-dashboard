"use client";

import { useState } from "react";

interface ConvMessage {
  id: string;
  content: string;
  direction: string;
  handledBy: string;
  createdAt: string; // ISO string
}

interface Conversation {
  phone: string;
  name: string;
  lastMessage: string;
  lastAt: string; // ISO string
  unreadCount: number;
  messages: ConvMessage[];
}

interface Props {
  conversations: Conversation[];
  agentActive: boolean;
}

function timeLabel(isoString: string): string {
  const now = new Date();
  const d = new Date(isoString);
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Baru saja";
  if (diffMin < 60) return `${diffMin}m lalu`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}j lalu`;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

export default function MessagesView({ conversations, agentActive }: Props) {
  const [selected, setSelected] = useState<Conversation | null>(
    conversations.length > 0 ? conversations[0] : null
  );
  const [searchQuery, setSearchQuery] = useState("");

  const filteredConvs = conversations.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
  );

  return (
    <div className="flex" style={{ height: '100vh' }}>
      {/* Left Panel — Conversation List */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col flex-shrink-0">
        {/* Header */}
        <div className="px-4 py-4 border-b border-gray-100">
          <h1 className="text-lg font-bold text-gray-900">Pesan WhatsApp</h1>
          <div className={`flex items-center gap-1.5 mt-1 text-xs font-medium ${
            agentActive ? "text-green-600" : "text-gray-400"
          }`}>
            <span>{agentActive ? "🟢" : "⚫"}</span>
            <span>{agentActive ? "Agen AI aktif — membalas otomatis" : "Agen AI nonaktif"}</span>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-gray-100">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 Cari percakapan..."
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-indigo-300"
          />
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {filteredConvs.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <div className="text-4xl mb-3">💬</div>
              <p className="text-sm font-medium">
                {conversations.length === 0
                  ? "Belum ada pesan masuk"
                  : "Tidak ada percakapan ditemukan"}
              </p>
            </div>
          ) : (
            filteredConvs.map((conv) => (
              <button
                key={conv.phone}
                onClick={() => setSelected(conv)}
                className={`w-full text-left px-4 py-3.5 border-b border-gray-50 hover:bg-gray-50 transition ${
                  selected?.phone === conv.phone ? "bg-indigo-50" : ""
                }`}
                style={selected?.phone === conv.phone ? { borderLeft: '3px solid #4f39f6' } : { borderLeft: '3px solid transparent' }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-base font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: '#4f39f6' }}>
                    {conv.name[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-gray-900 text-sm truncate">{conv.name}</p>
                      <p className="text-xs text-gray-400 flex-shrink-0 ml-2">
                        {timeLabel(conv.lastAt)}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{conv.lastMessage}</p>
                    {conv.unreadCount > 0 && (
                      <div className="mt-1">
                        <span
                          className="inline-flex items-center justify-center w-5 h-5 rounded-full text-white text-xs font-bold"
                          style={{ backgroundColor: '#4f39f6' }}
                        >
                          {conv.unreadCount}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right Panel — Chat View */}
      <div className="flex-1 flex flex-col" style={{ backgroundColor: '#F5F5F5' }}>
        {selected ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 px-5 py-4 flex items-center gap-3 shadow-sm">
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white"
                style={{ backgroundColor: '#4f39f6' }}>
                {selected.name[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-bold text-gray-900">{selected.name}</p>
                <p className="text-xs text-gray-400">{selected.phone}</p>
              </div>
              <div className="ml-auto">
                <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full">
                  {selected.messages.length} pesan
                </span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {selected.messages.map((msg) => {
                const isOutbound = msg.direction === "outbound";
                const isAI = msg.handledBy === "agent";
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOutbound ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`max-w-[70%] ${isOutbound ? "items-end" : "items-start"} flex flex-col gap-1`}>
                      <div
                        className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                          isOutbound
                            ? "text-white rounded-tr-sm"
                            : "bg-white text-gray-800 rounded-tl-sm"
                        }`}
                        style={isOutbound ? { backgroundColor: '#4f39f6' } : {}}
                      >
                        {msg.content}
                      </div>
                      <div className={`flex items-center gap-1.5 ${isOutbound ? "justify-end" : "justify-start"}`}>
                        <span className="text-xs text-gray-400">
                          {new Date(msg.createdAt).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {isOutbound && isAI && (
                          <span className="text-xs text-gray-400 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                            Dibalas oleh AI 🤖
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {selected.messages.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <div className="text-4xl mb-3">💬</div>
                  <p className="text-sm">Mulai percakapan dengan pembeli</p>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="bg-white border-t border-gray-200 p-4">
              {agentActive ? (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700">
                  <span className="text-base">🤖</span>
                  <span>Agen AI sedang menangani percakapan ini secara otomatis.</span>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ketik pesan balasan..."
                    className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:border-indigo-300"
                  />
                  <button
                    className="px-5 py-3 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition"
                    style={{ backgroundColor: '#4f39f6' }}
                  >
                    Kirim
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            {conversations.length === 0 ? (
              <>
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-5"
                  style={{ background: "linear-gradient(135deg, #fce4ec, #f8bbd9)" }}
                >
                  💬
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Belum Ada Pesan Masuk</h2>
                <p className="text-gray-500 max-w-sm leading-relaxed mb-2">
                  Pesan dari pembeli akan muncul di sini secara otomatis ketika Agen AI kamu aktif.
                </p>
                <p className="text-gray-400 text-sm max-w-sm leading-relaxed">
                  Aktifkan Agen AI dari dashboard, lalu bagikan link toko kamu. AI akan menjawab pertanyaan pembeli 24/7! 🤖
                </p>
                <div className="mt-6 flex flex-col gap-3 items-center w-full max-w-xs">
                  {[
                    { icon: "1️⃣", title: "Aktifkan Agen AI", desc: "Buka Dashboard → klik \"Aktifkan Agen AI\"" },
                    { icon: "2️⃣", title: "Bagikan Link Toko", desc: "Kirim link toko ke calon pembeli via sosmed" },
                    { icon: "3️⃣", title: "AI Menjawab Otomatis", desc: "Semua percakapan tersimpan dan terlihat di sini" },
                  ].map((step) => (
                    <div
                      key={step.icon}
                      className="flex items-start gap-3 text-left bg-white rounded-xl border border-gray-100 p-4 shadow-sm w-full"
                    >
                      <span className="text-xl flex-shrink-0">{step.icon}</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-700">{step.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="text-6xl mb-4">💬</div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Pilih Percakapan</h2>
                <p className="text-gray-500 max-w-sm leading-relaxed">
                  Pilih percakapan di sebelah kiri untuk membaca dan membalas pesan.
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
