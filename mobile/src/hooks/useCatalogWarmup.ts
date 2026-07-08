import { useEffect } from 'react';

import { educationCatalogApi } from '../api/educationCatalog';
import { queryClient } from '../api/queryClient';
import { cacheRemoteMediaBatch } from '../utils/localMediaCache';
import { useNetworkStatus } from './useNetworkStatus';

const WARMUP_KEY = ['catalog', 'warmup'];
let warmupStarted = false;

export function useCatalogWarmup() {
  const { isOnline } = useNetworkStatus();

  useEffect(() => {
    if (!isOnline || warmupStarted) return;
    warmupStarted = true;

    let cancelled = false;

    async function warmup() {
      try {
        const [countries, cities, universities, programs] = await Promise.all([
          educationCatalogApi.getCountries({ limit: 100 }),
          educationCatalogApi.getCities({ limit: 100 }),
          educationCatalogApi.getAllUniversities(),
          educationCatalogApi.getAllPrograms(),
        ]);

        if (cancelled) return;

        queryClient.setQueryData(['catalog', 'countries'], countries);
        queryClient.setQueryData(['catalog', 'cities'], cities);
        queryClient.setQueryData(['catalog', 'universities', 'all'], universities);
        queryClient.setQueryData(['catalog', 'programs', 'all'], programs);
        queryClient.setQueryData(WARMUP_KEY, { warmed_at: new Date().toISOString() });

        const imageUrls = [
          ...countries.flatMap((item: any) => [item.flag, item.cover_image]),
          ...cities.flatMap((item: any) => [item.image, item.cover_image]),
          ...universities.flatMap((item: any) => [item.logo, item.cover_image]),
          ...programs.flatMap((item: any) => [item.university_logo, item.university_cover]),
        ].filter(Boolean) as string[];

        await cacheRemoteMediaBatch(imageUrls.slice(0, 320), 'catalog');
      } catch {
        warmupStarted = false;
      }
    }

    warmup();

    return () => {
      cancelled = true;
    };
  }, [isOnline]);
}
