import { create } from "zustand";
import { LoadingText } from "@/types";

interface UIState {
  settingsOpen: boolean;
  loadingText: LoadingText;
  setSettingsOpen: (open: boolean) => void;
  setLoadingText: (text: LoadingText) => void;
}

export const useUIStore = create<UIState>((set) => ({
  settingsOpen: false,
  loadingText: LoadingText.STRAVA,
  setSettingsOpen: (open) => set({ settingsOpen: open }),
  setLoadingText: (text) => set({ loadingText: text }),
}));
