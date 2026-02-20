export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getDemoSeller } from "@/lib/demo-session";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = "sabamen88/nemu-assets";
const CDN_BASE = "https://cdn.jsdelivr.net/gh/sabamen88/nemu-assets";

// GET — check if upload is available
export async function GET() {
  return NextResponse.json({ available: !!GITHUB_TOKEN });
}

// POST — upload image file via GitHub API, serve via jsDelivr CDN
export async function POST(req: NextRequest) {
  if (!GITHUB_TOKEN) {
    return NextResponse.json({ error: "Upload not configured" }, { status: 500 });
  }

  try {
    const seller = await getDemoSeller();
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File terlalu besar (max 5MB)" }, { status: 400 });
    }
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: "Format tidak didukung (JPEG, PNG, WebP, GIF)" }, { status: 400 });
    }

    // Build path: products/{sellerId}/{timestamp}-{filename}
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const path = `products/${seller.id}/${filename}`;

    // Convert to base64 for GitHub API
    const buffer = await file.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");

    // Upload to GitHub
    const ghRes = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`,
      {
        method: "PUT",
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          "Content-Type": "application/json",
          "User-Agent": "nemu-dashboard",
        },
        body: JSON.stringify({
          message: `Upload product image for seller ${seller.id}`,
          content: base64,
        }),
      }
    );

    if (!ghRes.ok) {
      const err = await ghRes.text();
      console.error("GitHub upload error:", err);
      return NextResponse.json({ error: "Gagal mengupload gambar" }, { status: 502 });
    }

    // Serve via jsDelivr CDN (cached, fast globally)
    const url = `${CDN_BASE}/${path}`;

    return NextResponse.json({ url });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
