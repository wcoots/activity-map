import { NextResponse } from "next/server";
import { getBaseUrl } from "../../utils";

const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID!;

export async function GET() {
  const baseUrl = await getBaseUrl();
  const stravaRedirectUri = baseUrl + "/api/auth/callback";
  const stravaAuthUrl = `https://www.strava.com/oauth/authorize?client_id=${STRAVA_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(
    stravaRedirectUri
  )}&approval_prompt=force&scope=read,activity:read`;

  return NextResponse.redirect(stravaAuthUrl);
}
