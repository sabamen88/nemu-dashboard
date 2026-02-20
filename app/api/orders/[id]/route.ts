export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getDemoSeller } from "@/lib/demo-session";
import { db } from "@/lib/db";
import { orders } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

const VALID_STATUSES = ["confirmed", "shipped", "done", "cancelled"] as const;
type ValidStatus = typeof VALID_STATUSES[number];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const seller = await getDemoSeller();
    const { id } = await params;

    const body = await req.json();
    const { status } = body as { status: ValidStatus };

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: "Status tidak valid" },
        { status: 400 }
      );
    }

    // Verify the order belongs to this seller
    const existing = await db.query.orders.findFirst({
      where: and(eq(orders.id, id), eq(orders.sellerId, seller.id)),
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Pesanan tidak ditemukan" },
        { status: 404 }
      );
    }

    const [updated] = await db
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(orders.id, id), eq(orders.sellerId, seller.id)))
      .returning({ id: orders.id, status: orders.status });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("PATCH /api/orders/[id] error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
