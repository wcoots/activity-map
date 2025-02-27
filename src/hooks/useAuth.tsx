"use client";
import { useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  ActivityType,
} from "@/types";

export function useAuth() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [messageApi, contextHolder] = message.useMessage();

  const {
    setIsAuthenticated,
    setIsVisitorMode,
    setAthleteLoading,
    setAthlete,
  } = useAuthStore();

  const {
    activities: storeActivities,
    selectedActivityId,
    setActivitiesLoading,
    setActivities,
    setFilteredActivityIds,
    setLastRefreshed,
    setCountries,
    setActivityTypeSettings,
  } = useActivityStore();

  const user = searchParams.get("user");

  function extractCountries(activities: Activity[]) {
    return unique(
      activities
        .filter((activity) => activity.location)
        .map((activity) => activity.location!.country)
    );
  }

  const fetchAthlete = useCallback(async () => {
    try {
      const response = await fetch("/api/athlete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user }),
      });
      if (!response.ok) return;

      const athlete: Athlete = await response.json();
      setAthlete(athlete);
      return athlete;
    } catch (err) {
      console.error("Error fetching athlete:", err);
    } finally {
      setAthleteLoading(false);
    }
  }, [user, setAthlete, setAthleteLoading]);

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
            const fullPolylineAvailable = !!activity.map.polyline?.length;
            const positions = decodePolyline(
              fullPolylineAvailable
                ? activity.map.polyline!
                : activity.map.summary_polyline
            );
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
              summaryPositions: !fullPolylineAvailable,
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
      if (user) {
        await fetch("/api/auth/logout");

        const althete = await fetchAthlete();
        if (althete) {
          setIsVisitorMode(true);
          await fetchActivities(althete);
        } else {
          router.replace(window.location.pathname, { scroll: false });
        }
        return;
      }

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
    router,
    user,
    setAthleteLoading,
    setActivitiesLoading,
    setIsAuthenticated,
    setIsVisitorMode,
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

      return activities.map(
        (activity): Activity => ({
          ...activity,
          location: result[activity.id] ?? null,
        })
      );
    } catch (err) {
      console.error("Error fetching geocodes:", err);
      return [];
    }
  }

  const fetchActivity = useCallback(
    async (activityId: number) => {
      try {
        const response = await fetch("/api/activity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ activityId }),
        });
        if (!response.ok) return;

        const result: RawActivity | null = await response.json();
        if (!result) return;
        const { polyline } = result.map;

        if (polyline) {
          setActivities(
            storeActivities.map((activity) => {
              if (activity.id === activityId) {
                return {
                  ...activity,
                  summaryPositions: false,
                  positions: decodePolyline(polyline),
                };
              }
              return activity;
            })
          );
        }
      } catch (err) {
        console.error("Error fetching activity:", err);
      }
    },
    [storeActivities, setActivities]
  );

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

  useEffect(
    function fetchFullActivity() {
      if (!selectedActivityId) return;
      const selectedActivity = storeActivities.find(
        (activity) => activity.id === selectedActivityId
      );
      if (
        !selectedActivity ||
        !selectedActivity.summaryPositions ||
        selectedActivity.type === ActivityType.MotorcycleRide
      )
        return;

      fetchActivity(selectedActivityId);
    },
    [storeActivities, selectedActivityId, fetchActivity]
  );

  return { contextHolder };
}
