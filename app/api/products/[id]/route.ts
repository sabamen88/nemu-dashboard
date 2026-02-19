import { NextRequest, NextResponse } from "next/server";
import { getDemoSeller } from "@/lib/demo-session";
import { db } from "@/lib/db";
import { products } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const seller = await getDemoSeller();
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
  const seller = await getDemoSeller();
  const { id } = await params;

  await db.delete(products).where(and(eq(products.id, id), eq(products.sellerId, seller.id)));

  return NextResponse.json({ ok: true });
}
