// Demo mode: single seller session, no auth required
// Replace with Clerk auth when ready for production

import { db } from "@/lib/db";
import { sellers } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { generateInviteCode, generateSlug } from "@/lib/utils";

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
      category: "Fashion & Pakaian",
      description: "Toko demo untuk Nemu AI — ganti dengan toko kamu!",
      inviteCode: generateInviteCode(),
      onboardingComplete: true,
      onboardingCompleted: true,
      isFoundingSeller: true,
      agentStatus: "inactive",
    }).returning();
  }

  return seller;
}
