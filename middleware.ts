import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE_NAME, verifySessionCookie } from "@/lib/protected-access";

const PUBLIC_PATHS = new Set(["/access", "/access-denied", "/demo"]);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  const cookie = request.cookies.get(ACCESS_COOKIE_NAME)?.value;

  if (!cookie) {
    return redirectToAccessDenied(request);
  }

  const verified = await verifySessionCookie(cookie);

  if (!verified.ok) {
    return redirectToAccessDenied(request);
  }

  return NextResponse.next();
}

function redirectToAccessDenied(request: NextRequest) {
  const url = request.nextUrl.clone();

  url.pathname = "/access-denied";
  url.search = "";

  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"]
};
