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

export async function POST(req: NextRequest) {
  try {
    const seller = await getDemoSeller();
    const body = await req.json();

    const {
      buyerName,
      buyerPhone = "chat-widget",
      shippingAddress,
      items: orderItems,
      paymentMethod = "transfer",
      notes,
    } = body as {
      buyerName: string;
      buyerPhone?: string;
      shippingAddress: string;
      items: { productId: string; productName: string; quantity: number; price: number }[];
      paymentMethod?: string;
      notes?: string;
    };

    if (!buyerName || !shippingAddress || !orderItems || orderItems.length === 0) {
      return NextResponse.json({ error: "buyerName, shippingAddress, and items are required" }, { status: 400 });
    }

    // Calculate total from items
    const total = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const [order] = await db.insert(orders).values({
      sellerId: seller.id,
      buyerName,
      buyerPhone,
      shippingAddress,
      items: orderItems,
      total: String(total),
      status: "pending",
      paymentMethod,
      notes,
      isAgentOrder: true,
    }).returning();

    const orderNumber = order.id.slice(0, 8).toUpperCase();

    return NextResponse.json({ orderId: order.id, orderNumber, total });
  } catch (err) {
    console.error("[orders POST] error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
