import { NextRequest, NextResponse } from "next/server";

import { AUTH_COOKIE_NAME } from "@/lib/backend";

/**
 * Returns the auth token so the client can attach it to WebSocket
 * connections as a query param (?token=...). The token is httpOnly
 * so JavaScript cannot read it directly from the cookie.
 */
export async function GET(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return NextResponse.json({ token: null }, { status: 200 });
  }

  return NextResponse.json({ token });
}
