import { Activity, GeocodedActivities, Geocode } from "@/types";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "redis";
import { isNextResponse, unique } from "../utils";

interface MapboxResponse {
  batch: {
    features: {
      type: "Feature";
      properties: {
        feature_type: "place" | "country";
        name: string;
        full_address: string;
      };
    }[];
  }[];
}

const MAPBOX_API_KEY = process.env.MAPBOX_API_KEY!;
const REDIS_URL = process.env.REDIS_URL!;

const redis = await createClient({ url: REDIS_URL }).connect();

function removeDuplicateLocations(address: string | null): string | null {
  if (!address) return address;
  const splitAddress = address.split(", ");
  const uniqueAddressElements = unique(splitAddress);
  return uniqueAddressElements.join(", ");
}

function generateCacheKey(latitude: number, longitude: number): string {
  return `${latitude},${longitude}`;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const baseUrl = `https://api.mapbox.com/search/geocode/v6/batch?access_token=${MAPBOX_API_KEY}`;
    const activities: Activity[] = await request.json();

    const geocodedActivities: GeocodedActivities = {};

    const uncachedActivities = await Promise.all(
      activities.map(async (activity) => {
        const [{ lat: latitude, lng: longitude }] = activity.positions;
        const cacheKey = generateCacheKey(latitude, longitude);
        const cachedValue = await redis.get(cacheKey);
        if (cachedValue) {
          const parsedValue = JSON.parse(cachedValue) as Geocode;
          geocodedActivities[activity.id] = parsedValue;
          return null;
        } else {
          return activity;
        }
      })
    );

    const geolocationQueries = uncachedActivities
      .filter((activity): activity is Activity => activity !== null)
      .map(({ id, positions }) => {
        const [{ lat: latitude, lng: longitude }] = positions;
        return { id, types: ["country", "place"], latitude, longitude };
      });

    async function fetchGeolocationData() {
      if (geolocationQueries.length === 0) return [];

      const response = await fetch(baseUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(geolocationQueries),
      });

      if (!response.ok) {
        return NextResponse.json(
          { error: "Failed to fetch geolocation data" },
          { status: response.status }
        );
      }

      const result: MapboxResponse = await response.json();
      return result.batch;
    }

    const mapboxResponse = await fetchGeolocationData();
    if (isNextResponse(mapboxResponse)) return mapboxResponse;

    mapboxResponse.forEach(async (location, index) => {
      if (location.features.length > 0) {
        const countryFeature = location.features.find(
          (feature) => feature.properties.feature_type === "country"
        );
        const placeFeature = location.features.find(
          (feature) => feature.properties.feature_type === "place"
        );

        const country = countryFeature?.properties.name ?? null;
        const rawAddress = placeFeature?.properties.full_address ?? null;
        const address = removeDuplicateLocations(rawAddress);

        if (!country || !address) return;

        const { latitude, longitude } = geolocationQueries[index];
        const cacheKey = generateCacheKey(latitude, longitude);
        const geocode: Geocode = { country, address };
        await redis.set(cacheKey, JSON.stringify(geocode));
        geocodedActivities[geolocationQueries[index].id] = geocode;
      }
    });

    return NextResponse.json(geocodedActivities);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
