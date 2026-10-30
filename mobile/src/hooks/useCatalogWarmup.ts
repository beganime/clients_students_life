import { useEffect } from 'react';
import { InteractionManager } from 'react-native';
import { useIsRestoring } from '@tanstack/react-query';

import { educationCatalogApi } from '../api/educationCatalog';
import { contentApi } from '../api/endpoints';
import { queryClient } from '../api/queryClient';
import { cacheRemoteMediaBatch } from '../utils/localMediaCache';
import { readOfflineUniversities, saveOfflineUniversities } from '../utils/offlineUniversityCatalog';
import { useNetworkStatus } from './useNetworkStatus';

export const CATALOG_STALE_TIME = 24 * 60 * 60 * 1000;
export const UNIVERSITIES_CACHE_KEY = ['catalog', 'universities', 'all'] as const;

export function useCatalogWarmup() {
  const { isOnline } = useNetworkStatus();
  const isRestoring = useIsRestoring();

  useEffect(() => {
    if (isRestoring) return;

    // The dedicated public snapshot outlives the general seven-day query cache.
    void readOfflineUniversities<any>().then(snapshot => {
      if (snapshot && !queryClient.getQueryData(UNIVERSITIES_CACHE_KEY)) {
        queryClient.setQueryData(UNIVERSITIES_CACHE_KEY, snapshot.items, { updatedAt: snapshot.savedAt });
      }
    });
    if (!isOnline) return;

    // Let navigation finish first. fetchQuery deduplicates the screen request
    // and only refreshes a persisted catalog after its TTL expires.
    const task = InteractionManager.runAfterInteractions(() => {
      const universities = queryClient.fetchQuery({
        queryKey: UNIVERSITIES_CACHE_KEY,
        queryFn: () => educationCatalogApi.getAllUniversities(),
        staleTime: CATALOG_STALE_TIME,
      });
      void universities.then(items => {
        const updatedAt = queryClient.getQueryState(UNIVERSITIES_CACHE_KEY)?.dataUpdatedAt || Date.now();
        void saveOfflineUniversities(items, updatedAt).catch(() => undefined);
        const urls = items.slice(0, 48).flatMap(item => [item.logo, item.cover_image]).filter(Boolean) as string[];
        void cacheRemoteMediaBatch(urls, 'catalog').catch(() => undefined);
      }).catch(() => undefined);

      void Promise.allSettled([
        queryClient.fetchQuery({ queryKey: ['catalog', 'countries'], queryFn: () => educationCatalogApi.getCountries({ limit: 100 }), staleTime: CATALOG_STALE_TIME }),
        queryClient.fetchQuery({ queryKey: ['catalog', 'cities'], queryFn: () => educationCatalogApi.getCities({ limit: 100 }), staleTime: CATALOG_STALE_TIME }),
        queryClient.fetchQuery({ queryKey: ['catalog', 'programs', 'all'], queryFn: async () => (await educationCatalogApi.getProgramsPage({ limit: 100, ordering: 'title_asc' })).results, staleTime: CATALOG_STALE_TIME }),
        queryClient.fetchQuery({ queryKey: ['news'], queryFn: contentApi.getNews, staleTime: CATALOG_STALE_TIME }),
      ]);
    });

    return () => task.cancel();
  }, [isOnline, isRestoring]);
}
