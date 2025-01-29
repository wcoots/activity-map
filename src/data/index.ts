import { ActivityType, Label } from "@/types";

export const activityTypeConfig: {
  label: Label;
  activityTypes: ActivityType[];
  colour: string;
}[] = [
  {
    label: "Walks",
    activityTypes: [ActivityType.Hike, ActivityType.Walk],
    colour: "#e08906",
  },
  {
    label: "Runs",
    activityTypes: [ActivityType.Run, ActivityType.TrailRun],
    colour: "#da1e28",
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
    colour: "#3cb043",
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
    colour: "#bf40bf",
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
    colour: "#00a1e4",
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
    colour: "#bbbbbb",
  },
];
