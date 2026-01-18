import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: string;
  email: string;
  name: string;
  role: "free" | "pro" | "enterprise";
  credits: number;
}

interface Project {
  id: string;
  name: string;
  description: string;
}

interface AppState {
  user: User | null;
  currentProject: Project | null;
  theme: "light" | "dark" | "system";
  setUser: (user: User | null) => void;
  setCurrentProject: (project: Project | null) => void;
  setTheme: (theme: "light" | "dark" | "system") => void;
  decrementCredits: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      currentProject: null,
      theme: "system",
      setUser: (user) => set({ user }),
      setCurrentProject: (project) => set({ currentProject: project }),
      setTheme: (theme) => set({ theme }),
      decrementCredits: () =>
        set((state) => ({
          user: state.user
            ? { ...state.user, credits: Math.max(0, state.user.credits - 1) }
            : null,
        })),
    }),
    {
      name: "architex-storage",
    }
  )
);
