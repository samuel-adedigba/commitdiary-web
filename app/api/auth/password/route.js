import { NextResponse } from "next/server";
import { SUPABASE_ANON_KEY, SUPABASE_URL, clearSessionCookies, setSessionCookies } from "../_utils";

export async function POST(request) {
  const { email, password } = await request.json().catch(() => ({}));

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
  }

  const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!authResponse.ok) {
    const response = NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    clearSessionCookies(response);
    return response;
  }

  const session = await authResponse.json();
  const response = NextResponse.json({ success: true });
  setSessionCookies(response, session);
  return response;
}
