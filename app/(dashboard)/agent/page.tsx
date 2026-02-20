export const dynamic = "force-dynamic";

import { getDemoSeller } from "@/lib/demo-session";
import { db } from "@/lib/db";
import { messages } from "@/lib/schema";
import { and, eq, count, sql } from "drizzle-orm";
import AgentConfigClient from "./agent-config-client";

export default async function AgentPage() {
  const seller = await getDemoSeller();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Count messages handled by agent today
  const [agentMsgCount] = await db
    .select({ count: count() })
    .from(messages)
    .where(
      and(
        eq(messages.sellerId, seller.id),
        eq(messages.handledBy, "agent"),
        sql`${messages.createdAt} >= ${today}`
      )
    );

  const FLOWISE_URL = process.env.FLOWISE_URL || "";

  return (
    <AgentConfigClient
      seller={seller}
      agentMsgToday={agentMsgCount?.count ?? 0}
      flowiseUrl={FLOWISE_URL}
    />
  );
}
