import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sellers, products } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

async function getSeller(userId: string) {
  return db.query.sellers.findFirst({ where: eq(sellers.clerkUserId, userId) });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const seller = await getSeller(userId);
  if (!seller) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { id } = await params;
  const body = await req.json();

  const [updated] = await db.update(products)
    .set({ ...body, price: body.price ? String(body.price) : undefined, updatedAt: new Date() })
    .where(and(eq(products.id, id), eq(products.sellerId, seller.id)))
    .returning();

  if (!updated) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const seller = await getSeller(userId);
  if (!seller) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { id } = await params;
  await db.delete(products).where(and(eq(products.id, id), eq(products.sellerId, seller.id)));

  return NextResponse.json({ ok: true });
}
