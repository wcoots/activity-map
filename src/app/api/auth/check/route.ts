import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const { get: getCookie } = await cookies();
  const accessToken = getCookie("strava_access_token")?.value;

  return NextResponse.json({ authenticated: !!accessToken }, { status: 200 });
}
