import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  refreshStravaToken,
  setTokenCookies,
} from "../../utils";

export async function GET() {
  const cookieStore = await cookies();

  if (cookieStore.get(ACCESS_TOKEN_COOKIE)?.value) {
    return NextResponse.json({ authenticated: true }, { status: 200 });
  }

  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;
  if (refreshToken) {
    const data = await refreshStravaToken(refreshToken);
    if (data) {
      setTokenCookies(cookieStore, data);
      return NextResponse.json({ authenticated: true }, { status: 200 });
    }
  }

  return NextResponse.json({ authenticated: false }, { status: 401 });
}
