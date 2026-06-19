import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { colors } from '../constants/colors';

export type SvgIconName =
  | 'home'
  | 'services'
  | 'university'
  | 'news'
  | 'profile'
  | 'application'
  | 'chat'
  | 'visa'
  | 'search'
  | 'close'
  | 'chevronLeft'
  | 'chevronRight'
  | 'phone'
  | 'mail'
  | 'mapPin'
  | 'clock'
  | 'globe'
  | 'check'
  | 'warning'
  | 'lock'
  | 'userPlus'
  | 'document'
  | 'building'
  | 'heart'
  | 'heartFilled'
  | 'star'
  | 'calendar'
  | 'language'
  | 'money'
  | 'edit'
  | 'bell'
  | 'logout'
  | 'file'
  | 'menu';

type Props = {
  name: SvgIconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
};

export function SvgIcon({
  name,
  size = 24,
  color = colors.text,
  strokeWidth = 2,
}: Props) {
  const p = {
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'home' && (
        <>
          <Path {...p} d="M3 10.8 12 3l9 7.8" />
          <Path {...p} d="M5 10v10h5v-6h4v6h5V10" />
        </>
      )}

      {name === 'services' && (
        <>
          <Circle {...p} cx="12" cy="12" r="3" />
          <Path {...p} d="M12 2v4" />
          <Path {...p} d="M12 18v4" />
          <Path {...p} d="M4.93 4.93l2.83 2.83" />
          <Path {...p} d="M16.24 16.24l2.83 2.83" />
          <Path {...p} d="M2 12h4" />
          <Path {...p} d="M18 12h4" />
          <Path {...p} d="M4.93 19.07l2.83-2.83" />
          <Path {...p} d="M16.24 7.76l2.83-2.83" />
        </>
      )}

      {name === 'university' && (
        <>
          <Path {...p} d="M3 9 12 4l9 5-9 5-9-5Z" />
          <Path {...p} d="M7 11.5V17" />
          <Path {...p} d="M17 11.5V17" />
          <Path {...p} d="M5 20h14" />
          <Path {...p} d="M8 17h8" />
        </>
      )}

      {name === 'news' && (
        <>
          <Rect {...p} x="4" y="4" width="16" height="16" rx="3" />
          <Path {...p} d="M8 8h8" />
          <Path {...p} d="M8 12h8" />
          <Path {...p} d="M8 16h5" />
        </>
      )}

      {name === 'profile' && (
        <>
          <Circle {...p} cx="12" cy="8" r="4" />
          <Path {...p} d="M4 21c1.5-4 4.2-6 8-6s6.5 2 8 6" />
        </>
      )}

      {name === 'application' && (
        <>
          <Path {...p} d="M7 3h7l4 4v14H7V3Z" />
          <Path {...p} d="M14 3v5h5" />
          <Path {...p} d="M10 13h6" />
          <Path {...p} d="M10 17h4" />
        </>
      )}

      {name === 'chat' && (
        <>
          <Path {...p} d="M5 5h14v10H8l-4 4V5Z" />
          <Path {...p} d="M8 9h8" />
          <Path {...p} d="M8 12h5" />
        </>
      )}

      {name === 'visa' && (
        <>
          <Rect {...p} x="4" y="3" width="16" height="18" rx="3" />
          <Path {...p} d="M8 8h8" />
          <Path {...p} d="M8 12h4" />
          <Path {...p} d="M8 16h8" />
          <Circle {...p} cx="16.5" cy="12" r="1.5" />
        </>
      )}

      {name === 'search' && (
        <>
          <Circle {...p} cx="11" cy="11" r="6" />
          <Path {...p} d="M16 16l4 4" />
        </>
      )}

      {name === 'close' && (
        <>
          <Path {...p} d="M6 6l12 12" />
          <Path {...p} d="M18 6 6 18" />
        </>
      )}

      {name === 'chevronLeft' && <Path {...p} d="M15 18l-6-6 6-6" />}
      {name === 'chevronRight' && <Path {...p} d="M9 18l6-6-6-6" />}

      {name === 'phone' && (
        <Path {...p} d="M7 4h3l1.5 4-2 1.2c1 2 2.3 3.3 4.3 4.3l1.2-2 4 1.5v3c0 1.1-.9 2-2 2C9.8 19 5 14.2 5 7c0-1.1.9-3 2-3Z" />
      )}

      {name === 'mail' && (
        <>
          <Rect {...p} x="3" y="5" width="18" height="14" rx="3" />
          <Path {...p} d="m4 7 8 6 8-6" />
        </>
      )}

      {name === 'mapPin' && (
        <>
          <Path {...p} d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11Z" />
          <Circle {...p} cx="12" cy="10" r="2.5" />
        </>
      )}

      {name === 'clock' && (
        <>
          <Circle {...p} cx="12" cy="12" r="9" />
          <Path {...p} d="M12 7v5l3 2" />
        </>
      )}

      {name === 'globe' && (
        <>
          <Circle {...p} cx="12" cy="12" r="9" />
          <Path {...p} d="M3 12h18" />
          <Path {...p} d="M12 3c2.4 2.5 3.6 5.5 3.6 9S14.4 18.5 12 21" />
          <Path {...p} d="M12 3c-2.4 2.5-3.6 5.5-3.6 9S9.6 18.5 12 21" />
        </>
      )}

      {name === 'check' && <Path {...p} d="M20 6 9 17l-5-5" />}

      {name === 'warning' && (
        <>
          <Path {...p} d="M12 3 2.8 20h18.4L12 3Z" />
          <Path {...p} d="M12 9v5" />
          <Path {...p} d="M12 18h.01" />
        </>
      )}

      {name === 'lock' && (
        <>
          <Rect {...p} x="5" y="10" width="14" height="10" rx="2" />
          <Path {...p} d="M8 10V7a4 4 0 0 1 8 0v3" />
        </>
      )}

      {name === 'userPlus' && (
        <>
          <Circle {...p} cx="9" cy="8" r="4" />
          <Path {...p} d="M2.5 21c1.2-4 3.4-6 6.5-6 2 0 3.7.8 5 2.3" />
          <Path {...p} d="M18 10v7" />
          <Path {...p} d="M14.5 13.5h7" />
        </>
      )}

      {name === 'document' && (
        <>
          <Path {...p} d="M6 3h8l4 4v14H6V3Z" />
          <Path {...p} d="M14 3v5h4" />
          <Path {...p} d="M9 13h6" />
          <Path {...p} d="M9 17h6" />
        </>
      )}

      {name === 'building' && (
        <>
          <Rect {...p} x="5" y="3" width="14" height="18" rx="2" />
          <Path {...p} d="M9 7h.01" />
          <Path {...p} d="M15 7h.01" />
          <Path {...p} d="M9 11h.01" />
          <Path {...p} d="M15 11h.01" />
          <Path {...p} d="M9 15h6" />
          <Path {...p} d="M10 21v-4h4v4" />
        </>
      )}

      {name === 'heart' && (
        <Path {...p} d="M20.8 5.6c-1.5-1.8-4.2-1.9-5.8-.2L12 8.5 9 5.4C7.4 3.7 4.7 3.8 3.2 5.6c-1.5 1.8-1.3 4.5.4 6.2L12 20l8.4-8.2c1.7-1.7 1.9-4.4.4-6.2Z" />
      )}

      {name === 'heartFilled' && (
        <Path
          fill={color}
          d="M20.8 5.6c-1.5-1.8-4.2-1.9-5.8-.2L12 8.5 9 5.4C7.4 3.7 4.7 3.8 3.2 5.6c-1.5 1.8-1.3 4.5.4 6.2L12 20l8.4-8.2c1.7-1.7 1.9-4.4.4-6.2Z"
        />
      )}

      {name === 'star' && (
        <Path
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.8 1-6.1-4.4-4.3 6.1-.9L12 3Z"
        />
      )}

      {name === 'calendar' && (
        <>
          <Rect {...p} x="4" y="5" width="16" height="15" rx="3" />
          <Path {...p} d="M8 3v4" />
          <Path {...p} d="M16 3v4" />
          <Path {...p} d="M4 10h16" />
        </>
      )}

      {name === 'language' && (
        <>
          <Path {...p} d="M4 5h10" />
          <Path {...p} d="M9 5c-.3 4.5-2 7.5-5 9" />
          <Path {...p} d="M6 9c1.4 2.2 3.2 3.8 5.5 5" />
          <Path {...p} d="M14 19l3-7 3 7" />
          <Path {...p} d="M15.2 16h3.6" />
        </>
      )}

      {name === 'money' && (
        <>
          <Rect {...p} x="3" y="6" width="18" height="12" rx="3" />
          <Circle {...p} cx="12" cy="12" r="3" />
          <Path {...p} d="M6 9h.01" />
          <Path {...p} d="M18 15h.01" />
        </>
      )}

      {name === 'edit' && (
        <>
          <Path {...p} d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Z" />
          <Path {...p} d="M14 7l3 3" />
        </>
      )}

      {name === 'bell' && (
        <>
          <Path {...p} d="M18 9a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" />
          <Path {...p} d="M10 21h4" />
        </>
      )}

      {name === 'logout' && (
        <>
          <Path {...p} d="M10 17l5-5-5-5" />
          <Path {...p} d="M15 12H3" />
          <Path {...p} d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
        </>
      )}

      {name === 'file' && (
        <>
          <Path {...p} d="M7 3h7l4 4v14H7V3Z" />
          <Path {...p} d="M14 3v5h4" />
        </>
      )}

      {name === 'menu' && (
        <>
          <Path {...p} d="M4 7h16" />
          <Path {...p} d="M4 12h16" />
          <Path {...p} d="M4 17h16" />
        </>
      )}
    </Svg>
  );
}
