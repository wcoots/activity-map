import { NextRequest, NextResponse } from "next/server";

import { db } from "@/app/api/kysely";
import { retrieveAccessToken } from "@/app/api/utils";
import { Athlete, RawAthelete } from "@/types";

async function fetchAthlete(athleteId: number) {
  return db
    .selectFrom("activitymap.athletes")
    .select(["id", "forename", "surname", "profile", "public"])
    .where("id", "=", athleteId)
    .where("public", "=", true)
    .executeTakeFirst();
}

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
      city: athlete.city?.length ? athlete.city : null,
      state: athlete.state?.length ? athlete.state : null,
      country: athlete.country?.length ? athlete.country : null,
      sex: athlete.sex,
      weight: athlete.weight ? athlete.weight : null,
      profile: athlete.profile,
      profile_medium: athlete.profile_medium,
      public: false,
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

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { user }: { user?: string | null } = await request.json();

    if (user) {
      const databaseAthlete = await fetchAthlete(+user);
      if (!databaseAthlete)
        return NextResponse.json(
          { error: "Athlete not found" },
          { status: 404 }
        );

      const athlete: Athlete = {
        id: databaseAthlete.id,
        firstName: databaseAthlete.forename ?? "",
        lastName: databaseAthlete.surname ?? "",
        imageUrl: databaseAthlete.profile,
        public: databaseAthlete.public,
        totalActivityCount: Infinity,
      };

      return NextResponse.json(athlete);
    }

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

    const databaseAthlete = await fetchAthlete(+rawAthlete.id);

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
      public: databaseAthlete?.public ?? false,
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
