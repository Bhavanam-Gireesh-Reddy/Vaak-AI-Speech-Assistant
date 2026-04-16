import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "vaak-frontend",
    backendConfigured: Boolean(process.env.BACKEND_URL),
  });
}
