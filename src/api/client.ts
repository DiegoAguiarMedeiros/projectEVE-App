import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AUTH_TOKEN_KEY = 'eve-access-token';
export const REFRESH_TOKEN_KEY = 'eve-refresh-token';

const DEFAULT_API_URL =
  process.env.EXPO_PUBLIC_API_URL || 'https://projecteve-backend.onrender.com/api';

let inMemoryAccessToken: string | null = null;
let inMemoryRefreshToken: string | null = null;

export async function initAuthTokens(): Promise<void> {
  try {
    const [access, refresh] = await Promise.all([
      AsyncStorage.getItem(AUTH_TOKEN_KEY),
      AsyncStorage.getItem(REFRESH_TOKEN_KEY),
    ]);
    inMemoryAccessToken = access;
    inMemoryRefreshToken = refresh;
  } catch {
    // ignore
  }
}

export async function saveAuthTokens(accessToken?: string, refreshToken?: string): Promise<void> {
  if (accessToken) {
    inMemoryAccessToken = accessToken;
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, accessToken).catch(() => {});
  }
  if (refreshToken) {
    inMemoryRefreshToken = refreshToken;
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken).catch(() => {});
  }
}

export async function clearAuthTokens(): Promise<void> {
  inMemoryAccessToken = null;
  inMemoryRefreshToken = null;
  await Promise.all([
    AsyncStorage.removeItem(AUTH_TOKEN_KEY),
    AsyncStorage.removeItem(REFRESH_TOKEN_KEY),
  ]).catch(() => {});
}

export const api = axios.create({
  baseURL: DEFAULT_API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config) => {
  if (!inMemoryAccessToken) {
    inMemoryAccessToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY).catch(() => null);
  }
  if (inMemoryAccessToken) {
    config.headers.Authorization = `Bearer ${inMemoryAccessToken}`;
  }
  return config;
});
