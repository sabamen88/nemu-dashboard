export const dynamic = 'force-dynamic';

import { getDemoSeller } from "@/lib/demo-session";
import Sidebar from "@/components/sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const seller = await getDemoSeller();

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar seller={seller} />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
