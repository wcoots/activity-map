import { NextRequest, NextResponse } from "next/server";

import { db } from "@/app/api/kysely";

async function setPublicity(athleteId: number, publicity: boolean) {
  return db
    .updateTable("activitymap.athletes")
    .set({ public: publicity })
    .where("id", "=", athleteId)
    .executeTakeFirst();
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { athleteId, publicity }: { athleteId: number; publicity: boolean } =
      await request.json();

    await setPublicity(athleteId, publicity);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to set athlete publicity" },
      { status: 500 }
    );
  }
}
