import { LngLat } from "mapbox-gl";

export enum ActivityType {
  AlpineSki = "AlpineSki",
  BackcountrySki = "BackcountrySki",
  Badminton = "Badminton",
  Canoeing = "Canoeing",
  Crossfit = "Crossfit",
  EBikeRide = "EBikeRide",
  Elliptical = "Elliptical",
  EMountainBikeRide = "EMountainBikeRide",
  Golf = "Golf",
  GravelRide = "GravelRide",
  Handcycle = "Handcycle",
  HighIntensityIntervalTraining = "HighIntensityIntervalTraining",
  Hike = "Hike",
  IceSkate = "IceSkate",
  InlineSkate = "InlineSkate",
  Kayaking = "Kayaking",
  Kitesurf = "Kitesurf",
  MountainBikeRide = "MountainBikeRide",
  NordicSki = "NordicSki",
  Pickleball = "Pickleball",
  Pilates = "Pilates",
  Racquetball = "Racquetball",
  Ride = "Ride",
  RockClimbing = "RockClimbing",
  RollerSki = "RollerSki",
  Rowing = "Rowing",
  Run = "Run",
  Sail = "Sail",
  Skateboard = "Skateboard",
  Snowboard = "Snowboard",
  Snowshoe = "Snowshoe",
  Soccer = "Soccer",
  Squash = "Squash",
  StairStepper = "StairStepper",
  StandUpPaddling = "StandUpPaddling",
  Surfing = "Surfing",
  Swim = "Swim",
  TableTennis = "TableTennis",
  Tennis = "Tennis",
  TrailRun = "TrailRun",
  Velomobile = "Velomobile",
  VirtualRide = "VirtualRide",
  VirtualRow = "VirtualRow",
  VirtualRun = "VirtualRun",
  Walk = "Walk",
  WeightTraining = "WeightTraining",
  Wheelchair = "Wheelchair",
  Windsurf = "Windsurf",
  Workout = "Workout",
  Yoga = "Yoga",
}

export interface RawActivity {
  id: number;
  name: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  sport_type: ActivityType;
  start_date: string;
  average_speed: number;
  map: { summary_polyline: string };
}

export interface Activity {
  id: number;
  name: string;
  distance: number;
  movingTime: number;
  elapsedTime: number;
  totalElevationGain: number;
  averageSpeed: number;
  type: ActivityType;
  startDate: Date;
  positions: LngLat[];
}

export type Label =
  | "Walks"
  | "Runs"
  | "Rides"
  | "Snowsports"
  | "Watersports"
  | "Other";
