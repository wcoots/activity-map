import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getBaseUrl } from "../utils";
import { RawAthelete } from "@/types";

async function refreshAccessToken() {
  const baseUrl = await getBaseUrl();
  const stravaRedirectUri = baseUrl + "/api/auth/refresh";
  const refreshResponse = await fetch(stravaRedirectUri);
  const data = await refreshResponse.json();
  return data.success;
}

export async function GET(): Promise<NextResponse> {
  const { get: getCookie } = await cookies();
  let accessToken = getCookie("strava_access_token")?.value;

  if (!accessToken) {
    const refreshed = await refreshAccessToken();
    if (!refreshed) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }
    accessToken = getCookie("strava_access_token")?.value;
  }

  try {
    const baseUrl = "https://www.strava.com/api/v3/athlete";

    const response = await fetch(baseUrl, {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch athlete" },
        { status: response.status }
      );
    }

    const result: RawAthelete = await response.json();

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Failed to retrieve athlete" },
      { status: 500 }
    );
  }
}
