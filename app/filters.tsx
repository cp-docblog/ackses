import React from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FiltersPanel } from '../src/components/FiltersPanel';
import { SheetSurface } from '../src/components/chrome';
import { colors } from '../src/theme';

/** 02b · Filters presented as a bottom sheet over the listings. */
export default function FiltersSheet() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,.6)' }}>
      {/* Tapping the dimmed area above the sheet dismisses it. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close"
        style={{ height: insets.top + 60 }}
        onPress={() => router.back()}
      />
      <SheetSurface fill style={{ backgroundColor: colors.surface }}>
        <FiltersPanel onClose={() => router.back()} />
      </SheetSurface>
    </View>
  );
}
