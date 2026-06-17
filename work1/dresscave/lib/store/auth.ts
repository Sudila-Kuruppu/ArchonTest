import { createStore } from "zustand/vanilla";
import type { User } from "@supabase/supabase-js";

export type AuthStore = {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setLoading: (isLoading: boolean) => void;
  clearAuth: () => void;
};

export type AuthStoreApi = ReturnType<typeof createAuthStore>;

export const createAuthStore = () =>
  createStore<AuthStore>((set) => ({
    user: null,
    isLoading: true,

    setUser: (user) => set({ user, isLoading: false }),

    setLoading: (isLoading) => set({ isLoading }),

    clearAuth: () => set({ user: null, isLoading: false }),
  }));
