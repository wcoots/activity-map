import { NextRequest, NextResponse } from "next/server";

const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID!;
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET!;

export async function GET(request: NextRequest) {
  console.log("/auth/callback");

  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  if (!code) {
    return NextResponse.json(
      { error: "Missing authorization code" },
      { status: 400 }
    );
  }

  try {
    const response = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: STRAVA_CLIENT_ID,
        client_secret: STRAVA_CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
      }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch token" },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Store tokens in cookies (or use a database)
    const res = NextResponse.redirect(
      new URL("/", process.env.NEXT_PUBLIC_BASE_URL)
    );
    res.cookies.set("strava_access_token", data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: data.expires_in,
    });
    res.cookies.set("strava_refresh_token", data.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    return res;
  } catch (e) {
    console.log(e);
    return NextResponse.json({ error: "OAuth flow failed" }, { status: 500 });
  }
}
