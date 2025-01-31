import { activityTypeConfig } from "@/data";
import { Athlete, Activity, Label } from "@/types";
import { create } from "zustand";

interface State {
  athlete: Athlete | null;
  activities: Activity[];
  selectedActivity: Activity | null;
  activityTypeSettings: Record<Label, boolean>;
  activityTypeColourSettings: Record<Label, string>;
  minimumDistance: number;
  maximumDistance: number;
  highestDistance: number;
  keywordText: string;
  year: number | null;
  lastRefreshed: Date | null;
  setAthlete: (athlete: Athlete | null) => void;
  setActivities: (activities: Activity[]) => void;
  setSelectedActivity: (activity: Activity | null) => void;
  setActivityTypeSettings: (
    activityTypeSettings: Record<Label, boolean>
  ) => void;
  setActivityTypeColourSettings: (
    activityTypeColourSettings: Record<Label, string>
  ) => void;
  setMinimumDistance: (minimumDistance: number) => void;
  setMaximumDistance: (maximumDistance: number) => void;
  setHighestDistance: (highestDistance: number) => void;
  setKeywordText: (keywordText: string) => void;
  setYear: (year: number | null) => void;
  setLastRefreshed: (lastRefreshed: Date) => void;
}

export const useStore = create<State>((set) => ({
  athlete: null,
  activities: [],
  selectedActivity: null,
  activityTypeSettings: activityTypeConfig.reduce(
    (acc, config) => ({ ...acc, [config.label]: true }),
    {} as Record<Label, boolean>
  ),
  activityTypeColourSettings: activityTypeConfig.reduce(
    (acc, config) => ({ ...acc, [config.label]: config.colour }),
    {} as Record<Label, string>
  ),
  minimumDistance: 0,
  maximumDistance: 100,
  highestDistance: 100,
  keywordText: "",
  year: null,
  lastRefreshed: null,
  setAthlete: (athlete) => set({ athlete }),
  setActivities: (activities) => set({ activities }),
  setSelectedActivity: (selectedActivity) => set({ selectedActivity }),
  setActivityTypeSettings: (activityTypeSettings) =>
    set({ activityTypeSettings }),
  setActivityTypeColourSettings: (activityTypeColourSettings) =>
    set({ activityTypeColourSettings }),
  setMinimumDistance: (minimumDistance) => set({ minimumDistance }),
  setMaximumDistance: (maximumDistance) => set({ maximumDistance }),
  setHighestDistance: (highestDistance) => set({ highestDistance }),
  setKeywordText: (keywordText) => set({ keywordText }),
  setYear: (year) => set({ year }),
  setLastRefreshed: (lastRefreshed) => set({ lastRefreshed }),
}));
