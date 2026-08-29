import { NextResponse } from "next/server";
import { normalizeAuthRedirect } from "lib/authRedirect";

export function GET(request) {
  const url = new URL("/authentication/sign-in", request.url);
  const next = request.nextUrl.searchParams.get("next");
  if (next) url.searchParams.set("next", normalizeAuthRedirect(next));
  return NextResponse.redirect(url, 307);
}
