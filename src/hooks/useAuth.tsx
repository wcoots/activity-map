"use client";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { message } from "antd";
import dayjs from "dayjs";
import { LngLat, LngLatBounds } from "mapbox-gl";

import { useAuthStore, useActivityStore, useUIStore } from "@/store";
import { decodePolyline } from "@/utils";
import {
  LocalStorageKey,
  Athlete,
  RawActivity,
  RawAthelete,
  Activity,
  GeocodedActivities,
  CountryCount,
  LoadingText,
} from "@/types";

export function useAuth() {
  const searchParams = useSearchParams();
  const [messageApi, contextHolder] = message.useMessage();

  const { setIsAuthenticated, setAthleteLoading, setAthlete } = useAuthStore();
  const {
    setActivitiesLoading,
    setActivities,
    setFilteredActivityIds,
    setLastRefreshed,
    setCountries,
  } = useActivityStore();
  const { setLoadingText } = useUIStore();

  function extractCountries(activities: Activity[]): CountryCount[] {
    const countries: CountryCount[] = [];

    activities.forEach((activity) => {
      if (!activity.location) return;

      const country = countries.find((country) => {
        return country.name === activity.location?.country;
      });

      if (country) country.count += 1;
      else countries.push({ name: activity.location.country, count: 1 });
    });

    return countries;
  }

  useEffect(() => {
    // Check authentication status and fetch athlete/activities if authenticated
    async function checkAuth() {
      try {
        setAthleteLoading(true);
        setActivitiesLoading(true);
        setLoadingText(LoadingText.Strava);

        const response = await fetch("/api/auth/check");

        if (response.status === 200) {
          setIsAuthenticated(true);
          await Promise.all([fetchAthlete(), fetchActivities()]);
        } else {
          setIsAuthenticated(false);
        }
      } catch {
        setIsAuthenticated(false);
      }
    }

    async function fetchAthlete() {
      try {
        const cachedAthlete = localStorage.getItem(LocalStorageKey.Athlete);

        if (cachedAthlete) {
          const { ts, data } = JSON.parse(cachedAthlete);
          setLastRefreshed(dayjs(parseInt(ts, 10)).toDate());

          const cacheAge = Date.now() - parseInt(ts, 10);

          if (cacheAge < 3600000) {
            setAthlete(data);
            return;
          }
        }

        const response = await fetch("/api/athlete");
        if (!response.ok) return;

        const result: RawAthelete = await response.json();
        const athlete: Athlete = {
          id: result.id,
          firstName: result.firstname,
          lastName: result.lastname,
          imageUrl: result.profile_medium,
        };

        setAthlete(athlete);

        localStorage.setItem(
          LocalStorageKey.Athlete,
          JSON.stringify({ ts: Date.now().toString(), data: athlete })
        );
      } catch (err) {
        console.error("Error fetching athlete:", err);
      } finally {
        setAthleteLoading(false);
      }
    }

    async function fetchActivities() {
      try {
        const cachedActivities = localStorage.getItem(
          LocalStorageKey.Activities
        );

        if (cachedActivities) {
          const { ts, data: activities }: { ts: string; data: Activity[] } =
            JSON.parse(cachedActivities);
          setLastRefreshed(dayjs(parseInt(ts, 10)).toDate());

          const cacheAge = Date.now() - parseInt(ts, 10);

          if (cacheAge < 3600000) {
            activities.forEach((activity) => {
              const { bounds, startDate } = activity;
              // parse bounds and startDate from JSON
              activity.bounds = new LngLatBounds(bounds._sw, bounds._ne);
              activity.startDate = new Date(startDate);
            });

            setActivities(activities);
            setFilteredActivityIds(activities.map((activity) => activity.id));
            setCountries(extractCountries(activities));
            return;
          }
        }

        const response = await fetch("/api/activities");
        if (!response.ok) return;

        const result: RawActivity[] = await response.json();
        const activities = result
          .filter((activity) => activity.map.summary_polyline.length)
          .map((activity): Activity => {
            const positions = decodePolyline(activity.map.summary_polyline);
            const longitudes = positions.map((p) => p.lng);
            const latitudes = positions.map((p) => p.lat);
            const bounds = new LngLatBounds(
              [Math.max(...longitudes), Math.max(...latitudes)],
              [Math.min(...longitudes), Math.min(...latitudes)]
            );

            return {
              id: activity.id,
              name: activity.name,
              distance: activity.distance,
              movingTime: activity.moving_time,
              elapsedTime: activity.elapsed_time,
              totalElevationGain: activity.total_elevation_gain,
              averageSpeed: activity.average_speed,
              type: activity.sport_type,
              startDate: new Date(activity.start_date),
              positions,
              bounds,
              location: null,
            };
          })
          .reverse();

        const geocodedActivities = await geocodeActivities(activities);

        setActivities(geocodedActivities);
        setFilteredActivityIds(geocodedActivities.map((a) => a.id));
        setCountries(extractCountries(geocodedActivities));
        setLastRefreshed(new Date());

        localStorage.setItem(
          LocalStorageKey.Activities,
          JSON.stringify({
            ts: Date.now().toString(),
            data: geocodedActivities,
          })
        );
      } catch (err) {
        console.error("Error fetching activities:", err);
      } finally {
        setActivitiesLoading(false);
      }
    }

    async function geocodeActivities(activities: Activity[]) {
      try {
        setLoadingText(LoadingText.Geocoding);
        const activityInitialPositions: { [activityId: number]: LngLat } = {};
        activities.forEach((activity) => {
          activityInitialPositions[activity.id] = activity.positions[0];
        });

        const response = await fetch("/api/geocoding", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(activityInitialPositions),
        });
        if (!response.ok) return [];

        const result: GeocodedActivities = await response.json();

        return activities.map((activity) => ({
          ...activity,
          location: result[activity.id] ?? null,
        }));
      } catch (err) {
        console.error("Error fetching geocodes:", err);
        return [];
      }
    }

    checkAuth();
  }, [
    setLoadingText,
    setAthlete,
    setActivities,
    setFilteredActivityIds,
    setCountries,
    setLastRefreshed,
    setActivitiesLoading,
    setAthleteLoading,
    setIsAuthenticated,
  ]);

  useEffect(() => {
    // Show authentication error message if present in URL params
    const errorParam = searchParams.get("error");
    if (errorParam) {
      messageApi.open({ type: "error", content: "Authentication Cancelled" });
    }
  }, [searchParams, messageApi]);

  return { contextHolder };
}
