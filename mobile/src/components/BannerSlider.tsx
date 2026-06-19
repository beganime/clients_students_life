import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';

import { colors } from '../constants/colors';
import { SvgIcon } from './SvgIcon';

const { width } = Dimensions.get('window');

type Props<T> = {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactElement;
  itemWidth?: number;
  autoplay?: boolean;
  intervalMs?: number;
  itemSpacing?: number;
  style?: ViewStyle;
  showArrows?: boolean;
};

export function BannerSlider<T>({
  data,
  renderItem,
  itemWidth = Math.min(width - 40, 760),
  autoplay = true,
  intervalMs = 4500,
  itemSpacing = 14,
  style,
  showArrows = false,
}: Props<T>) {
  const ref = useRef<FlatList<T>>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const safeData = data.slice(0, 3);
  const canSlide = safeData.length > 1;

  useEffect(() => {
    if (!autoplay || !canSlide) return;

    const timer = setInterval(() => {
      setActiveIndex(prev => {
        const next = prev + 1 >= safeData.length ? 0 : prev + 1;

        ref.current?.scrollToIndex({
          index: next,
          animated: true,
        });

        return next;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [autoplay, canSlide, intervalMs, safeData.length]);

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / (itemWidth + itemSpacing));
    setActiveIndex(Math.max(0, Math.min(index, safeData.length - 1)));
  };

  const goTo = (index: number) => {
    if (!safeData.length) return;

    const normalizedIndex =
      index < 0 ? safeData.length - 1 : index >= safeData.length ? 0 : index;

    ref.current?.scrollToIndex({
      index: normalizedIndex,
      animated: true,
    });

    setActiveIndex(normalizedIndex);
  };

  if (!safeData.length) return null;

  return (
    <View style={[styles.wrapper, style]}>
      <FlatList
        ref={ref}
        horizontal
        pagingEnabled
        data={safeData}
        keyExtractor={(_, index) => String(index)}
        showsHorizontalScrollIndicator={false}
        snapToInterval={itemWidth + itemSpacing}
        decelerationRate="fast"
        onMomentumScrollEnd={handleScrollEnd}
        getItemLayout={(_, index) => ({
          length: itemWidth + itemSpacing,
          offset: (itemWidth + itemSpacing) * index,
          index,
        })}
        renderItem={({ item, index }) => (
          <View style={{ width: itemWidth + itemSpacing, paddingRight: itemSpacing }}>
            {renderItem(item, index)}
          </View>
        )}
      />

      {canSlide ? (
        <>
          {showArrows ? (
            <>
              <Pressable
                style={[styles.arrow, styles.arrowLeft]}
                onPress={() => goTo(activeIndex - 1)}
                accessibilityRole="button"
                accessibilityLabel="Предыдущий баннер"
              >
                <SvgIcon name="chevronLeft" size={20} color={colors.text} />
              </Pressable>

              <Pressable
                style={[styles.arrow, styles.arrowRight]}
                onPress={() => goTo(activeIndex + 1)}
                accessibilityRole="button"
                accessibilityLabel="Следующий баннер"
              >
                <SvgIcon name="chevronRight" size={20} color={colors.text} />
              </Pressable>
            </>
          ) : null}

          <View style={styles.dots}>
            {safeData.map((_, index) => (
              <Pressable key={index} onPress={() => goTo(index)}>
                <View style={[styles.dot, activeIndex === index && styles.dotActive]} />
              </Pressable>
            ))}
          </View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  arrow: {
    position: 'absolute',
    top: '43%',
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.86)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.95)',
    shadowColor: '#101828',
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 7 },
    elevation: 5,
  },
  arrowLeft: {
    left: 10,
  },
  arrowRight: {
    right: 10,
  },
  dots: {
    marginTop: 12,
    marginBottom: 22,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 7,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(102,112,133,0.28)',
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.primary,
  },
});
