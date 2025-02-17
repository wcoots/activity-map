import { NextResponse } from "next/server";

import { db } from "@/app/api/kysely";
import { retrieveAccessToken } from "@/app/api/utils";
import { Athlete, RawAthelete } from "@/types";

async function stashAthlete(athlete: RawAthelete) {
  return db
    .insertInto("activitymap.athletes")
    .values({
      id: athlete.id,
      updated_ts: new Date(),
      username: athlete.username,
      forename: athlete.firstname,
      surname: athlete.lastname,
      bio: athlete.bio?.length ? athlete.bio : null,
      city: athlete.city,
      state: athlete.state,
      country: athlete.country,
      sex: athlete.sex,
      weight: athlete.weight,
      profile: athlete.profile,
      profile_medium: athlete.profile_medium,
    })
    .onConflict((oc) =>
      oc.column("id").doUpdateSet((eb) => ({
        updated_ts: new Date(),
        username: eb.ref("excluded.username"),
        forename: eb.ref("excluded.forename"),
        surname: eb.ref("excluded.surname"),
        bio: eb.ref("excluded.bio"),
        city: eb.ref("excluded.city"),
        state: eb.ref("excluded.state"),
        country: eb.ref("excluded.country"),
        sex: eb.ref("excluded.sex"),
        weight: eb.ref("excluded.weight"),
        profile: eb.ref("excluded.profile"),
        profile_medium: eb.ref("excluded.profile_medium"),
      }))
    )
    .executeTakeFirst();
}

export async function GET(): Promise<NextResponse> {
  try {
    const accessToken = await retrieveAccessToken();
    if (typeof accessToken !== "string") return accessToken;

    const athleteResponse = await fetch(
      "https://www.strava.com/api/v3/athlete",
      { method: "GET", headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!athleteResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch athlete" },
        { status: athleteResponse.status }
      );
    }

    const rawAthlete: RawAthelete = await athleteResponse.json();

    const athleteStatsResponse = await fetch(
      `https://www.strava.com/api/v3/athletes/${rawAthlete.id}/stats`,
      { method: "GET", headers: { Authorization: `Bearer ${accessToken}` } }
    );

    const athleteStats: {
      all_run_totals: { count: number };
      all_ride_totals: { count: number };
      all_swim_totals: { count: number };
    } = await athleteStatsResponse.json();

    const totalActivityCount =
      athleteStats.all_run_totals.count +
      athleteStats.all_ride_totals.count +
      athleteStats.all_swim_totals.count;

    const athlete: Athlete = {
      id: rawAthlete.id,
      firstName: rawAthlete.firstname ?? "",
      lastName: rawAthlete.lastname ?? "",
      imageUrl: rawAthlete.profile_medium,
      totalActivityCount: totalActivityCount,
    };

    stashAthlete(rawAthlete);

    return NextResponse.json(athlete);
  } catch {
    return NextResponse.json(
      { error: "Failed to retrieve athlete" },
      { status: 500 }
    );
  }
}
