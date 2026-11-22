import { create } from 'zustand';
import { Month } from 'src/types';

type SelectedMonthYearState = {
  month: Month;
  year: number;
  hasMonthProcessed: boolean;
  nextMonthToProcess: Month;
  nextYearToProcess: number;
  lastSlideIndex: number;
  setMonth: (month: Month) => void;
  setYear: (year: number) => void;
  setHasMonthProcessed: (value: boolean) => void;
  setNextMonthToProcess: (month: Month) => void;
  setNextYearToProcess: (year: number) => void;
  setLastSlideIndex: (index: number) => void;
  reset: () => void;
};

const now = new Date();

export const useSelectedMonthYearStore = create<SelectedMonthYearState>((set) => ({
  month: (now.getMonth() + 1) as Month,
  year: now.getFullYear(),
  hasMonthProcessed: false,
  nextMonthToProcess: (now.getMonth() + 1) as Month,
  nextYearToProcess: now.getFullYear(),
  lastSlideIndex: 0,
  setMonth: (month) => set({ month }),
  setYear: (year) => set({ year }),
  setHasMonthProcessed: (hasMonthProcessed) => set({ hasMonthProcessed }),
  setNextMonthToProcess: (nextMonthToProcess) => set({ nextMonthToProcess }),
  setNextYearToProcess: (nextYearToProcess) => set({ nextYearToProcess }),
  setLastSlideIndex: (lastSlideIndex) => set({ lastSlideIndex }),
  reset: () => {
    const current = new Date();
    set({
      month: (current.getMonth() + 1) as Month,
      year: current.getFullYear(),
      hasMonthProcessed: false,
      nextMonthToProcess: (current.getMonth() + 1) as Month,
      nextYearToProcess: current.getFullYear(),
      lastSlideIndex: 0,
    });
  },
}));
