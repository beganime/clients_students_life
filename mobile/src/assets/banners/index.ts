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

export const bannerImages: Record<BannerImageKey, ImageSourcePropType> = {
  home: require('./hero-home.png'),
  services: require('./hero-services.png'),
  universities: require('./hero-universities.png'),
  country: require('./hero-country.jpg'),
  city: require('./hero-city.jpg'),
  university: require('./hero-university.jpg'),
  program: require('./hero-program.webp'),
  application: require('./hero-application.jpg'),
  visa: require('./hero-visa.png'),
  tours: require('./hero-tours.jpg'),
  admission: require('./hero-admission.png'),
  settings: require('./hero-settings.webp'),
  profile: require('./hero-profile.webp'),
};
