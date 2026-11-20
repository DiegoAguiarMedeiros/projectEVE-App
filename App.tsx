import React, { useEffect, useState } from 'react';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import 'src/locales/i18n';
import { loadSavedLanguage } from 'src/locales/i18n';
import { ThemeProvider, useAppTheme } from 'src/theme';
import { ToastProvider } from 'src/components/Toast';
import { RootNavigator } from 'src/navigation/RootNavigator';
import { initAuthTokens } from 'src/api/client';
import { usePreferencesStore } from 'src/store/usePreferencesStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10000,
      retry: 1,
    },
  },
});

const AppShell: React.FC = () => {
  const { isDark, colors } = useAppTheme();
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background.paper }}
      edges={['top', 'left', 'right']}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <RootNavigator />
    </SafeAreaView>
  );
};

export default function App() {
  const [ready, setReady] = useState(false);
  const hydratePrefs = usePreferencesStore((s) => s.hydrate);

  useEffect(() => {
    Promise.all([initAuthTokens(), loadSavedLanguage(), hydratePrefs()])
      .finally(() => setReady(true));
  }, [hydratePrefs]);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <ToastProvider>
            <AppShell />
          </ToastProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
