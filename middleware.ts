import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Demo mode: no auth — pass all requests through
// Replace with clerkMiddleware() when adding auth for production
export function middleware(request: NextRequest) {
  // Inject request URL into headers so server components (layouts) can read it
  const headers = new Headers(request.headers);
  headers.set("x-pathname", request.nextUrl.pathname);
  headers.set("x-search", request.nextUrl.search);

  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
