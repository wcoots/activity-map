"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { message } from "antd";
import dayjs from "dayjs";

import { useStore } from "@/store";
import { LocalStorageKey, Athlete, RawActivity, RawAthelete } from "@/types";

export function useAuth() {
  const searchParams = useSearchParams();
  const [messageApi, contextHolder] = message.useMessage();

  const { setAthlete, setActivities, setLastRefreshed } = useStore();

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [athleteLoading, setAthleteLoading] = useState(false);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [rawActivities, setRawActivities] = useState<RawActivity[]>([]);

  useEffect(() => {
    // Check authentication status and fetch athlete/activities if authenticated
    async function checkAuth() {
      try {
        const response = await fetch("/api/auth/check");

        if (response.status === 200) {
          setIsAuthenticated(true);
          await Promise.all([fetchAthlete(), fetchActivities()]);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
        setIsAuthenticated(false);
      }
    }

    async function fetchAthlete() {
      try {
        setAthleteLoading(true);
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
        setActivitiesLoading(true);
        const cachedActivities = localStorage.getItem(
          LocalStorageKey.Activities
        );

        if (cachedActivities) {
          const { ts, data } = JSON.parse(cachedActivities);
          setLastRefreshed(dayjs(parseInt(ts, 10)).toDate());

          const cacheAge = Date.now() - parseInt(ts, 10);

          if (cacheAge < 3600000) {
            setRawActivities(data);
            return;
          }
        }

        const response = await fetch("/api/activities");
        if (!response.ok) return;

        const result: RawActivity[] = await response.json();
        setRawActivities(result);
        setLastRefreshed(new Date());

        localStorage.setItem(
          LocalStorageKey.Activities,
          JSON.stringify({ ts: Date.now().toString(), data: result })
        );
      } catch (err) {
        console.error("Error fetching activities:", err);
      } finally {
        setActivitiesLoading(false);
      }
    }

    checkAuth();
  }, [setAthlete, setActivities, setLastRefreshed]);

  useEffect(() => {
    // Show authentication error message if present in URL params
    const errorParam = searchParams.get("error");
    if (errorParam) {
      messageApi.open({ type: "error", content: "Authentication Cancelled" });
    }
  }, [searchParams, messageApi]);

  return {
    contextHolder,
    isAuthenticated,
    athleteLoading,
    activitiesLoading,
    rawActivities,
  };
}
