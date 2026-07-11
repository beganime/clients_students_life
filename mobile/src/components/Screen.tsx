import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '../constants/colors';

type Props = {
  children: React.ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
  refreshing?: boolean;
  onRefresh?: () => void;
};

export function Screen({ children, scroll = false, style, refreshing = false, onRefresh }: Props) {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom + 48, 88);

  const content = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }, style]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        ) : undefined
      }
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, style]}>
      {children}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
      >
        {content}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 18,
    backgroundColor: colors.background,
  },
});
