export const dynamic = 'force-dynamic';

import { getDemoSeller } from "@/lib/demo-session";
import SettingsForm from "./settings-form";

export default async function SettingsPage() {
  const seller = await getDemoSeller();
  return <SettingsForm seller={seller} />;
}
