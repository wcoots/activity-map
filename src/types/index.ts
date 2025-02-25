import { LngLat, LngLatBounds } from "mapbox-gl";

export enum LocalStorageKey {
  Theme = "theme",
}

export type Theme = "light" | "dark";

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
  MotorcycleRide = "MotorcycleRide",
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

export interface RawAthelete {
  id: number;
  username: string | null;
  firstname: string | null;
  lastname: string | null;
  bio: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  sex: "M" | "F" | null;
  weight: number | null;
  profile: string;
  profile_medium: string;
  total_activity_count: number;
}

export interface Athlete {
  id: number;
  firstName: string;
  lastName: string;
  imageUrl: string;
  totalActivityCount: number;
}

export interface RawActivity {
  id: number;
  athlete: { id: number };
  name: string;
  distance: number;
  moving_time: number;
  total_elevation_gain: number;
  sport_type: ActivityType;
  start_date: string;
  timezone: string;
  average_speed: number;
  map: { summary_polyline: string };
}

export interface Activity {
  id: number;
  name: string;
  distance: number;
  movingTime: number;
  totalElevationGain: number | null;
  averageSpeed: number;
  type: ActivityType;
  startDate: Date;
  positions: LngLat[];
  bounds: LngLatBounds;
  location: Geocode | null;
}

export interface Geocode {
  country: string;
  address: string;
}

export interface GeocodedActivities {
  [activityId: number]: Geocode | null;
}

export type Label =
  | "Walks"
  | "Runs"
  | "Rides"
  | "Snowsports"
  | "Watersports"
  | "Other";
