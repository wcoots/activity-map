import { Activity, GeocodedActivities, Geocode } from "@/types";
import { NextRequest, NextResponse } from "next/server";
import { isNextResponse, unique } from "../utils";

const MAPBOX_API_KEY = process.env.MAPBOX_API_KEY!;

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

const geocodeCache: { [latlng: string]: Geocode } = {};

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

    const uncachedActivities = activities.filter(({ positions }) => {
      const [{ lat: latitude, lng: longitude }] = positions;
      const cacheKey = generateCacheKey(latitude, longitude);
      return !geocodeCache[cacheKey];
    });

    const queries = uncachedActivities.map(({ id, positions }) => {
      const [{ lat: latitude, lng: longitude }] = positions;
      return { id, types: ["country", "place"], latitude, longitude };
    });

    async function fetchGeocodes() {
      if (queries.length === 0) return { batch: [] };

      const response = await fetch(baseUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(queries),
      });

      if (!response.ok) {
        return NextResponse.json(
          { error: "Failed to fetch geolocation data" },
          { status: response.status }
        );
      }

      return response.json() as Promise<MapboxResponse>;
    }

    const mapboxResponse = await fetchGeocodes();

    if (isNextResponse(mapboxResponse)) return mapboxResponse;

    const { batch: geocodedLocations } = mapboxResponse;

    geocodedLocations.forEach((location, index) => {
      if (location.features.length > 0) {
        const countryFeature = location.features.find(
          (feature) => feature.properties.feature_type === "country"
        );
        const placeFeature = location.features.find(
          (feature) => feature.properties.feature_type === "place"
        );

        const country = countryFeature?.properties.name ?? null;
        const address = placeFeature?.properties.full_address ?? null;
        const normalisedAddress = removeDuplicateLocations(address);

        if (!country || !normalisedAddress) return;

        const { latitude, longitude } = queries[index];
        const cacheKey = generateCacheKey(latitude, longitude);
        geocodeCache[cacheKey] = { country, address: normalisedAddress };
      }
    });

    const geocodedActivities = activities.reduce(
      (geocodedActivities: GeocodedActivities, { id, positions }) => {
        const [{ lat: latitude, lng: longitude }] = positions;
        const cacheKey = generateCacheKey(latitude, longitude);
        geocodedActivities[id] = geocodeCache[cacheKey] || null;
        return geocodedActivities;
      },
      {}
    );

    return NextResponse.json(geocodedActivities);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
