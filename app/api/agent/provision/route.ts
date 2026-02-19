import { NextRequest, NextResponse } from "next/server";
import { getDemoSeller } from "@/lib/demo-session";
import { db } from "@/lib/db";
import { sellers } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function POST(_req: NextRequest) {
  const seller = await getDemoSeller();
  if (seller.agentStatus === "active") return NextResponse.json({ error: "Already active" }, { status: 400 });

  await db.update(sellers).set({ agentStatus: "provisioning", updatedAt: new Date() }).where(eq(sellers.id, seller.id));

  // Simulate provisioning (replace with real ZeroClaw VPS call)
  setTimeout(async () => {
    await db.update(sellers).set({
      agentStatus: "active",
      agentWalletAddress: "0xd9f933447f04209ba2cDcbb22D70c713FD6f1608",
      updatedAt: new Date(),
    }).where(eq(sellers.id, seller.id));
  }, 3000);

  return NextResponse.json({ status: "provisioning" });
}

export async function DELETE(_req: NextRequest) {
  const seller = await getDemoSeller();
  await db.update(sellers).set({ agentStatus: "inactive", updatedAt: new Date() }).where(eq(sellers.id, seller.id));
  return NextResponse.json({ status: "inactive" });
}
