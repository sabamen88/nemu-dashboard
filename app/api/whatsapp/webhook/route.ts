export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

// Sprint 3: Route to Flowise onboarding chatflow based on sender number

// GET — webhook verification (Twilio / Meta WhatsApp API)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // Meta WhatsApp verification challenge
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log("[WhatsApp] Webhook verified ✓");
    return new Response(challenge, { status: 200 });
  }

  return NextResponse.json({ ok: true, message: "Nemu WhatsApp Webhook — Sprint 3 ready" });
}

// POST — incoming messages from WhatsApp
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("[WhatsApp] Incoming message:", JSON.stringify(body, null, 2));

    // Sprint 3 TODO: Parse sender number from body
    // const senderPhone = body?.entry?.[0]?.changes?.[0]?.value?.messages?.[0]?.from;
    // Sprint 3 TODO: Route to Flowise onboarding chatflow based on sender number
    // Sprint 3 TODO: Check if sender has completed onboarding → if not, run onboarding flow
    // Sprint 3 TODO: Otherwise, route to main seller AI assistant

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[WhatsApp] Webhook error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
