import { NextResponse } from "next/server";
import {
  ACCESS_COOKIE,
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
  clearSessionCookies,
  fetchAuthProvider,
} from "../_utils";

export async function GET(request) {
  const token = request.cookies.get(ACCESS_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return NextResponse.json({ user: null }, { status: 503 });
  }

  try {
    const authResponse = await fetchAuthProvider(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`,
      },
    });

    if (authResponse.ok) {
      const user = await authResponse.json();
      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          app_metadata: user.app_metadata || {},
          user_metadata: user.user_metadata || {},
        },
      });
    }
  } catch {
    return NextResponse.json({ user: null }, { status: 503 });
  }

  const response = NextResponse.json({ user: null }, { status: 401 });
  clearSessionCookies(response);
  return response;
}
