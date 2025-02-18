import { Activity, GeocodedActivities, Geocode } from "@/types";
import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { LngLat } from "mapbox-gl";

import { db } from "@/app/api/kysely";
import { unique } from "@/app/api/utils";

interface MapboxResponse {
  batch: {
    features: {
      type: "Feature";
      properties: {
        feature_type: "country" | "region" | "district";
        name: string;
        full_address: string;
      };
    }[];
  }[];
}

interface GeolocationQuery {
  id: number;
  types: string[];
  latitude: number;
  longitude: number;
}

const MAPBOX_API_KEY = process.env.MAPBOX_API_KEY!;

const redis = Redis.fromEnv();

function removeDuplicateLocations(address: string | null): string | null {
  if (!address) return address;
  const splitAddress = address.split(", ");
  const uniqueAddressElements = unique(splitAddress);
  return uniqueAddressElements.join(", ");
}

function generateCacheKey(latitude: number, longitude: number): string {
  return `${latitude},${longitude}`;
}

async function fetchMapboxGeolocationData(
  geolocationQueries: GeolocationQuery[]
) {
  if (geolocationQueries.length === 0) return [];

  const baseUrl = `https://api.mapbox.com/search/geocode/v6/batch?access_token=${MAPBOX_API_KEY}`;

  const mapboxResponses = await Promise.all(
    Array.from({
      length: Math.ceil(geolocationQueries.length / 1000),
    }).map(async (_, index) => {
      const start = index * 1000;
      const end = start + 1000;

      const response = await fetch(baseUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(geolocationQueries.slice(start, end)),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch geolocation data");
      }

      const { batch }: MapboxResponse = await response.json();

      return batch;
    })
  );

  return mapboxResponses.flat();
}

async function fetchGeolocationData(activityIds: number[]) {
  return db
    .selectFrom("activitymap.activities")
    .select(["id", "country", "address"])
    .where("id", "in", activityIds)
    .where("country", "is not", null)
    .where("address", "is not", null)
    .execute();
}

async function stashGeolocationData(geocodedActivities: GeocodedActivities) {
  return Promise.all(
    Object.entries(geocodedActivities).map(async ([activityId, geocode]) => {
      return db
        .updateTable("activitymap.activities")
        .set({ country: geocode.country, address: geocode.address })
        .where("id", "=", +activityId)
        .execute();
    })
  );
}

export async function POST(request: NextRequest) {
  try {
    const activityInitialPositions: { [activityId: number]: LngLat } =
      await request.json();
    const geocodedActivities: GeocodedActivities = {};

    const activityIds = Object.keys(activityInitialPositions).map(Number);
    const databaseGeocodes = await fetchGeolocationData(activityIds);

    databaseGeocodes.forEach(({ id, country, address }) => {
      if (country && address) geocodedActivities[id] = { country, address };
      delete activityInitialPositions[id];
    });

    const uncachedActivities = await Promise.all(
      Object.entries(activityInitialPositions).map(
        async ([activityId, position]) => {
          const { lat: latitude, lng: longitude } = position;
          const cacheKey = generateCacheKey(latitude, longitude);
          const cachedValue = await redis.get<Geocode>(cacheKey);

          if (cachedValue) {
            geocodedActivities[+activityId] = cachedValue;
            return null;
          } else {
            return { id: +activityId, positions: [position] };
          }
        }
      )
    );

    const geolocationQueries = uncachedActivities
      .filter((activity): activity is Activity => activity !== null)
      .map(({ id, positions }): GeolocationQuery => {
        const [{ lat: latitude, lng: longitude }] = positions;
        return {
          id,
          types: ["country", "region", "district"],
          latitude,
          longitude,
        };
      });

    const mapboxResponse = await fetchMapboxGeolocationData(geolocationQueries);

    mapboxResponse.forEach(async (location, index) => {
      if (location.features.length > 0) {
        const countryFeature = location.features.find(
          (feature) => feature.properties.feature_type === "country"
        );
        const districtFeature = location.features.find(
          (feature) => feature.properties.feature_type === "district"
        );
        const regionFeature = location.features.find(
          (feature) => feature.properties.feature_type === "region"
        );

        const country = countryFeature?.properties.name ?? null;
        const rawAddress =
          districtFeature?.properties.full_address ??
          regionFeature?.properties.full_address ??
          null;
        const address = removeDuplicateLocations(rawAddress);

        if (!country || !address) return;

        const { latitude, longitude } = geolocationQueries[index];
        const cacheKey = generateCacheKey(latitude, longitude);
        const geocode: Geocode = { country, address };
        geocodedActivities[geolocationQueries[index].id] = geocode;
        await redis.set(cacheKey, JSON.stringify(geocode));
      }
    });

    await stashGeolocationData(geocodedActivities);

    return NextResponse.json(geocodedActivities);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
