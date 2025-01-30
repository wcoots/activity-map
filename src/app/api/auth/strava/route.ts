import { NextResponse } from "next/server";

const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID!;
const STRAVA_REDIRECT_URI =
  process.env.NEXT_PUBLIC_BASE_URL + "/api/auth/callback";

export async function GET() {
  console.log("/auth/strava");

  const stravaAuthUrl = `https://www.strava.com/oauth/authorize?client_id=${STRAVA_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(
    STRAVA_REDIRECT_URI
  )}&approval_prompt=force&scope=read,activity:read`;

  return NextResponse.redirect(stravaAuthUrl);
}
