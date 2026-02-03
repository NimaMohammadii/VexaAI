import { create } from "zustand";
import type { StudioLayout } from "@/lib/layout";

type LayoutState = {
  layout: StudioLayout | null;
  setLayout: (layout: StudioLayout) => void;
};

export const useLayoutStore = create<LayoutState>((set) => ({
  layout: null,
  setLayout: (layout) => set({ layout })
}));
