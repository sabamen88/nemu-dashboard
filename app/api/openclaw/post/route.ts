export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getDemoSeller } from "@/lib/demo-session";

// POST body: { title: string, content: string }
// Uses seller's openclawApiKey
// Returns: { success, post }
export async function POST(req: NextRequest) {
  try {
    const seller = await getDemoSeller();
    const { title, content } = await req.json();

    if (!seller.openclawApiKey) {
      return NextResponse.json(
        { error: "Open-claw.id agent not registered. Activate your AI agent first." },
        { status: 400 }
      );
    }

    const res = await fetch("https://api.open-claw.id/api/v1/posts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${seller.openclawApiKey}`,
      },
      body: JSON.stringify({ title, content, submolt: "nemu" }),
      signal: AbortSignal.timeout(15_000),
    });

    const data = await res.json();
    return NextResponse.json({ success: data.success, post: data.post });
  } catch (err) {
    console.error("[openclaw/post POST]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
