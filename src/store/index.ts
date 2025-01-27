import { activityTypeConfig } from "@/data";
import { Activity, Label } from "@/types";
import { create } from "zustand";

interface State {
  activities: Activity[];
  selectedActivity: Activity | null;
  activityTypeSettings: Record<Label, boolean>;
  activityTypeColourSettings: Record<Label, string>;
  minimumDistance: number;
  maximumDistance: number;
  highestDistance: number;
  keywordText: string;
  year: number | null;
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
}

export const useStore = create<State>((set) => ({
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
}));
