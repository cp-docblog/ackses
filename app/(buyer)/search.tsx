import React, { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FiltersPanel } from '../../src/components/FiltersPanel';
import { Icon } from '../../src/components/Icon';
import { Row, Text } from '../../src/components/ui';
import { useT } from '../../src/i18n';
import { useStore } from '../../src/state/store';
import { colors, radius } from '../../src/theme';

/**
 * Search tab. The design routes this tab at the advanced-filter panel, so the
 * same panel renders here full-screen, above a text field and the two
 * preview-only entry points.
 */
export default function SearchTab() {
  const { t, font, isRTL } = useT();
  const insets = useSafeAreaInsets();
  const { filters, setFilters } = useStore();
  const [draft, setDraft] = useState(filters.text);

  const commit = () => setFilters((prev) => ({ ...prev, text: draft }));

  return (
    <View style={{ flex: 1, backgroundColor: colors.black, paddingTop: insets.top + 8 }}>
      <Row style={{ paddingHorizontal: 20, gap: 8 }}>
        <Row
          style={{
            flex: 1,
            height: 48,
            borderRadius: radius.xl,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: 14,
            gap: 10,
          }}
        >
          <Icon name="search" size={18} color={colors.muted} />
          <TextInput
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={() => {
              commit();
              router.push('/(buyer)');
            }}
            onBlur={commit}
            returnKeyType="search"
            placeholder={t.searchByText}
            placeholderTextColor={colors.muted}
            style={{
              flex: 1,
              color: colors.white,
              fontFamily: font(500),
              fontSize: 13,
              textAlign: isRTL ? 'right' : 'left',
              paddingVertical: 0,
            }}
          />
        </Row>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.imgTitle}
          onPress={() => router.push('/image-search')}
          style={{
            width: 48,
            height: 48,
            borderRadius: radius.xl,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="camera" size={20} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.vinTitle}
          onPress={() => router.push('/vin')}
          style={{
            width: 48,
            height: 48,
            borderRadius: radius.xl,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="vin" size={20} />
        </Pressable>
      </Row>

      <View style={{ flex: 1, marginTop: 18 }}>
        <FiltersPanel />
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/(buyer)')}
        style={{
          marginHorizontal: 20,
          marginBottom: 12,
          height: 52,
          borderRadius: radius.xl,
          backgroundColor: colors.red,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text size={14} weight={700}>
          {t.showResults}
        </Text>
      </Pressable>
    </View>
  );
}
