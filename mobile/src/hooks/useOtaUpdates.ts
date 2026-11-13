import { useEffect } from 'react';
import * as Updates from 'expo-updates';
import { Platform } from 'react-native';

/**
 * Downloads a compatible EAS Update quietly after the first screen is usable.
 * The downloaded bundle is applied on the next cold launch, so a student is
 * never interrupted while filling in a form or uploading a document.
 */
export function useOtaUpdates() {
  useEffect(() => {
    if (__DEV__ || Platform.OS === 'web' || !Updates.isEnabled) return;

    const timer = setTimeout(async () => {
      try {
        const result = await Updates.checkForUpdateAsync();
        if (result.isAvailable) await Updates.fetchUpdateAsync();
      } catch {
        // The embedded bundle remains fully usable when the update service or
        // the current network is unavailable.
      }
    }, 4500);

    return () => clearTimeout(timer);
  }, []);
}
