import 'react-native-gesture-handler';
import './src/i18n';

import React from 'react';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RootNavigator } from './src/navigation/RootNavigator';
import { usePushNotifications } from './src/hooks/usePushNotifications';
import { asyncStoragePersister, queryClient } from './src/api/queryClient';

function AppContent() {
  usePushNotifications();
  return <RootNavigator />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister: asyncStoragePersister,
          maxAge: 1000 * 60 * 60 * 24,
        }}
      >
        <StatusBar style="dark" />
        <AppContent />
      </PersistQueryClientProvider>
    </SafeAreaProvider>
  );
}