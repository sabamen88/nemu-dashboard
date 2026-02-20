// Demo mode: single seller session, no auth required
// Replace with Clerk auth when ready for production

import { db } from "@/lib/db";
import { sellers } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { generateInviteCode, generateSlug, generateTokoId } from "@/lib/utils";

const DEMO_CLERK_ID = "demo_seller_001";

export async function getDemoSeller() {
  // Return existing demo seller or create one
  let seller = await db.query.sellers.findFirst({
    where: eq(sellers.clerkUserId, DEMO_CLERK_ID),
  });

  if (!seller) {
    [seller] = await db.insert(sellers).values({
      clerkUserId: DEMO_CLERK_ID,
      storeName: "Toko Demo Nemu",
      storeSlug: generateSlug("toko-demo-nemu"),
      tokoId: generateTokoId("Toko Demo Nemu"), // → "DEMONEMU"
      category: "Fashion & Pakaian",
      description: "Toko demo untuk Nemu AI — ganti dengan toko kamu!",
      inviteCode: generateInviteCode(),
      onboardingCompleted: true,
      isFoundingSeller: true,
      agentStatus: "inactive",
    }).returning();
  }

  // Backfill tokoId for existing sellers that don't have one yet
  if (seller && !seller.tokoId) {
    [seller] = await db.update(sellers)
      .set({ tokoId: generateTokoId(seller.storeName) })
      .where(eq(sellers.id, seller.id))
      .returning();
  }

  if (!seller) {
    throw new Error(
      "Demo seller not found. Run: node scripts/seed-demo.mjs to seed demo data."
    );
  }

  return seller;
}
