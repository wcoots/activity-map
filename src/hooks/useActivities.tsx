"use client";
import { useCallback } from "react";
import { useActivityStore } from "@/store";
import { activitiesConfig } from "@/configs";
import { Activity } from "@/types";

export function useActivities() {
  const {
    selectedActivityId,
    activityTypeSettings,
    minimumDistance,
    maximumDistance,
    keywordText,
    year,
    selectedCountry,
    setFilteredActivityIds,
    setSelectedActivityId,
  } = useActivityStore();

  const filterActivities = useCallback(
    (activities: Activity[]): Activity[] => {
      const minimumDistanceMetres = minimumDistance * 1000;
      const maximumDistanceMetres = maximumDistance * 1000;

      const filteredActivities = activities.filter((activity) => {
        const configItem = activitiesConfig.find((config) =>
          config.activityTypes.includes(activity.type)
        );

        if (!configItem) return;

        const typeSelected = activityTypeSettings[configItem.label];
        const distanceInRange =
          activity.distance >= minimumDistanceMetres &&
          activity.distance <= maximumDistanceMetres;
        const textMatch = keywordText.length
          ? activity.name.toLowerCase().includes(keywordText.toLowerCase())
          : true;
        const yearMatch = year
          ? activity.startDate.getFullYear() === year
          : true;
        const countryMatch = selectedCountry
          ? activity.location?.country === selectedCountry
          : true;

        return (
          typeSelected &&
          distanceInRange &&
          textMatch &&
          yearMatch &&
          countryMatch
        );
      });

      if (!filteredActivities.find(({ id }) => id === selectedActivityId)) {
        setSelectedActivityId(null);
      }

      setFilteredActivityIds(filteredActivities.map(({ id }) => id));

      return filteredActivities;
    },
    [
      activityTypeSettings,
      minimumDistance,
      maximumDistance,
      keywordText,
      year,
      selectedCountry,
      selectedActivityId,
      setSelectedActivityId,
      setFilteredActivityIds,
    ]
  );

  return { filterActivities };
}
