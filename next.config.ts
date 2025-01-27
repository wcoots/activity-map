/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    MAPBOX_API_KEY: process.env.MAPBOX_API_KEY,
    STRAVA_API_KEY: process.env.STRAVA_API_KEY,
  },
};

export default nextConfig;
