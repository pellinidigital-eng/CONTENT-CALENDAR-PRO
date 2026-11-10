import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE_NAME, createSessionCookieValue, SESSION_TTL_SECONDS, verifyWordPressAccessToken } from "@/lib/protected-access";

export async function GET(request: NextRequest) {
  const deniedUrl = new URL("/access-denied", request.url);
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return noStoreRedirect(deniedUrl);
  }

  const verified = await verifyWordPressAccessToken(token);

  if (!verified.ok) {
    return noStoreRedirect(deniedUrl);
  }

  const cookieValue = await createSessionCookieValue(verified.value);

  if (!cookieValue) {
    return noStoreRedirect(deniedUrl);
  }

  const response = NextResponse.redirect(new URL("/", request.url), 303);

  response.headers.set("Cache-Control", "no-store");
  response.cookies.set({
    name: ACCESS_COOKIE_NAME,
    value: cookieValue,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS
  });

  return response;
}

function noStoreRedirect(url: URL) {
  const response = NextResponse.redirect(url, 303);

  response.headers.set("Cache-Control", "no-store");

  return response;
}
