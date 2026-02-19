import { redirect } from "next/navigation";

// Demo mode: no auth — redirect directly to dashboard
export default function SignInPage() {
  redirect("/dashboard");
}
