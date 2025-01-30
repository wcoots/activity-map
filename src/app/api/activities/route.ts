import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { RawActivity } from "@/types";
import { getBaseUrl } from "../utils";

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

  const baseUrl = "https://www.strava.com/api/v3/athlete/activities";
  const perPage = 200;

  async function fetchAllPages(
    page = 1,
    accumulatedActivities: RawActivity[] = []
  ) {
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
    const allActivities = [...accumulatedActivities, ...result];

    if (result.length < perPage) return allActivities;
    return fetchAllPages(page + 1, allActivities);
  }

  try {
    const allActivities = await fetchAllPages();
    return NextResponse.json(allActivities);
  } catch {
    return NextResponse.json(
      { error: "Failed to retrieve activities" },
      { status: 500 }
    );
  }
}
