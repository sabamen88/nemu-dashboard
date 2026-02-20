export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getDemoSeller } from "@/lib/demo-session";
import OnboardingChat from "./onboarding-chat";

interface Props {
  searchParams: Promise<{ preview?: string; skip_onboarding?: string }>;
}

export default async function OnboardingPage({ searchParams }: Props) {
  const params = await searchParams;
  const seller = await getDemoSeller();

  // ?preview=1 — force-show onboarding for demos/dev review regardless of completion status
  const isPreview = params.preview === "1";

  // Already completed onboarding → skip to dashboard (unless previewing)
  if (seller.onboardingCompleted && !isPreview) {
    redirect("/dashboard");
  }

  return <OnboardingChat />;
}
