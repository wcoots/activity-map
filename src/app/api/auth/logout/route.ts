import { NextResponse } from "next/server";
import { getBaseUrl } from "../../utils";

export async function GET() {
  const baseUrl = await getBaseUrl();
  const res = NextResponse.redirect(new URL("/", baseUrl));

  res.cookies.set("strava_access_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  });

  res.cookies.set("strava_refresh_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  });

  return res;
}
