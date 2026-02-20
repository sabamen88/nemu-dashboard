export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getDemoSeller } from "@/lib/demo-session";
import { db } from "@/lib/db";
import { orders } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const seller = await getDemoSeller();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  const items = await db.query.orders.findMany({
    where: eq(orders.sellerId, seller.id),
    orderBy: [desc(orders.createdAt)],
    limit: 50,
  });

  const filtered = status ? items.filter((o) => o.status === status) : items;
  return NextResponse.json(filtered);
}
