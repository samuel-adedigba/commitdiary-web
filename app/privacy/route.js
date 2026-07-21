import { NextResponse } from "next/server";

export function GET(request) {
  return NextResponse.redirect(new URL("/#privacy", request.url), 307);
}
