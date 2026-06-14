import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";

const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID!;
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET!;

export const ACCESS_TOKEN_COOKIE = "strava_access_token";
export const REFRESH_TOKEN_COOKIE = "strava_refresh_token";
const REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export async function getBaseUrl() {
  const { get: getHeader } = await headers();
  const host = getHeader("host");
  const protocol = host?.includes("localhost") ? "http" : "https"; // Use http for local dev, https for production
  return `${protocol}://${host}`;
}

export function unique<T>(array: T[]): T[] {
  const seen = new Set<T>();
  return array.filter((item) => {
    if (seen.has(item)) {
      return false;
    }
    seen.add(item);
    return true;
  });
}

interface StravaTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

type CookieStore = Awaited<ReturnType<typeof cookies>>;

export async function refreshStravaToken(
  refreshToken: string,
): Promise<StravaTokenResponse | null> {
  try {
    const response = await fetch("https://www.strava.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: STRAVA_CLIENT_ID,
        client_secret: STRAVA_CLIENT_SECRET,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    });
    if (!response.ok) return null;
    return (await response.json()) as StravaTokenResponse;
  } catch {
    return null;
  }
}

export function setTokenCookies(
  cookieStore: CookieStore,
  data: StravaTokenResponse,
) {
  const secure = process.env.NODE_ENV === "production";
  cookieStore.set(ACCESS_TOKEN_COOKIE, data.access_token, {
    httpOnly: true,
    secure,
    maxAge: data.expires_in,
  });
  cookieStore.set(REFRESH_TOKEN_COOKIE, data.refresh_token, {
    httpOnly: true,
    secure,
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });
}

export async function retrieveAccessToken() {
  const cookieStore = await cookies();

  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  if (accessToken) return accessToken;

  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;
  if (!refreshToken) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  const data = await refreshStravaToken(refreshToken);
  if (!data) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 },
    );
  }

  setTokenCookies(cookieStore, data);
  return data.access_token;
}
