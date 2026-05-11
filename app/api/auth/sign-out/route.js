import { NextResponse } from "next/server";
import { clearSessionCookies } from "../_utils";

export async function POST() {
  const response = NextResponse.json({ success: true });
  clearSessionCookies(response);
  return response;
}
