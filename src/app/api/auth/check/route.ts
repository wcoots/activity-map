import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const { get: getCookie } = await cookies();
  const accessToken = getCookie("strava_access_token")?.value;

  if (!accessToken) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({ authenticated: true }, { status: 200 });
}
