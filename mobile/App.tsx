import 'react-native-gesture-handler';
import './src/i18n';

import React from 'react';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RootNavigator } from './src/navigation/RootNavigator';
import { OfflineBanner } from './src/components/OfflineBanner';
import { useAppActivity } from './src/hooks/useAppActivity';
import { useCatalogWarmup } from './src/hooks/useCatalogWarmup';
import { usePushNotifications } from './src/hooks/usePushNotifications';
import { asyncStoragePersister, QUERY_CACHE_MAX_AGE, queryClient } from './src/api/queryClient';
import { colors } from './src/constants/colors';

function AppContent() {
  useAppActivity();
  usePushNotifications();
  useCatalogWarmup();
  return (
    <>
      <OfflineBanner />
      <RootNavigator />
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister: asyncStoragePersister,
          maxAge: QUERY_CACHE_MAX_AGE,
        }}
      >
        <StatusBar style="dark" backgroundColor={colors.white} />
        <AppContent />
      </PersistQueryClientProvider>
    </SafeAreaProvider>
  );
}
