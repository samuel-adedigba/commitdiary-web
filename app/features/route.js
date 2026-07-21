import { NextResponse } from "next/server";

export function GET(request) {
  return NextResponse.redirect(new URL("/#features", request.url), 307);
}
