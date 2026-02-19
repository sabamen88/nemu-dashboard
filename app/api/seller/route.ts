import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sellers } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { generateInviteCode, generateSlug } from "@/lib/utils";
import { z } from "zod";

const createSchema = z.object({
  storeName: z.string().min(3).max(60),
  storeSlug: z.string().min(3).max(60),
  category: z.string(),
  description: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const { storeName, storeSlug, category, description } = parsed.data;

  // Check slug uniqueness
  const existing = await db.query.sellers.findFirst({ where: eq(sellers.storeSlug, storeSlug) });
  const finalSlug = existing ? `${storeSlug}-${Date.now().toString(36)}` : storeSlug;

  const [seller] = await db.insert(sellers).values({
    clerkUserId: userId,
    storeName,
    storeSlug: finalSlug,
    category,
    description,
    inviteCode: generateInviteCode(),
    onboardingComplete: true,
    isFoundingSeller: true, // everyone is a founding seller for now
  }).returning();

  return NextResponse.json(seller, { status: 201 });
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const seller = await db.query.sellers.findFirst({ where: eq(sellers.clerkUserId, userId) });
  if (!seller) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(seller);
}

export async function PATCH(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const seller = await db.query.sellers.findFirst({ where: eq(sellers.clerkUserId, userId) });
  if (!seller) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const [updated] = await db.update(sellers)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(sellers.id, seller.id))
    .returning();

  return NextResponse.json(updated);
}
