import { create } from "zustand";
import { UnitSystem } from "@/types";

interface UIState {
  settingsOpen: boolean;
  unitSystem: UnitSystem;
  setSettingsOpen: (open: boolean) => void;
  setUnitSystem: (unit: UnitSystem) => void;
}

export const useUIStore = create<UIState>((set) => ({
  settingsOpen: false,
  unitSystem: "metric",
  setSettingsOpen: (open) => set({ settingsOpen: open }),
  setUnitSystem: (unit) => set({ unitSystem: unit }),
}));
