import { RawActivity } from "@/types";
import { NextResponse } from "next/server";

export async function GET(): Promise<NextResponse> {
  const baseUrl = "https://www.strava.com/api/v3/athlete/activities";
  const perPage = 200; // maximum allowed by Strava API

  async function fetchAllPages(
    page = 1,
    accumulatedActivities: RawActivity[] = []
  ): Promise<RawActivity[]> {
    const queryParams = new URLSearchParams({
      per_page: perPage.toString(),
      page: page.toString(),
    });

    const response = await fetch(`${baseUrl}?${queryParams.toString()}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${process.env.STRAVA_API_KEY}` },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result: RawActivity[] = await response.json();

    const allActivities = [...accumulatedActivities, ...result];

    if (result.length < perPage) return allActivities;
    else return fetchAllPages(page + 1, allActivities);
  }

  try {
    const allActivities = await fetchAllPages();
    const response = NextResponse.json(allActivities);
    response.headers.set("Cache-Control", "public, max-age=86400, immutable"); // cache for 24h
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
