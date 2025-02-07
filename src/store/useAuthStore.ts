import { create } from "zustand";
import { Athlete } from "@/types";

interface AuthState {
  isAuthenticated: boolean | null;
  athlete: Athlete | null;
  athleteLoading: boolean;
  setIsAuthenticated: (isAuthenticated: boolean | null) => void;
  setAthlete: (athlete: Athlete | null) => void;
  setAthleteLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: null,
  athlete: null,
  athleteLoading: false,
  setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  setAthlete: (athlete) => set({ athlete }),
  setAthleteLoading: (loading) => set({ athleteLoading: loading }),
}));
