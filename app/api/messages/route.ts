import { NextRequest, NextResponse } from "next/server";
import { getDemoSeller } from "@/lib/demo-session";
import { db } from "@/lib/db";
import { messages } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

export async function GET() {
  const seller = await getDemoSeller();

  const items = await db.query.messages.findMany({
    where: eq(messages.sellerId, seller.id),
    orderBy: [desc(messages.createdAt)],
    limit: 200,
  });

  return NextResponse.json(items);
}

const messageSchema = z.object({
  buyerPhone: z.string().min(1),
  buyerName: z.string().optional(),
  content: z.string().min(1),
  direction: z.enum(["inbound", "outbound"]).default("inbound"),
  handledBy: z.enum(["agent", "seller"]).default("agent"),
});

export async function POST(req: NextRequest) {
  const seller = await getDemoSeller();
  const body = await req.json();
  const parsed = messageSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [message] = await db.insert(messages).values({
    sellerId: seller.id,
    ...parsed.data,
  }).returning();

  return NextResponse.json(message, { status: 201 });
}
