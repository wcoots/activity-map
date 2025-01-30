/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    MAPBOX_API_KEY: process.env.MAPBOX_API_KEY,
    STRAVA_CLIENT_ID: process.env.STRAVA_CLIENT_ID,
    STRAVA_CLIENT_SECRET: process.env.STRAVA_CLIENT_SECRET,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  },
};

export default nextConfig;
