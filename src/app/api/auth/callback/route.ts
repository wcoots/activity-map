import { NextRequest, NextResponse } from "next/server";
import { getBaseUrl } from "../../utils";

const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID!;
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET!;
const MAX_RETRIES = 5;

async function fetchStravaToken(code: string, attempt = 1) {
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
      if (attempt < MAX_RETRIES) {
        const delay = Math.pow(2, attempt) * 100; // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, delay));
        return fetchStravaToken(code, attempt + 1);
      }
      throw new Error("Failed to fetch token");
    }
    return response.json();
  } catch (error) {
    if (attempt < MAX_RETRIES) {
      const delay = Math.pow(2, attempt) * 100;
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchStravaToken(code, attempt + 1);
    }
    throw error;
  }
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const error = url.searchParams.get("error");
  const code = url.searchParams.get("code");

  if (error) {
    const baseUrl = await getBaseUrl();
    return NextResponse.redirect(new URL(`/?error=${error}`, baseUrl));
  }

  if (!code) {
    return NextResponse.json(
      { error: "Missing authorization code" },
      { status: 400 }
    );
  }

  try {
    const data = await fetchStravaToken(code);
    const baseUrl = await getBaseUrl();
    const res = NextResponse.redirect(new URL("/", baseUrl));

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
  } catch {
    return NextResponse.json({ error: "OAuth flow failed" }, { status: 500 });
  }
}
