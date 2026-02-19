import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sellers } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function POST(_req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const seller = await db.query.sellers.findFirst({ where: eq(sellers.clerkUserId, userId) });
  if (!seller) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (seller.agentStatus === "active") {
    return NextResponse.json({ error: "Agent already active" }, { status: 400 });
  }

  // Mark as provisioning
  await db.update(sellers)
    .set({ agentStatus: "provisioning", updatedAt: new Date() })
    .where(eq(sellers.id, seller.id));

  // TODO: Call the provisioner script on the ZeroClaw VPS
  // This will be a POST to the provisioner endpoint:
  // POST https://agent.nemu-ai.com/provision
  // { seller_id, phone, store_name, store_category }
  //
  // For now, simulate success after 3 seconds (replace with real call)
  setTimeout(async () => {
    await db.update(sellers)
      .set({
        agentStatus: "active",
        agentWalletAddress: "0x" + Math.random().toString(16).slice(2, 42), // placeholder
        updatedAt: new Date(),
      })
      .where(eq(sellers.id, seller.id));
  }, 3000);

  return NextResponse.json({ status: "provisioning", message: "Agent sedang disiapkan..." });
}

export async function DELETE(_req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const seller = await db.query.sellers.findFirst({ where: eq(sellers.clerkUserId, userId) });
  if (!seller) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // TODO: Call deprovision on ZeroClaw VPS
  await db.update(sellers)
    .set({ agentStatus: "inactive", updatedAt: new Date() })
    .where(eq(sellers.id, seller.id));

  return NextResponse.json({ status: "inactive" });
}
