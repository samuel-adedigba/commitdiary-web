import { NextResponse } from "next/server";

export function GET(request) {
  return NextResponse.redirect(new URL("/#how-it-works", request.url), 307);
}
