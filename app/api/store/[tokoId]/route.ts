export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sellers, products } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { formatRupiah } from "@/lib/utils";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Content-Type": "application/json",
};

// OPTIONS — preflight for CORS
export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

// GET /api/store/[tokoId] — public, no auth required
// Used by buyer AI agents to discover a Nemu store and its catalog
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ tokoId: string }> }
) {
  try {
    const { tokoId: rawTokoId } = await params;
    const tokoId = rawTokoId.toUpperCase();

    // Find seller by tokoId
    const seller = await db.query.sellers.findFirst({
      where: eq(sellers.tokoId, tokoId),
    });

    if (!seller) {
      return NextResponse.json(
        { error: "Toko tidak ditemukan", tokoId },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    // Fetch active products only
    const catalog = await db
      .select()
      .from(products)
      .where(and(eq(products.sellerId, seller.id), eq(products.status, "active")));

    const formattedCatalog = catalog.map((p) => ({
      id: p.id,
      name: p.name,
      price: Number(p.price),
      priceFormatted: formatRupiah(Number(p.price)),
      stock: p.stock,
      description: p.description ?? null,
      images: (p.images as string[]) ?? [],
      variants: p.variants ?? [],
      sku: p.sku ?? null,
      status: p.status,
    }));

    const response = {
      tokoId: seller.tokoId,
      storeName: seller.storeName,
      storeSlug: seller.storeSlug,
      category: seller.category,
      description: seller.description ?? null,
      phone: seller.phone ?? null,
      isFoundingSeller: seller.isFoundingSeller,
      storeUrl: `https://nemu-ai.com/toko/${seller.storeSlug}`,
      catalog: formattedCatalog,
      totalProducts: formattedCatalog.length,
      agentContact: `Ask to buy: send 'BELI [nama produk] dari ${seller.tokoId}' to Nemu AI`,
    };

    return NextResponse.json(response, { headers: CORS_HEADERS });
  } catch (err) {
    console.error("Public store API error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
