import { ActivityType, Label, Theme } from "@/types";
import { MappingAlgorithm, theme as themes } from "antd";

export const activityTypeConfig: {
  label: Label;
  activityTypes: ActivityType[];
  colour: { [key in Theme]: string };
}[] = [
  {
    label: "Walks",
    activityTypes: [ActivityType.Hike, ActivityType.Walk],
    colour: { dark: "#e08906", light: "#cc5500" },
  },
  {
    label: "Runs",
    activityTypes: [ActivityType.Run, ActivityType.TrailRun],
    colour: { dark: "#da1e28", light: "#a71b22" },
  },
  {
    label: "Rides",
    activityTypes: [
      ActivityType.EBikeRide,
      ActivityType.EMountainBikeRide,
      ActivityType.GravelRide,
      ActivityType.Handcycle,
      ActivityType.MountainBikeRide,
      ActivityType.Ride,
      ActivityType.RollerSki,
      ActivityType.Skateboard,
      ActivityType.Velomobile,
      ActivityType.Wheelchair,
    ],
    colour: { dark: "#3cb043", light: "#2a7c30" },
  },
  {
    label: "Snowsports",
    activityTypes: [
      ActivityType.AlpineSki,
      ActivityType.BackcountrySki,
      ActivityType.IceSkate,
      ActivityType.InlineSkate,
      ActivityType.NordicSki,
      ActivityType.Snowboard,
      ActivityType.Snowshoe,
    ],
    colour: { dark: "#bf40bf", light: "#8c308c" },
  },
  {
    label: "Watersports",
    activityTypes: [
      ActivityType.Canoeing,
      ActivityType.Kayaking,
      ActivityType.Kitesurf,
      ActivityType.Rowing,
      ActivityType.Sail,
      ActivityType.StandUpPaddling,
      ActivityType.Surfing,
      ActivityType.Swim,
      ActivityType.Windsurf,
    ],
    colour: { dark: "#00a1e4", light: "#0077ab" },
  },
  {
    label: "Other",
    activityTypes: [
      ActivityType.Badminton,
      ActivityType.Crossfit,
      ActivityType.Elliptical,
      ActivityType.Golf,
      ActivityType.HighIntensityIntervalTraining,
      ActivityType.Pickleball,
      ActivityType.Pilates,
      ActivityType.Racquetball,
      ActivityType.RockClimbing,
      ActivityType.Soccer,
      ActivityType.Squash,
      ActivityType.StairStepper,
      ActivityType.TableTennis,
      ActivityType.Tennis,
      ActivityType.VirtualRide,
      ActivityType.VirtualRow,
      ActivityType.VirtualRun,
      ActivityType.WeightTraining,
      ActivityType.Workout,
      ActivityType.Yoga,
    ],
    colour: { dark: "#bbbbbb", light: "#888888" },
  },
];

export const themeConfig: {
  [key in Theme]: {
    style: string;
    borderColour: string;
    toggle: Theme;
    algorithm: MappingAlgorithm;
    primaryColour: string;
  };
} = {
  light: {
    style: "mapbox://styles/mapbox/light-v11",
    borderColour: "black",
    toggle: "dark",
    algorithm: themes.defaultAlgorithm,
    primaryColour: "#4A6691",
  },
  dark: {
    style: "mapbox://styles/mapbox/dark-v11",
    borderColour: "white",
    toggle: "light",
    algorithm: themes.darkAlgorithm,
    primaryColour: "#6082B6",
  },
};
