"use client";
import { useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { message } from "antd";
import { LngLat, LngLatBounds } from "mapbox-gl";

import { activitiesConfig } from "@/configs";
import { useAuthStore, useActivityStore } from "@/store";
import { decodePolyline, unique } from "@/utils";
import {
  Athlete,
  RawActivity,
  Activity,
  GeocodedActivities,
  Label,
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
    setActivityTypeSettings,
  } = useActivityStore();

  function extractCountries(activities: Activity[]) {
    return unique(
      activities
        .filter((activity) => activity.location)
        .map((activity) => activity.location!.country)
    );
  }

  const fetchAthlete = useCallback(async () => {
    try {
      const response = await fetch("/api/athlete");
      if (!response.ok) return;

      const athlete: Athlete = await response.json();
      setAthlete(athlete);
      return athlete;
    } catch (err) {
      console.error("Error fetching athlete:", err);
    } finally {
      setAthleteLoading(false);
    }
  }, [setAthlete, setAthleteLoading]);

  const fetchActivities = useCallback(
    async (athlete: Athlete) => {
      try {
        const response = await fetch("/api/activities", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ athlete }),
        });

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
              totalElevationGain: activity.total_elevation_gain,
              averageSpeed: activity.average_speed,
              type: activity.sport_type,
              startDate: new Date(activity.start_date),
              positions,
              bounds,
              location: null,
            };
          })
          .sort((activityA, activityB) => {
            return (
              activityA.startDate.getTime() - activityB.startDate.getTime()
            );
          });

        const activityTypeSettings = activitiesConfig.reduce((acc, config) => {
          const activitiesOfType = !!activities.find((activity) =>
            config.activityTypes.includes(activity.type)
          );
          if (!activitiesOfType) return acc;
          return { ...acc, [config.label]: config.label !== "Other" };
        }, {} as Record<Label, boolean | null>);
        setActivityTypeSettings(activityTypeSettings);

        const geocodedActivities = await geocodeActivities(activities);
        setActivities(geocodedActivities);
        setFilteredActivityIds(geocodedActivities.map((a) => a.id));
        setCountries(extractCountries(geocodedActivities));
        setLastRefreshed(new Date());
      } catch (err) {
        console.error("Error fetching activities:", err);
      } finally {
        setActivitiesLoading(false);
      }
    },
    [
      setActivities,
      setActivitiesLoading,
      setFilteredActivityIds,
      setCountries,
      setLastRefreshed,
      setActivityTypeSettings,
    ]
  );

  const checkAuth = useCallback(async () => {
    // Check authentication status and fetch athlete/activities if authenticated
    try {
      setAthleteLoading(true);
      setActivitiesLoading(true);

      const response = await fetch("/api/auth/check");

      if (response.status === 200) {
        setIsAuthenticated(true);
        const althete = await fetchAthlete();
        if (althete) await fetchActivities(althete);
      } else {
        setIsAuthenticated(false);
      }
    } catch {
      setIsAuthenticated(false);
    }
  }, [
    setAthleteLoading,
    setActivitiesLoading,
    setIsAuthenticated,
    fetchAthlete,
    fetchActivities,
  ]);

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

  useEffect(
    function checkAuthAndLoadData() {
      checkAuth();
    },
    [checkAuth]
  );

  useEffect(
    function handleAuthCancellation() {
      const errorParam = searchParams.get("error");
      if (errorParam) {
        // Show authentication error message if present in URL params
        messageApi.open({ type: "error", content: "Authentication Cancelled" });
      }
    },
    [searchParams, messageApi]
  );

  return { contextHolder };
}
