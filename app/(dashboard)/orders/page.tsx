export const dynamic = "force-dynamic";

import { getDemoSeller } from "@/lib/demo-session";
import { db } from "@/lib/db";
import { orders } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import OrdersClient from "./orders-client";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const seller = await getDemoSeller();

  const allOrders = await db.query.orders.findMany({
    where: eq(orders.sellerId, seller.id),
    orderBy: [desc(orders.createdAt)],
    limit: 100,
  });

  const pendingCount = allOrders.filter((o) => o.status === "pending").length;

  return (
    <OrdersClient
      orders={allOrders}
      pendingCount={pendingCount}
      activeStatus={status ?? "all"}
    />
  );
}
