import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AUTH_TOKEN_KEY = 'eve-access-token';
export const REFRESH_TOKEN_KEY = 'eve-refresh-token';

export const DEFAULT_API_URL =
  process.env.EXPO_PUBLIC_API_URL || 'https://projecteve-backend.onrender.com/api';

let inMemoryAccessToken: string | null = null;
let inMemoryRefreshToken: string | null = null;
let unauthorizedCallback: (() => void) | null = null;

export function getAccessToken(): string | null {
  return inMemoryAccessToken;
}

export function getSocketBaseUrl(): string {
  return DEFAULT_API_URL.replace(/\/api\/?$/, '');
}

export function setOnUnauthorizedCallback(cb: (() => void) | null): void {
  unauthorizedCallback = cb;
}

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

const PUBLIC_AUTH_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-email',
  '/auth/logout',
];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const url: string = error?.config?.url || '';
    const isPublicAuth = PUBLIC_AUTH_PATHS.some((path) => url.includes(path));

    if (status === 401 && !isPublicAuth) {
      await clearAuthTokens();
      unauthorizedCallback?.();
    }

    return Promise.reject(error);
  }
);
