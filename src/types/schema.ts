import { ColumnType, GeneratedAlways } from "kysely";
import { ActivityType } from "./index";

interface AthletesTable {
  id: number;
  created_ts: GeneratedAlways<Date>;
  updated_ts: ColumnType<Date, Date, Date>;
  username: string | null;
  forename: string | null;
  surname: string | null;
  bio: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  sex: "M" | "F" | null;
  weight: number | null;
  profile: string;
  profile_medium: string;
  public: boolean;
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
  elevation_gain: number | null;
  country: string | null;
  address: string | null;
  summary_polyline: string | null;
  polyline: string | null;
}

export interface Schema {
  "activitymap.athletes": AthletesTable;
  "activitymap.activities": ActivitiesTable;
}
