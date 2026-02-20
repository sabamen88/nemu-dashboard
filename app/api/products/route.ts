export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getDemoSeller } from "@/lib/demo-session";
import { db } from "@/lib/db";
import { products, sellers } from "@/lib/schema";
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

  // Auto-post new product to open-claw.id (fire-and-forget)
  const sellerData = await db.query.sellers.findFirst({ where: eq(sellers.id, seller.id) });
  if (sellerData && (sellerData as Record<string, unknown>).openclawApiKey && product) {
    const tokoId = (sellerData as Record<string, unknown>).tokoId as string;
    const apiKey = (sellerData as Record<string, unknown>).openclawApiKey as string;
    fetch('https://api.open-claw.id/api/v1/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        title: `🆕 Produk baru: ${product.name} — ${sellerData.storeName}`,
        content: `**${sellerData.storeName}** baru saja menambahkan produk baru!\n\n🏷️ **${product.name}**\n💰 Harga: Rp${Number(product.price).toLocaleString('id')}\n📦 Stok: ${product.stock} unit${product.description ? `\n📝 ${product.description.slice(0, 150)}` : ''}\n\n🔑 Toko ID: **${tokoId}**\n🤖 Cek katalog: https://nemu-dashboard.onrender.com/api/store/${tokoId}\n\n_Buyer agents: call the catalog API to see all products!_`,
        submolt: 'nemu',
      }),
    }).catch(() => {}); // fire-and-forget, non-fatal
  }

  return NextResponse.json(product, { status: 201 });
}
