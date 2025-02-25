import { UnitSystem } from "@/types";

export const unitSystemConfig: {
  [key in UnitSystem]: {
    distance: string;
    elevation: string;
    speed: string;
    toggle: UnitSystem;
  };
} = {
  imperial: { distance: "mi", elevation: "ft", speed: "mph", toggle: "metric" },
  metric: { distance: "km", elevation: "m", speed: "km/h", toggle: "imperial" },
};
