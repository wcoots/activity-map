import { ColumnType, GeneratedAlways } from "kysely";
import { ActivityType } from "./index";

interface AthletesTable {
  id: number;
  created_ts: GeneratedAlways<Date>;
  updated_ts: ColumnType<Date, Date, Date>;
  username: string;
  forename: string;
  surname: string;
  bio: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  sex: "M" | "F";
  weight: number | null;
  profile: string;
  profile_medium: string;
}

interface ActivitiesTable {
  id: number;
  athlete_id: number;
  created_ts: GeneratedAlways<Date>;
  updated_ts: ColumnType<Date, Date, Date>;
  activity_ts: ColumnType<Date, Date, Date>;
  timezone: string;
  type: ActivityType;
  name: string;
  distance: number;
  moving_time: number;
  average_speed: number;
  elevation_gain: number;
  country: string | null;
  address: string | null;
  polyline: string | null;
}

export interface Schema {
  "activitymap.athletes": AthletesTable;
  "activitymap.activities": ActivitiesTable;
}
