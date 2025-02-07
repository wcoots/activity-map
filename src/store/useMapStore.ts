import { create } from "zustand";
import { Theme } from "@/types";

interface MapState {
  mapLoading: boolean;
  theme: Theme;
  setMapLoading: (loading: boolean) => void;
  setTheme: (theme: Theme) => void;
}

export const useMapStore = create<MapState>((set) => ({
  mapLoading: true,
  theme: "dark",
  setMapLoading: (loading) => set({ mapLoading: loading }),
  setTheme: (theme) => set({ theme }),
}));
