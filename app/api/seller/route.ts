import { NextRequest, NextResponse } from "next/server";
import { getDemoSeller } from "@/lib/demo-session";
import { db } from "@/lib/db";
import { sellers } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const seller = await getDemoSeller();
  return NextResponse.json(seller);
}

export async function PATCH(req: NextRequest) {
  const seller = await getDemoSeller();
  const body = await req.json();
  const [updated] = await db.update(sellers)
    .set({ ...body, updatedAt: new Date() })
    .where(eq(sellers.id, seller.id))
    .returning();
  return NextResponse.json(updated);
}
