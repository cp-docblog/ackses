import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PreviewBanner, useComingSoon } from '../src/components/ComingSoon';
import { ScreenHeader } from '../src/components/chrome';
import { ProductRow } from '../src/components/ProductCard';
import { PhotoPlaceholder, Row, Text } from '../src/components/ui';
import { useT } from '../src/i18n';
import { useProducts } from '../src/hooks/queries';
import { useStore } from '../src/state/store';
import { defaultFilters } from '../src/data/types';
import { colors, radius } from '../src/theme';

/**
 * 02c · Search by image.
 *
 * Preview only: matching a photo to a part needs a model we have not wired up.
 * The viewfinder, detection read-out and result list all render, and every
 * control opens the Coming Soon dialog. The rows below the viewfinder show
 * real catalogue entries so the layout can be judged against live data.
 */
export default function ImageSearch() {
  const { t } = useT();
  const insets = useSafeAreaInsets();
  const { show } = useComingSoon();
  const { vehicle } = useStore();

  // Stand-in results: brake parts, matching the "Brake disc" detection label.
  const { data: results } = useProducts(
    { ...defaultFilters, categoryIndex: 0, vehicle },
    null,
  );

  const notYet = () =>
    show('image', {
      secondaryLabel: t.searchByText,
      onSecondary: () => router.replace('/(buyer)/search'),
    });

  return (
    <View style={{ flex: 1, backgroundColor: colors.black, paddingTop: insets.top + 8 }}>
      <ScreenHeader title={t.imgTitle} onBack={() => router.back()} />
      <PreviewBanner label={`${t.comingSoonBadge} · ${t.imgTitle}`} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Viewfinder */}
        <Pressable onPress={notYet}>
          <PhotoPlaceholder
            label="camera viewfinder"
            stripe={8}
            style={{ marginHorizontal: 20, marginTop: 16, height: 300, borderRadius: radius.card + 4 }}
          />
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 16 + 36,
              bottom: 36,
              left: 20 + 36,
              right: 20 + 36,
              borderWidth: 2,
              borderColor: 'rgba(255,255,255,.35)',
              borderRadius: radius['2xl'],
            }}
          />
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 16 + 36,
              left: 20 + 36,
              width: 28,
              height: 28,
              borderTopWidth: 3,
              borderLeftWidth: 3,
              borderColor: colors.red,
              borderTopStartRadius: 14,
            }}
          />
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              bottom: 36,
              right: 20 + 36,
              width: 28,
              height: 28,
              borderBottomWidth: 3,
              borderRightWidth: 3,
              borderColor: colors.red,
              borderBottomEndRadius: 14,
            }}
          />
          {/* Shutter */}
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              bottom: 14,
              alignSelf: 'center',
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: colors.white,
              borderWidth: 5,
              borderColor: colors.border,
            }}
          />
        </Pressable>

        <Row style={{ marginHorizontal: 20, marginTop: 18, gap: 10 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.red }} />
          <Text size={13} color={colors.muted}>
            {t.detected}
          </Text>
          <Text size={13} weight={700}>
            {t.detectedPart} · 94%
          </Text>
        </Row>

        <View style={{ paddingHorizontal: 20, paddingTop: 14, gap: 10 }}>
          {results?.map((product) => (
            <ProductRow key={product.id} product={product} onPress={notYet} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
