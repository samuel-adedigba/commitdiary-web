import { NextResponse } from "next/server";

export function GET(request) {
  return NextResponse.redirect(new URL("/#pricing", request.url), 307);
}
