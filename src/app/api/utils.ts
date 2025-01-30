import { headers } from "next/headers";

export async function getBaseUrl() {
  const { get: getHeader } = await headers();
  const host = getHeader("host");
  const protocol = host?.includes("localhost") ? "http" : "https"; // Use http for local dev, https for production
  return `${protocol}://${host}`;
}
