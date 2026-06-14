import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  REFRESH_TOKEN_COOKIE,
  refreshStravaToken,
  setTokenCookies,
} from "../../utils";

export async function GET() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;

  if (!refreshToken) {
    return NextResponse.json(
      { error: "No refresh token found" },
      { status: 401 }
    );
  }

  const data = await refreshStravaToken(refreshToken);
  if (!data) {
    return NextResponse.json(
      { error: "Failed to refresh token" },
      { status: 401 }
    );
  }

  setTokenCookies(cookieStore, data);
  return NextResponse.json({ success: true });
}
