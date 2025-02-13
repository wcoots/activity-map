"use client";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { message } from "antd";
import dayjs from "dayjs";
import { LngLat, LngLatBounds } from "mapbox-gl";

import { useAuthStore, useActivityStore } from "@/store";
import { decodePolyline, unique } from "@/utils";
import {
  LocalStorageKey,
  Athlete,
  RawActivity,
  RawAthelete,
  Activity,
  GeocodedActivities,
} from "@/types";

export function useAuth() {
  const searchParams = useSearchParams();
  const [messageApi, contextHolder] = message.useMessage();

  const { setIsAuthenticated, setAthleteLoading, setAthlete } = useAuthStore();
  const {
    setActivitiesLoading,
    setLoadedActivityCount,
    setActivities,
    setFilteredActivityIds,
    setLastRefreshed,
    setCountries,
  } = useActivityStore();

  function extractCountries(activities: Activity[]) {
    return unique(
      activities
        .filter((activity) => activity.location)
        .map((activity) => activity.location!.country)
    );
  }

  useEffect(() => {
    // Check authentication status and fetch athlete/activities if authenticated
    async function checkAuth() {
      try {
        setAthleteLoading(true);
        setActivitiesLoading(true);

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
        const timestampCacheKey = `${LocalStorageKey.Activities}-ts`;
        const cacheTimestamp = Number(localStorage.getItem(timestampCacheKey));

        // if cache is less than an hour old, use it
        if (Date.now() - cacheTimestamp < 3600000) {
          const pageCountCacheKey = `${LocalStorageKey.Activities}-pages`;
          const pageCount = Number(localStorage.getItem(pageCountCacheKey));

          if (pageCount) {
            const cachedActivities: Activity[] = [];

            for (let page = 1; page <= pageCount; page++) {
              const cacheKey = `${LocalStorageKey.Activities}-${page}`;
              const activities = localStorage.getItem(cacheKey);
              if (activities) cachedActivities.push(...JSON.parse(activities));
            }

            cachedActivities.forEach((activity) => {
              const { bounds, startDate } = activity;
              // parse bounds and startDate from JSON
              activity.bounds = new LngLatBounds(bounds._sw, bounds._ne);
              activity.startDate = new Date(startDate);
            });

            if (cachedActivities.length > 0) {
              setLastRefreshed(new Date(cacheTimestamp));
              setActivities(cachedActivities);
              setFilteredActivityIds(cachedActivities.map(({ id }) => id));
              setCountries(extractCountries(cachedActivities));
              return;
            }
          }
        }

        const activities: Activity[] = [];
        const fetchConfig = { page: 1, hasMore: true };

        while (fetchConfig.hasMore) {
          const response = await fetch("/api/activities", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ page: fetchConfig.page }),
          });

          if (!response.ok) break;

          const result: RawActivity[] = await response.json();
          if (result.length === 0) break;

          const processedActivities = result
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

          const geocodedActivities = await geocodeActivities(
            processedActivities
          );

          setLoadedActivityCount(geocodedActivities.length);
          activities.push(...geocodedActivities);

          const cacheKey = `${LocalStorageKey.Activities}-${fetchConfig.page}`;
          localStorage.setItem(cacheKey, JSON.stringify(geocodedActivities));

          const pagesCacheKey = `${LocalStorageKey.Activities}-pages`;
          localStorage.setItem(pagesCacheKey, fetchConfig.page.toString());

          fetchConfig.hasMore = result.length === 200;
          fetchConfig.page++;
        }

        setActivities(activities);
        setFilteredActivityIds(activities.map((a) => a.id));
        setCountries(extractCountries(activities));
        setLastRefreshed(new Date());

        localStorage.setItem(
          `${LocalStorageKey.Activities}-ts`,
          Date.now().toString()
        );
      } catch (err) {
        console.error("Error fetching activities:", err);
      } finally {
        setActivitiesLoading(false);
      }
    }

    async function geocodeActivities(activities: Activity[]) {
      try {
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
    setAthlete,
    setActivities,
    setFilteredActivityIds,
    setCountries,
    setLastRefreshed,
    setActivitiesLoading,
    setAthleteLoading,
    setIsAuthenticated,
    setLoadedActivityCount,
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
