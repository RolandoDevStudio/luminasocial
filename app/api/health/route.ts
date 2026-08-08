import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "lumina-social",
    timestamp: new Date().toISOString(),
  });
}
