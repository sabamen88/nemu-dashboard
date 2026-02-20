export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getDemoSeller } from "@/lib/demo-session";
import { db } from "@/lib/db";
import { products } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

const productSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional().nullable(),
  price: z.number().min(0),
  stock: z.number().min(0).default(0),
  weight: z.number().min(0).optional().nullable(),
  images: z.array(z.string()).default([]),
  status: z.enum(["active", "draft", "archived"]).default("active"),
});

export async function GET() {
  const seller = await getDemoSeller();
  const items = await db.query.products.findMany({
    where: eq(products.sellerId, seller.id),
    orderBy: [desc(products.createdAt)],
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const seller = await getDemoSeller();
  const body = await req.json();
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const [product] = await db.insert(products).values({
    sellerId: seller.id,
    ...parsed.data,
    price: String(parsed.data.price),
  }).returning();
  return NextResponse.json(product, { status: 201 });
}
