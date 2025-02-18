import { NextRequest, NextResponse } from "next/server";

import { db } from "@/app/api/kysely";
import { retrieveAccessToken } from "@/app/api/utils";
import { Athlete, RawActivity } from "@/types";

async function fetchDatabaseActivities(athleteId: number): Promise<{
  activities: RawActivity[];
  mostRecentActivityTime: number | null;
}> {
  const storedActivities = await db
    .selectFrom("activitymap.activities")
    .select([
      "id",
      "activity_ts",
      "timezone",
      "type",
      "name",
      "distance",
      "moving_time",
      "average_speed",
      "elevation_gain",
      "polyline",
    ])
    .where("athlete_id", "=", athleteId)
    .execute();

  if (!storedActivities.length)
    return {
      activities: [],
      mostRecentActivityTime: null,
    };

  const mostRecentActivity = storedActivities.reduce((mostRecent, activity) => {
    if (activity.activity_ts > mostRecent.activity_ts) return activity;
    else return mostRecent;
  });

  const mostRecentActivityTime = Math.floor(
    mostRecentActivity.activity_ts.getTime() / 1000
  );

  const activities = storedActivities
    .filter((activity) => activity.polyline)
    .map(
      (activity): RawActivity => ({
        id: activity.id,
        athlete: { id: athleteId },
        name: activity.name,
        start_date: activity.activity_ts.toISOString(),
        timezone: activity.timezone,
        sport_type: activity.type,
        distance: activity.distance,
        moving_time: activity.moving_time,
        total_elevation_gain: activity.elevation_gain,
        average_speed: activity.average_speed,
        map: { summary_polyline: activity.polyline! },
      })
    );

  return { activities, mostRecentActivityTime };
}

async function fetchStravaActivities(
  accessToken: string,
  query: string
): Promise<RawActivity[]> {
  const response = await fetch(query, {
    method: "GET",
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error("Failed to fetch activities");

  return response.json();
}

async function stashActivities(activities: RawActivity[]): Promise<void> {
  if (!activities.length) return;

  await db
    .insertInto("activitymap.activities")
    .values(
      activities.map((activity) => ({
        id: activity.id,
        athlete_id: activity.athlete.id,
        updated_ts: new Date(),
        activity_ts: new Date(activity.start_date),
        timezone: activity.timezone,
        type: activity.sport_type,
        name: activity.name,
        distance: activity.distance,
        moving_time: activity.moving_time,
        average_speed: activity.average_speed,
        elevation_gain: activity.total_elevation_gain,
        polyline: activity.map.summary_polyline.length
          ? activity.map.summary_polyline
          : null,
      }))
    )
    .onConflict((oc) =>
      oc.column("id").doUpdateSet((eb) => ({
        updated_ts: new Date(),
        athlete_id: eb.ref("excluded.athlete_id"),
        activity_ts: eb.ref("excluded.activity_ts"),
        timezone: eb.ref("excluded.timezone"),
        type: eb.ref("excluded.type"),
        name: eb.ref("excluded.name"),
        distance: eb.ref("excluded.distance"),
        moving_time: eb.ref("excluded.moving_time"),
        average_speed: eb.ref("excluded.average_speed"),
        elevation_gain: eb.ref("excluded.elevation_gain"),
        polyline: eb.ref("excluded.polyline"),
      }))
    )
    .executeTakeFirst();
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { athlete }: { athlete: Athlete } = await request.json();

    const { activities, mostRecentActivityTime } =
      await fetchDatabaseActivities(athlete.id);

    const accessToken = await retrieveAccessToken();
    if (typeof accessToken !== "string") return NextResponse.json(activities);

    // if any activities exist in the database for the athlete, fetch 200 new activities since the most recent activity
    if (mostRecentActivityTime) {
      const afterTimeParameter = mostRecentActivityTime
        ? `&after=${mostRecentActivityTime}`
        : "";

      const query = `https://www.strava.com/api/v3/athlete/activities?per_page=200&${afterTimeParameter}`;
      const result = await fetchStravaActivities(accessToken, query);

      if (result.length) {
        await stashActivities(result);
        activities.push(...result);
      }

      return NextResponse.json(activities);
    }

    const pages = Math.ceil(athlete.totalActivityCount / 200) + 1;
    const queryConfig = { currentPage: pages, totalRows: 0 };

    // fetch the approximate total number of activities for the athlete
    const rows = await Promise.all(
      Array.from({ length: pages }, async (_, i) => {
        const pageNumber = i + 1;
        const query = `https://www.strava.com/api/v3/athlete/activities?per_page=200&page=${pageNumber}`;
        const result = await fetchStravaActivities(accessToken, query);
        return result;
      })
    );

    rows.forEach((result) => {
      if (!result.length) return;
      activities.push(...result);
      queryConfig.totalRows += result.length;
    });

    // if the total number of activities is a multiple of 200, fetch any remaining activities
    while (queryConfig.totalRows % 200 === 0) {
      const query = `https://www.strava.com/api/v3/athlete/activities?per_page=200&page=${queryConfig.currentPage}`;
      const result = await fetchStravaActivities(accessToken, query);
      if (!result.length) break;

      activities.push(...result);
      queryConfig.totalRows += result.length;
      queryConfig.currentPage++;
    }

    await stashActivities(activities);

    return NextResponse.json(activities);
  } catch {
    return NextResponse.json(
      { error: "Failed to retrieve activities" },
      { status: 500 }
    );
  }
}
