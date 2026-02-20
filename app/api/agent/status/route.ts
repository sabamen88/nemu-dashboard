import { NextResponse } from "next/server";
import { getDemoSeller } from "@/lib/demo-session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const seller = await getDemoSeller();
    return NextResponse.json({
      status: seller.agentStatus,
      chatflowId: seller.agentChatflowId,
    });
  } catch (error) {
    console.error("[agent/status] Error:", error);
    return NextResponse.json({ error: "Gagal mengambil status agen" }, { status: 500 });
  }
}
