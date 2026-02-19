import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sellers, orders } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";

async function getSeller(userId: string) {
  return db.query.sellers.findFirst({ where: eq(sellers.clerkUserId, userId) });
}

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const seller = await getSeller(userId);
  if (!seller) return NextResponse.json({ error: "Seller not found" }, { status: 404 });

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
