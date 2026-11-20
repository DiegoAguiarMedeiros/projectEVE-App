import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type CurrencyCode = 'BRL' | 'USD' | 'EUR';
export type NumberFormatStyle = 'dot-comma' | 'comma-dot';
export type DateFormatCode = 'DD/MM/YYYY' | 'MM/DD/YYYY';

export type CurrencyConfig = {
  code: CurrencyCode;
  symbol: string;
  locale: string;
  label: string;
};

export const currencies: CurrencyConfig[] = [
  { code: 'BRL', symbol: 'R$', locale: 'pt-BR', label: 'Real Brasileiro' },
  { code: 'USD', symbol: '$', locale: 'en-US', label: 'US Dollar' },
  { code: 'EUR', symbol: '€', locale: 'de-DE', label: 'Euro' },
];

export type DateFormatConfig = {
  code: DateFormatCode;
  label: string;
  example: string;
};

export const dateFormats: DateFormatConfig[] = [
  { code: 'DD/MM/YYYY', label: 'profile.date_format.dd_mm_yyyy', example: '31/12/2025' },
  { code: 'MM/DD/YYYY', label: 'profile.date_format.mm_dd_yyyy', example: '12/31/2025' },
];

export type NotificationPreferences = {
  enabled: boolean;
  email: boolean;
  push: boolean;
};

const CURRENCY_KEY = 'eve-currency';
const NUMBER_FORMAT_KEY = 'eve-number-format';
const DATE_FORMAT_KEY = 'eve-date-format';
const NOTIFICATIONS_KEY = 'eve-notifications';

interface PreferencesState {
  currencyCode: CurrencyCode;
  numberFormat: NumberFormatStyle;
  dateFormat: DateFormatCode;
  notifications: NotificationPreferences;
  hydrate: () => Promise<void>;
  setCurrency: (code: CurrencyCode) => void;
  setNumberFormat: (style: NumberFormatStyle) => void;
  setDateFormat: (code: DateFormatCode) => void;
  setNotifications: (prefs: NotificationPreferences) => void;
}

export const usePreferencesStore = create<PreferencesState>((set) => ({
  currencyCode: 'BRL',
  numberFormat: 'dot-comma',
  dateFormat: 'DD/MM/YYYY',
  notifications: { enabled: true, email: true, push: true },
  hydrate: async () => {
    try {
      const [curr, num, dt, notif] = await Promise.all([
        AsyncStorage.getItem(CURRENCY_KEY),
        AsyncStorage.getItem(NUMBER_FORMAT_KEY),
        AsyncStorage.getItem(DATE_FORMAT_KEY),
        AsyncStorage.getItem(NOTIFICATIONS_KEY),
      ]);
      set((state) => ({
        currencyCode: (curr as CurrencyCode) || state.currencyCode,
        numberFormat: (num as NumberFormatStyle) || state.numberFormat,
        dateFormat: (dt as DateFormatCode) || state.dateFormat,
        notifications: notif ? JSON.parse(notif) : state.notifications,
      }));
    } catch {
      // ignore
    }
  },
  setCurrency: (code) => {
    set({ currencyCode: code });
    AsyncStorage.setItem(CURRENCY_KEY, code).catch(() => {});
  },
  setNumberFormat: (style) => {
    set({ numberFormat: style });
    AsyncStorage.setItem(NUMBER_FORMAT_KEY, style).catch(() => {});
  },
  setDateFormat: (code) => {
    set({ dateFormat: code });
    AsyncStorage.setItem(DATE_FORMAT_KEY, code).catch(() => {});
  },
  setNotifications: (prefs) => {
    set({ notifications: prefs });
    AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(prefs)).catch(() => {});
  },
}));
