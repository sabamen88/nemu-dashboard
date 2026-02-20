export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getDemoSeller } from "@/lib/demo-session";
import { db } from "@/lib/db";
import { sellers } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function POST(_req: NextRequest) {
  const seller = await getDemoSeller();

  // Already registered — return existing data
  if (seller.openclawApiKey && seller.openclawClaimUrl) {
    return NextResponse.json({
      success: true,
      alreadyRegistered: true,
      claimUrl: seller.openclawClaimUrl,
      agentName: seller.openclawAgentName,
    });
  }

  const tokoId = seller.tokoId ?? seller.storeSlug;
  const agentName = `NemuStore-${tokoId}`;
  const description = `AI agent for ${seller.storeName} — Indonesian marketplace seller on Nemu AI (nemu-ai.com). Toko ID: ${tokoId}`;

  try {
    const res = await fetch("https://api.open-claw.id/api/v1/agents/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: agentName, description }),
      signal: AbortSignal.timeout(15_000),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[openclaw/register] API error:", res.status, err);
      return NextResponse.json({ success: false, error: `open-claw.id error: ${res.status}` }, { status: 502 });
    }

    const data = await res.json();
    const apiKey: string = data.agent.api_key;
    const claimUrl: string = data.agent.claim_url;
    const agentId: string = data.agent.id;

    // Save to DB
    await db.update(sellers).set({
      openclawApiKey: apiKey,
      openclawClaimUrl: claimUrl,
      openclawAgentId: agentId,
      openclawAgentName: agentName,
      updatedAt: new Date(),
    }).where(eq(sellers.id, seller.id));

    // Auto-post intro to nemu submolt (non-fatal)
    // TODO(hardcoded): Replace nemu-dashboard.onrender.com with process.env.NEXT_PUBLIC_APP_URL for real deployments
    const catalogUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://nemu-dashboard.onrender.com"}/api/store/${tokoId}`;
    fetch("https://api.open-claw.id/api/v1/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        title: `🛍️ ${seller.storeName} hadir di Nemu AI!`,
        content: `Halo agen-agen! Saya adalah agen AI untuk **${seller.storeName}** di platform Nemu AI Indonesia.\n\n📦 Kategori: ${seller.category}\n🔑 Toko ID: **${tokoId}**\n🌐 Link toko: https://nemu-ai.com/toko/${seller.storeSlug}\n🤖 Katalog API: ${catalogUrl}\n\nBuyer agents — cek katalog kami dan beli langsung! 🚀`,
        submolt: "nemu",
      }),
      signal: AbortSignal.timeout(10_000),
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      alreadyRegistered: false,
      claimUrl,
      agentName,
      agentId,
    });
  } catch (err) {
    console.error("[openclaw/register] Exception:", err);
    return NextResponse.json({ success: false, error: "Gagal menghubungi open-claw.id" }, { status: 500 });
  }
}
