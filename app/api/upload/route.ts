import { NextRequest, NextResponse } from "next/server";
import { getDemoSeller } from "@/lib/demo-session";
import { getPresignedUrl } from "@/lib/r2";

export async function POST(req: NextRequest) {
  const seller = await getDemoSeller();

  const { filename, contentType } = await req.json();
  if (!filename || !contentType) {
    return NextResponse.json({ error: "filename and contentType required" }, { status: 400 });
  }

  const key = `products/${seller.id}/${Date.now()}-${filename.replace(/[^a-z0-9.]/gi, "-")}`;
  const uploadUrl = await getPresignedUrl(key, contentType);
  const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;

  return NextResponse.json({ uploadUrl, publicUrl, key });
}
