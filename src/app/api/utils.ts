import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";

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

async function refreshAccessToken() {
  const baseUrl = await getBaseUrl();
  const stravaRedirectUri = baseUrl + "/api/auth/refresh";
  const refreshResponse = await fetch(stravaRedirectUri);
  const data = await refreshResponse.json();
  return data.success;
}

export async function retrieveAccessToken() {
  const { get: getCookie } = await cookies();

  const accessToken = getCookie("strava_access_token")?.value;
  if (accessToken) return accessToken;

  const refreshed = await refreshAccessToken();
  if (!refreshed) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  const newAccessToken = getCookie("strava_access_token")?.value;
  if (!newAccessToken) {
    return NextResponse.json(
      { error: "Failed to retrieve access token" },
      { status: 500 }
    );
  }

  return newAccessToken;
}
