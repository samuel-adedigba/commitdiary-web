import { NextResponse } from "next/server";

export function GET(request) {
  return NextResponse.redirect(new URL("/authentication/sign-in", request.url), 307);
}
