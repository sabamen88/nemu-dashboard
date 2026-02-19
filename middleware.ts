import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Demo mode: no auth — pass all requests through
// Replace with clerkMiddleware() when adding auth for production
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
