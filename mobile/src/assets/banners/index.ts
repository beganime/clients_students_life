import type { ImageSourcePropType } from 'react-native';

export type BannerImageKey =
  | 'home'
  | 'services'
  | 'universities'
  | 'country'
  | 'city'
  | 'university'
  | 'program'
  | 'application'
  | 'visa'
  | 'tours'
  | 'admission'
  | 'settings'
  | 'profile';

// Replace `undefined` with `require('./hero-*.webp')` after final compressed photos are added.
export const bannerImages: Record<BannerImageKey, ImageSourcePropType | undefined> = {
  home: undefined,
  services: undefined,
  universities: undefined,
  country: undefined,
  city: undefined,
  university: undefined,
  program: undefined,
  application: undefined,
  visa: undefined,
  tours: undefined,
  admission: undefined,
  settings: undefined,
  profile: undefined,
};
