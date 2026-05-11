import { NextResponse } from "next/server";
import { ACCESS_COOKIE, decodeJwtPayload } from "../_utils";

export async function GET(request) {
  const token = request.cookies.get(ACCESS_COOKIE)?.value;
  if (!token) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  try {
    const payload = decodeJwtPayload(token);
    return NextResponse.json({
      user: {
        id: payload.sub,
        email: payload.email,
        app_metadata: payload.app_metadata || {},
        user_metadata: payload.user_metadata || {},
      },
    });
  } catch {
    return NextResponse.json({ user: null }, { status: 401 });
  }
}
