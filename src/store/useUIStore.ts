import { create } from "zustand";
import { UnitSystem } from "@/types";

interface UIState {
  settingsOpen: boolean;
  shareModalOpen: boolean;
  unitSystem: UnitSystem;
  setSettingsOpen: (open: boolean) => void;
  setShareModalOpen: (open: boolean) => void;
  setUnitSystem: (unit: UnitSystem) => void;
}

export const useUIStore = create<UIState>((set) => ({
  settingsOpen: false,
  shareModalOpen: false,
  unitSystem: "metric",
  setSettingsOpen: (open) => set({ settingsOpen: open }),
  setShareModalOpen: (open) => set({ shareModalOpen: open }),
  setUnitSystem: (unit) => set({ unitSystem: unit }),
}));
