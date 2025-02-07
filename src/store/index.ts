import { activityTypeConfig } from "@/configs";
import { Athlete, Activity, Label, Theme } from "@/types";
import { create } from "zustand";

interface State {
  theme: Theme;
  athlete: Athlete | null;
  activities: Activity[];
  filteredActivityIds: number[];
  hoveredActivityId: number | null;
  selectedActivityId: number | null;
  activityTypeSettings: Record<Label, boolean>;
  activityTypeColourSettings: Record<Label, { [key in Theme]: string }>;
  minimumDistance: number;
  maximumDistance: number;
  highestDistance: number;
  keywordText: string;
  year: number | null;
  lastRefreshed: Date | null;
  setTheme: (theme: Theme) => void;
  setAthlete: (athlete: Athlete | null) => void;
  setActivities: (activities: Activity[]) => void;
  setFilteredActivityIds: (activityIds: number[]) => void;
  setHoveredActivityId: (activityId: number | null) => void;
  setSelectedActivityId: (activityId: number | null) => void;
  setActivityTypeSettings: (
    activityTypeSettings: Record<Label, boolean>
  ) => void;
  setMinimumDistance: (minimumDistance: number) => void;
  setMaximumDistance: (maximumDistance: number) => void;
  setHighestDistance: (highestDistance: number) => void;
  setKeywordText: (keywordText: string) => void;
  setYear: (year: number | null) => void;
  setLastRefreshed: (lastRefreshed: Date) => void;
}

export const useStore = create<State>((set) => ({
  theme: "dark",
  athlete: null,
  activities: [],
  filteredActivityIds: [],
  hoveredActivityId: null,
  selectedActivityId: null,
  activityTypeSettings: activityTypeConfig.reduce(
    (acc, config) => ({ ...acc, [config.label]: true }),
    {} as Record<Label, boolean>
  ),
  activityTypeColourSettings: activityTypeConfig.reduce(
    (acc, config) => ({ ...acc, [config.label]: config.colour }),
    {} as Record<Label, { [key in Theme]: string }>
  ),
  minimumDistance: 0,
  maximumDistance: 100,
  highestDistance: 100,
  keywordText: "",
  year: null,
  lastRefreshed: null,
  setTheme: (theme) => set({ theme }),
  setAthlete: (athlete) => set({ athlete }),
  setActivities: (activities) => set({ activities }),
  setFilteredActivityIds: (activityIds) =>
    set({ filteredActivityIds: activityIds }),
  setHoveredActivityId: (hoveredActivityId) => set({ hoveredActivityId }),
  setSelectedActivityId: (selectedActivityId) => set({ selectedActivityId }),
  setActivityTypeSettings: (activityTypeSettings) =>
    set({ activityTypeSettings }),
  setMinimumDistance: (minimumDistance) => set({ minimumDistance }),
  setMaximumDistance: (maximumDistance) => set({ maximumDistance }),
  setHighestDistance: (highestDistance) => set({ highestDistance }),
  setKeywordText: (keywordText) => set({ keywordText }),
  setYear: (year) => set({ year }),
  setLastRefreshed: (lastRefreshed) => set({ lastRefreshed }),
}));
