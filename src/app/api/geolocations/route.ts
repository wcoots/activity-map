import { NextResponse } from "next/server";

export async function POST() {
  try {
    await new Promise((resolve) => setTimeout(resolve, 2000));

    return NextResponse.json([]);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
