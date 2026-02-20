export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { sendUsdc } from "@/lib/paysponge";

export async function POST(req: NextRequest) {
  try {
    if (!process.env.SPONGE_API_KEY) {
      return NextResponse.json({ error: "SPONGE_API_KEY not configured" }, { status: 503 });
    }

    const { to, amount } = await req.json();

    if (!to || !to.startsWith("0x")) {
      return NextResponse.json({ error: "Alamat penerima tidak valid" }, { status: 400 });
    }

    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum) || amountNum <= 0) {
      return NextResponse.json({ error: "Jumlah tidak valid" }, { status: 400 });
    }

    const result = await sendUsdc(to, String(amountNum), "base-sepolia");

    return NextResponse.json({ ok: true, txHash: result.txHash });
  } catch (err) {
    console.error("Wallet send error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Transfer gagal" },
      { status: 500 }
    );
  }
}
