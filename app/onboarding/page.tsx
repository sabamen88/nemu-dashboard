export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getDemoSeller } from "@/lib/demo-session";
import OnboardingChat from "./onboarding-chat";

export default async function OnboardingPage() {
  const seller = await getDemoSeller();

  // Already completed onboarding → skip to dashboard
  if (seller.onboardingCompleted) {
    redirect("/dashboard");
  }

  return <OnboardingChat />;
}
