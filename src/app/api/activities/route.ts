import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getBaseUrl } from "../utils";
import { RawActivity } from "@/types";

async function refreshAccessToken() {
  const baseUrl = await getBaseUrl();
  const stravaRedirectUri = baseUrl + "/api/auth/refresh";
  const refreshResponse = await fetch(stravaRedirectUri);
  const data = await refreshResponse.json();
  return data.success;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { page } = await request.json();

    if (!page || typeof page !== "number" || page < 1) {
      return NextResponse.json(
        { error: "Invalid page number" },
        { status: 400 }
      );
    }

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

    const baseUrl = "https://www.strava.com/api/v3/athlete/activities";
    const perPage = 200;

    const response = await fetch(
      `${baseUrl}?per_page=${perPage}&page=${page}`,
      { method: "GET", headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch activities" },
        { status: response.status }
      );
    }

    const result: RawActivity[] = await response.json();
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Failed to retrieve activities" },
      { status: 500 }
    );
  }
}
