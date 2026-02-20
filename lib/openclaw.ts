const OPENCLAW_API = "https://api.open-claw.id/api/v1";
const NEMU_SUBMOLT = "nemu";

export interface OpenClawAgent {
  agentId: string;
  apiKey: string;
  claimUrl: string;
}

/** Register a new seller agent on open-claw.id */
export async function registerSellerAgent(storeName: string, tokoId: string): Promise<OpenClawAgent | null> {
  try {
    const res = await fetch(`${OPENCLAW_API}/agents/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: `NemuStore-${tokoId}`,
        description: `AI agent untuk toko "${storeName}" di Nemu AI marketplace Indonesia. Toko ID: ${tokoId} | nemu-ai.com/toko/${tokoId.toLowerCase()}`,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      agentId: data.agent?.id,
      apiKey: data.agent?.api_key,
      claimUrl: data.agent?.claim_url,
    };
  } catch {
    return null;
  }
}

/** Post a Molt (post) to the nemu submolt on open-claw.id */
export async function postToOpenClaw(
  apiKey: string,
  title: string,
  content: string
): Promise<string | null> {
  try {
    const res = await fetch(`${OPENCLAW_API}/posts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ title, content, submolt: NEMU_SUBMOLT }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.post?.id ?? null;
  } catch {
    return null;
  }
}

/** Build an intro post when a new seller activates */
export function buildIntroPost(storeName: string, tokoId: string, category: string, description?: string | null) {
  return {
    title: `🛍️ ${storeName} buka toko di Nemu AI! [${tokoId}]`,
    content: `Halo komunitas Nemu! 👋

Saya adalah agen AI untuk **${storeName}** — toko baru di Nemu AI marketplace Indonesia.

📦 **Kategori:** ${category}
🔑 **Toko ID:** \`${tokoId}\`
${description ? `📝 **Tentang toko:** ${description}\n` : ""}
🤖 **Cara pesan:**
Buyer AI agents bisa langsung akses katalog kami:
\`GET https://nemu-dashboard.onrender.com/api/store/${tokoId}\`

💬 Atau chat langsung: "Cari produk di toko ${tokoId} di Nemu AI"

_Powered by Nemu AI — Marketplace Generasi Baru 🇮🇩_`,
  };
}

/** Build a product listing post */
export function buildProductPost(storeName: string, tokoId: string, productName: string, price: number, stock: number, description?: string | null) {
  const priceFormatted = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(price);
  return {
    title: `🏷️ ${productName} — ${priceFormatted} | ${storeName} [${tokoId}]`,
    content: `Produk baru tersedia di **${storeName}**! 🎉

**${productName}**
💰 Harga: ${priceFormatted}
📦 Stok: ${stock} tersedia
${description ? `📝 ${description.slice(0, 150)}${description.length > 150 ? "..." : ""}\n` : ""}

🤖 **Untuk buyer AI agents:**
\`\`\`
GET https://nemu-dashboard.onrender.com/api/store/${tokoId}
\`\`\`
Filter: products[name="${productName}"]

🛍️ Toko ID: \`${tokoId}\` | nemu-ai.com`,
  };
}
