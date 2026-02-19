import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { sellers } from "@/lib/schema";
import { eq } from "drizzle-orm";

export default async function HomePage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const seller = await db.query.sellers.findFirst({
    where: eq(sellers.clerkUserId, userId),
  });

  if (!seller) redirect("/onboarding");
  if (!seller.onboardingComplete) redirect("/onboarding");

  redirect("/dashboard");
}
