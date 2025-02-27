import { NextRequest, NextResponse } from "next/server";

import { db } from "@/app/api/kysely";
import { retrieveAccessToken } from "@/app/api/utils";
import { RawActivity } from "@/types";

async function stashActivity(activity: RawActivity): Promise<void> {
  await db
    .updateTable("activitymap.activities")
    .set({ polyline: activity.map.polyline })
    .where("id", "=", activity.id)
    .executeTakeFirst();
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { activityId }: { activityId: number } = await request.json();

    const accessToken = await retrieveAccessToken();
    if (typeof accessToken !== "string") return NextResponse.json(null);

    const query = `https://www.strava.com/api/v3/activities/${activityId}`;

    const response = await fetch(query, {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) throw new Error("Failed to fetch activity");

    const activity: RawActivity = await response.json();

    if (activity.map.polyline) {
      await stashActivity(activity);
    }

    return NextResponse.json(activity);
  } catch {
    return NextResponse.json(
      { error: "Failed to retrieve activity" },
      { status: 500 }
    );
  }
}
