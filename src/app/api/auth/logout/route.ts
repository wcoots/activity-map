import { NextResponse } from "next/server";

const NEXT_PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export async function GET() {
  const res = NextResponse.redirect(new URL("/", NEXT_PUBLIC_BASE_URL));

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
