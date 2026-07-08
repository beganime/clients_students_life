import { useEffect, useState } from 'react';

import { cacheRemoteMedia, getCachedMediaUri } from '../utils/localMediaCache';

export function useCachedMediaUri(uri?: string | null) {
  const [cachedUri, setCachedUri] = useState<string | null>(uri || null);

  useEffect(() => {
    let active = true;

    if (!uri) {
      setCachedUri(null);
      return () => {
        active = false;
      };
    }

    setCachedUri(uri);
    getCachedMediaUri(uri)
      .then(existing => {
        if (active && existing) setCachedUri(existing);
      })
      .catch(() => undefined);

    cacheRemoteMedia(uri, 'media')
      .then(nextUri => {
        if (active && nextUri) setCachedUri(nextUri);
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [uri]);

  return cachedUri;
}

