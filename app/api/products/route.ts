import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sellers, products } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

const productSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  price: z.number().min(0),
  stock: z.number().min(0).default(0),
  images: z.array(z.string()).default([]),
  variants: z.array(z.object({ name: z.string(), options: z.array(z.string()) })).default([]),
  status: z.enum(["active", "draft", "archived"]).default("active"),
  weight: z.number().optional(),
  sku: z.string().optional(),
});

async function getSeller(userId: string) {
  return db.query.sellers.findFirst({ where: eq(sellers.clerkUserId, userId) });
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const seller = await getSeller(userId);
  if (!seller) return NextResponse.json({ error: "Seller not found" }, { status: 404 });

  const items = await db.query.products.findMany({
    where: eq(products.sellerId, seller.id),
    orderBy: [desc(products.createdAt)],
  });

  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const seller = await getSeller(userId);
  if (!seller) return NextResponse.json({ error: "Seller not found" }, { status: 404 });

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
