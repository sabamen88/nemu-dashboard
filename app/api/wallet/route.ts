export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getWalletBalance, getTransactionHistory } from "@/lib/paysponge";

export async function GET() {
  try {
    if (!process.env.SPONGE_API_KEY) {
      return NextResponse.json(
        { error: "SPONGE_API_KEY not configured" },
        { status: 503 }
      );
    }

    const [balance, transactions] = await Promise.all([
      getWalletBalance("base-sepolia"),
      getTransactionHistory(20, "base-sepolia").catch(() => []),
    ]);

    return NextResponse.json({ balance, transactions });
  } catch (err) {
    console.error("Wallet API error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Wallet error" },
      { status: 500 }
    );
  }
}
