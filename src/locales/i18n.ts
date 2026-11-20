import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import ptBR from './pt-BR/translation.json';
import en from './en/translation.json';
import es from './es/translation.json';

export const LANGUAGE_STORAGE_KEY = 'i18nextLng';

export const supportedLanguages = [
  { value: 'pt-BR', label: 'Português', flag: '🇧🇷' },
  { value: 'en', label: 'English', flag: '🇺🇸' },
  { value: 'es', label: 'Español', flag: '🇪🇸' },
] as const;

i18n.use(initReactI18next).init({
  compatibilityJSON: 'v4',
  resources: {
    'pt-BR': { translation: ptBR },
    pt: { translation: ptBR },
    en: { translation: en },
    es: { translation: es },
  },
  lng: 'pt-BR',
  fallbackLng: 'pt-BR',
  interpolation: {
    escapeValue: false,
  },
});

export async function loadSavedLanguage() {
  try {
    const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved && ['pt-BR', 'en', 'es'].includes(saved)) {
      await i18n.changeLanguage(saved);
    }
  } catch {
    // ignore
  }
}

export async function changeAppLanguage(lng: string) {
  await i18n.changeLanguage(lng);
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lng);
  } catch {
    // ignore
  }
}

export default i18n;
