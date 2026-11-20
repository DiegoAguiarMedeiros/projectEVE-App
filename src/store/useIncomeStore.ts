import { create } from 'zustand';

type IncomeState = {
  income: number;
  setIncome: (value: number) => void;
};

export const useIncomeStore = create<IncomeState>((set) => ({
  income: 0,
  setIncome: (value) => set({ income: value }),
}));
