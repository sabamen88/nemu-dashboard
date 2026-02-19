export const dynamic = 'force-dynamic';

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { sellers } from "@/lib/schema";
import { eq } from "drizzle-orm";
import Sidebar from "@/components/sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const seller = await db.query.sellers.findFirst({
    where: eq(sellers.clerkUserId, userId),
  });

  if (!seller?.onboardingComplete) redirect("/onboarding");

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar seller={seller} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
