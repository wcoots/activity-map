import { LngLat } from "mapbox-gl";
import polyline from "@mapbox/polyline";

export function formatSeconds(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  let formatted = "";
  if (hours > 0) formatted += `${hours}h `;
  if (minutes > 0) formatted += `${minutes}m `;
  if (secs > 0 || formatted === "") formatted += `${secs}s`; // Include seconds or '0s' for 0 input

  return formatted.trim();
}

export function convertSpeedToPace(metresPerSecond: number) {
  if (metresPerSecond <= 0) {
    throw new Error("Speed must be greater than 0.");
  }

  const secondsPerKilometre = 1000 / metresPerSecond;
  const minutes = Math.floor(secondsPerKilometre / 60);
  const seconds = Math.round(secondsPerKilometre % 60);

  return `${minutes}:${seconds} /km`;
}

export function decodePolyline(encoded: string): LngLat[] {
  const latLngArray = polyline.decode(encoded);
  return latLngArray.map(([lat, lng]) => new LngLat(lng, lat));
}
