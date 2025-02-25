import { LngLat } from "mapbox-gl";
import polyline from "@mapbox/polyline";
import { Feature, FeatureCollection } from "geojson";
import { ActivityType, UnitSystem } from "@/types";
import { unitSystemConfig } from "@/configs";

export function formatActivityType(activityType: ActivityType): string {
  return activityType.replace(/([a-z])([A-Z])/g, "$1 $2");
}

export function formatDistance(
  metres: number,
  unitSystem: UnitSystem,
  fractionDigits?: number
): string {
  fractionDigits = typeof fractionDigits === "number" ? fractionDigits : 2;

  const denominator = unitSystem === "metric" ? 1000 : 1609.344;
  const unit = unitSystemConfig[unitSystem].distance;
  return `${(metres / denominator).toFixed(fractionDigits)}${unit}`;
}

export function formatSeconds(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.round(seconds % 60);

  let formatted = "";
  if (hours > 0) formatted += `${hours}h `;
  if (minutes > 0) formatted += `${minutes}m `;
  if (secs > 0 || formatted === "") formatted += `${secs}s`; // Include seconds or '0s' for 0 input

  return formatted.trim();
}

export function formatSpeed(
  metresPerSecond: number,
  activityType: ActivityType,
  unitSystem: UnitSystem
): string {
  if (activityType === ActivityType.MotorcycleRide) {
    return convertSpeedToSph(metresPerSecond, unitSystem);
  } else {
    return convertSpeedToPace(metresPerSecond, unitSystem);
  }
}

function convertSpeedToSph(
  metresPerSecond: number,
  unitSystem: UnitSystem
): string {
  const multiplier = unitSystem === "metric" ? 3.6 : 2.23694;
  const unit = unitSystemConfig[unitSystem].speed;
  return `${Math.floor(metresPerSecond * multiplier)}${unit}`;
}

function convertSpeedToPace(
  metresPerSecond: number,
  unitSystem: UnitSystem
): string {
  const numerator = unitSystem === "metric" ? 1000 : 1609.344;
  const unit = unitSystemConfig[unitSystem].distance;
  const secondsPerUnit = numerator / metresPerSecond;
  const minutes = Math.floor(secondsPerUnit / 60);
  const seconds = Math.round(secondsPerUnit % 60)
    .toString()
    .padStart(2, "0");

  return `${minutes}:${seconds}/${unit}`;
}

export function formatElevation(
  metres: number,
  unitSystem: UnitSystem
): string {
  const multiplier = unitSystem === "metric" ? 1 : 3.28084;
  const unit = unitSystemConfig[unitSystem].elevation;
  return `${Math.floor(metres * multiplier)}${unit}`;
}

export function decodePolyline(encoded: string): LngLat[] {
  const latLngArray = polyline.decode(encoded);
  return latLngArray.map(([lat, lng]) => new LngLat(lng, lat));
}

export function isMobile(): boolean {
  return window.innerWidth < 768;
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

export function createFeatureCollection(
  features: Feature[]
): FeatureCollection {
  return { type: "FeatureCollection", features };
}
