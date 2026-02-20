export const dynamic = 'force-dynamic';

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getDemoSeller } from "@/lib/demo-session";
import Sidebar from "@/components/sidebar";
import ChatWidget from "@/components/chat-widget";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const seller = await getDemoSeller();

  // Redirect new sellers to onboarding if they haven't completed it
  if (!seller.onboardingCompleted) {
    const headersList = await headers();
    const searchStr = headersList.get("x-search") || "";
    const skipOnboarding = searchStr.includes("skip_onboarding=1");

    if (!skipOnboarding) {
      redirect("/onboarding");
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar seller={seller} />
      <main className="flex-1 overflow-y-auto pt-14 lg:pt-0">
        {children}
      </main>
      {/* Floating AI Assistant — available on all dashboard pages */}
      <ChatWidget />
    </div>
  );
}
