import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function getBaseUrl() {
  const { get: getHeader } = await headers();
  const host = getHeader("host");
  const protocol = host?.includes("localhost") ? "http" : "https"; // Use http for local dev, https for production
  return `${protocol}://${host}`;
}

export function unique<T>(array: T[]): T[] {
  const seen = new Set<T>();
  return array.filter((item) => {
    if (seen.has(item)) {
      return false;
    }
    seen.add(item);
    return true;
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isNextResponse(response: any): response is NextResponse {
  return response && response.json && response.status;
}
