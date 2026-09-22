import React from 'react';
import { Pressable, View } from 'react-native';

import { useT } from '../i18n';
import { formatIqd, pick } from '../lib/format';
import type { ProductWithFit } from '../data/repository';
import { colors, radius } from '../theme';
import { Icon } from './Icon';
import { Badge, PhotoPlaceholder, Text } from './ui';

/** Localized condition label, matching `t.conds`. */
export function conditionLabel(condition: ProductWithFit['condition'], t: ReturnType<typeof useT>['t']): string {
  if (condition === 'used') return t.conds[2];
  if (condition === 'refurbished') return t.refurbished;
  return t.conds[1];
}

/** Two-up grid card used on Listings and the shop's product tab. */
export const ProductGridCard = React.memo(function ProductGridCard({
  product,
  onPress,
  showMeta = true,
  imageHeight = 120,
}: {
  product: ProductWithFit;
  onPress: () => void;
  /** Listings shows shop + city; the shop tab does not. */
  showMeta?: boolean;
  imageHeight?: number;
}) {
  const { t, lang, isRTL } = useT();
  const start = isRTL ? { right: 8 } : { left: 8 };
  const end = isRTL ? { left: 8 } : { right: 8 };

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        flex: 1,
        borderWidth: 1,
        borderColor: colors.borderSoft,
        backgroundColor: colors.surface,
        borderRadius: radius['3xl'],
        overflow: 'hidden',
        opacity: pressed ? 0.85 : 1,
      })}
    >
      <PhotoPlaceholder label={product.imageLabel} uri={product.imageUrls?.[0] ?? product.imageUrl} style={{ height: imageHeight, width: '100%' }} />
      <View style={{ position: 'absolute', top: 8, ...start }}>
        {product.fits ? (
          <Badge label={t.fits} icon={<Icon name="check" size={10} strokeWidth={3} />} />
        ) : (
          <Badge label={t.checkFit} background={colors.scrim} border={colors.border} />
        )}
      </View>
      <View style={{ position: 'absolute', top: imageHeight - 30, ...end }}>
        <Badge
          label={conditionLabel(product.condition, t)}
          background={colors.black}
          height={22}
        />
      </View>

      <View style={{ padding: 12, paddingTop: 10, width: '100%' }}>
        <Text size={13} weight={600} lineHeight={1.3} numberOfLines={2} style={{ minHeight: 34 }}>
          {pick(product.name, lang)}
        </Text>
        <Text size={11} color={colors.muted} monospace style={{ marginTop: 4 }}>
          OEM {product.oem}
        </Text>
        <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'baseline', gap: 5, marginTop: 8 }}>
          <Text size={15} weight={800}>
            {formatIqd(product.priceIqd)}
          </Text>
          <Text size={10} weight={600} color={colors.muted}>
            {t.iqd}
          </Text>
        </View>
        {showMeta ? (
          <View
            style={{
              flexDirection: isRTL ? 'row-reverse' : 'row',
              justifyContent: 'space-between',
              marginTop: 4,
            }}
          >
            <Text size={11} color={colors.muted}>
              {product.brand}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
});

/** Horizontal row card — image search results and the seller's product list. */
export function ProductRow({
  product,
  onPress,
  trailing,
}: {
  product: ProductWithFit;
  onPress?: () => void;
  trailing?: React.ReactNode;
}) {
  const { t, lang, row } = useT();
  const content = (
    <View
      style={{
        flexDirection: row,
        alignItems: 'center',
        gap: 12,
        padding: 10,
        borderWidth: 1,
        borderColor: colors.borderSoft,
        backgroundColor: colors.surface,
        borderRadius: radius['2xl'],
      }}
    >
      <PhotoPlaceholder uri={product.imageUrls?.[0] ?? product.imageUrl} style={{ width: 72, height: 72, borderRadius: radius.lg }} stripe={6} />
      <View style={{ flex: 1 }}>
        <Text size={13} weight={600} lineHeight={1.3} numberOfLines={2}>
          {pick(product.name, lang)}
        </Text>
        <Text size={11} color={colors.muted} monospace style={{ marginTop: 2 }}>
          OEM {product.oem}
        </Text>
        <View style={{ flexDirection: row, alignItems: 'baseline', gap: 5, marginTop: 6 }}>
          <Text size={14} weight={800}>
            {formatIqd(product.priceIqd)}
          </Text>
          <Text size={10} color={colors.muted}>
            {t.iqd}
          </Text>
        </View>
      </View>
      {trailing ?? (product.fits ? <Badge label={t.fits} /> : null)}
    </View>
  );

  return onPress ? (
    <Pressable accessibilityRole="button" onPress={onPress}>
      {content}
    </Pressable>
  ) : (
    content
  );
}
