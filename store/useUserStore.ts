import { create } from "zustand";

export type UserProfile = {
  id: string;
  email: string;
  credits: number;
  role: "USER" | "ADMIN";
};

type UserState = {
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
};

export const useUserStore = create<UserState>((set) => ({
  user: null,
  setUser: (user) => set({ user })
}));
