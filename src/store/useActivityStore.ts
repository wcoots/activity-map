import { create } from "zustand";
import { Activity, Label } from "@/types";
import { activitiesConfig } from "@/configs";

interface ActivityState {
  activitiesLoading: boolean;
  activities: Activity[];
  filteredActivityIds: number[];
  hoveredActivityId: number | null;
  selectedActivityId: number | null;
  activityTypeSettings: Record<Label, boolean | null>;
  minimumDistance: number;
  maximumDistance: number;
  highestDistance: number;
  keywordText: string;
  year: number | null;
  lastRefreshed: Date | null;
  countries: string[];
  selectedCountry: string | null;
  setActivitiesLoading: (loading: boolean) => void;
  setActivities: (activities: Activity[]) => void;
  setFilteredActivityIds: (activityIds: number[]) => void;
  setHoveredActivityId: (id: number | null) => void;
  setSelectedActivityId: (id: number | null) => void;
  setActivityTypeSettings: (
    activityTypeSettings: Record<Label, boolean | null>
  ) => void;
  setMinimumDistance: (distance: number) => void;
  setMaximumDistance: (distance: number) => void;
  setHighestDistance: (distance: number) => void;
  setKeywordText: (text: string) => void;
  setYear: (year: number | null) => void;
  setLastRefreshed: (date: Date) => void;
  setCountries: (countries: string[]) => void;
  setSelectedCountry: (country: string | null) => void;
}

export const useActivityStore = create<ActivityState>((set) => ({
  activitiesLoading: false,
  activities: [],
  filteredActivityIds: [],
  hoveredActivityId: null,
  selectedActivityId: null,
  activityTypeSettings: activitiesConfig.reduce(
    (acc, config) => ({ ...acc, [config.label]: true }),
    {} as Record<Label, boolean>
  ),
  minimumDistance: 0,
  maximumDistance: 100,
  highestDistance: 100,
  keywordText: "",
  year: null,
  lastRefreshed: null,
  countries: [],
  selectedCountry: null,
  setActivitiesLoading: (loading) => set({ activitiesLoading: loading }),
  setActivities: (activities) => set({ activities }),
  setFilteredActivityIds: (activityIds) =>
    set({ filteredActivityIds: activityIds }),
  setHoveredActivityId: (id) => set({ hoveredActivityId: id }),
  setSelectedActivityId: (id) => set({ selectedActivityId: id }),
  setActivityTypeSettings: (activityTypeSettings) =>
    set({ activityTypeSettings }),
  setMinimumDistance: (distance) => set({ minimumDistance: distance }),
  setMaximumDistance: (distance) => set({ maximumDistance: distance }),
  setHighestDistance: (distance) => set({ highestDistance: distance }),
  setKeywordText: (text) => set({ keywordText: text }),
  setYear: (year) => set({ year }),
  setLastRefreshed: (date) => set({ lastRefreshed: date }),
  setCountries: (countries) => set({ countries }),
  setSelectedCountry: (country) => set({ selectedCountry: country }),
}));
