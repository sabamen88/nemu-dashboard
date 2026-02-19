export const dynamic = 'force-dynamic';

import { getDemoSeller } from "@/lib/demo-session";
import { db } from "@/lib/db";
import { messages } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import MessagesView from "./messages-view";

export default async function MessagesPage() {
  const seller = await getDemoSeller();

  const allMessages = await db.query.messages.findMany({
    where: eq(messages.sellerId, seller.id),
    orderBy: [desc(messages.createdAt)],
    limit: 200,
  });

  // Group by buyer phone — serialize dates as ISO strings for client
  type ConvMsg = {
    id: string;
    content: string;
    direction: string;
    handledBy: string;
    createdAt: string;
  };

  const conversationMap = new Map<string, {
    phone: string;
    name: string;
    msgs: ConvMsg[];
  }>();

  for (const msg of allMessages) {
    const key = msg.buyerPhone;
    if (!conversationMap.has(key)) {
      conversationMap.set(key, {
        phone: key,
        name: msg.buyerName ?? key,
        msgs: [],
      });
    }
    conversationMap.get(key)!.msgs.push({
      id: msg.id,
      content: msg.content,
      direction: msg.direction,
      handledBy: msg.handledBy,
      createdAt: msg.createdAt.toISOString(),
    });
  }

  const conversations = Array.from(conversationMap.values()).map(({ phone, name, msgs }) => {
    const sorted = msgs.sort((a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    const last = sorted[sorted.length - 1];
    const unreadCount = msgs.filter(m => m.direction === "inbound" && m.handledBy === "agent").length;
    return {
      phone,
      name,
      lastMessage: last?.content ?? "",
      lastAt: last?.createdAt ?? new Date().toISOString(),
      unreadCount,
      messages: sorted,
    };
  }).sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime());

  return <MessagesView conversations={conversations} agentActive={seller.agentStatus === "active"} />;
}
