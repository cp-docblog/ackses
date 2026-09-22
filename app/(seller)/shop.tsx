import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useComingSoon } from '../../src/components/ComingSoon';
import { Icon } from '../../src/components/Icon';
import { Badge, Chip, EmptyState, Loading, PhotoPlaceholder, Row, Text } from '../../src/components/ui';
import { useT } from '../../src/i18n';
import { formatIqd, pick } from '../../src/lib/format';
import { useShop, useShopProducts } from '../../src/hooks/queries';
import { DEMO_SHOP_ID } from '../../src/data/repository';
import { useStore } from '../../src/state/store';
import { colors, radius } from '../../src/theme';

/** S2 · My shop — product management. */
export default function SellerShop() {
  const { t, lang, row, font, isRTL } = useT();
  const insets = useSafeAreaInsets();
  const { show } = useComingSoon();
  const { vehicle } = useStore();
  const [stockChip, setStockChip] = useState(0);
  const [query, setQuery] = useState('');

  const { data: shop } = useShop(DEMO_SHOP_ID);
  const { data: products, isPending } = useShopProducts(DEMO_SHOP_ID, vehicle);

  const visible = useMemo(() => {
    const text = query.trim().toLowerCase();
    return (products ?? [])
      .filter((product) => (stockChip === 0 ? product.stock > 0 : product.stock === 0))
      .filter((product) =>
        text
          ? `${product.name.en} ${product.name.ar} ${product.oem}`.toLowerCase().includes(text)
          : true,
      );
  }, [products, stockChip, query]);

  /** In stock / low stock / out of stock pill, matching the design's colours. */
  const stockBadge = (stock: number) => {
    if (stock === 0) return { label: t.outStock, background: colors.track, border: colors.trackBorder };
    if (stock < 5) return { label: t.lowStock, background: colors.warnBg, border: colors.red };
    return { label: t.inStock, background: colors.successBg, border: colors.successBorder };
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.black, paddingTop: insets.top + 8 }}>
      <Row style={{ paddingHorizontal: 20, gap: 12 }}>
        <View
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
          <Text size={18} weight={800} color={colors.red}>
            {shop?.initial}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text size={17} weight={700} numberOfLines={1}>
            {shop ? pick(shop.name, lang) : ''}
          </Text>
          <Text size={12} color={colors.muted} style={{ marginTop: 2 }}>
            {t.open} · ★ {shop?.rating} · {shop ? pick(shop.city, lang) : ''}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => show('generic')}
          style={{
            height: 40,
            paddingHorizontal: 14,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text size={12} weight={600}>
            {t.editShop}
          </Text>
        </Pressable>
      </Row>

      <Row style={{ paddingHorizontal: 20, paddingTop: 16, gap: 8 }}>
        <Row
          style={{
            flex: 1,
            height: 44,
            borderRadius: radius.lg,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: 12,
            gap: 8,
          }}
        >
          <Icon name="search" size={16} color={colors.muted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t.searchMyProducts}
            placeholderTextColor={colors.muted}
            style={{
              flex: 1,
              color: colors.white,
              fontFamily: font(500),
              fontSize: 12,
              textAlign: isRTL ? 'right' : 'left',
              paddingVertical: 0,
            }}
          />
        </Row>
        {t.stockChips.map((label, index) => (
          <Chip
            key={label}
            label={label}
            height={44}
            selected={stockChip === index}
            onPress={() => setStockChip(index)}
            style={{ borderRadius: radius.lg }}
          />
        ))}
      </Row>

      {isPending ? <Loading /> : null}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 96, gap: 8 }}
      >
        {visible.map((product) => {
          const badge = stockBadge(product.stock);
          return (
            <Row
              key={product.id}
              style={{
                gap: 12,
                padding: 10,
                borderRadius: radius['2xl'],
                borderWidth: 1,
                borderColor: colors.borderSoft,
                backgroundColor: colors.surface,
              }}
            >
              <PhotoPlaceholder style={{ width: 64, height: 64, borderRadius: radius.lg }} stripe={6} />
              <View style={{ flex: 1 }}>
                <Text size={13} weight={600} lineHeight={1.3} numberOfLines={2}>
                  {pick(product.name, lang)}
                </Text>
                <Text size={11} color={colors.muted} monospace style={{ marginTop: 2 }}>
                  OEM {product.oem}
                </Text>
                <Row gap={10} style={{ marginTop: 6, flexWrap: 'wrap' }}>
                  <Row gap={4} style={{ alignItems: 'baseline' }}>
                    <Text size={14} weight={800}>
                      {formatIqd(product.priceIqd)}
                    </Text>
                    <Text size={10} color={colors.muted}>
                      {t.iqd}
                    </Text>
                  </Row>
                  <Badge
                    height={20}
                    label={product.stock ? `${badge.label} · ${product.stock}` : badge.label}
                    background={badge.background}
                    border={badge.border}
                  />
                </Row>
              </View>
              <View style={{ gap: 4 }}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t.edit}
                  onPress={() => router.push({ pathname: '/add-product', params: { id: product.id } })}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: radius.md,
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.black,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name="edit" size={16} />
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t.delete}
                  onPress={() => router.push({ pathname: '/delete-product', params: { id: product.id } })}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: radius.md,
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.black,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name="trash" size={16} color={colors.muted} />
                </Pressable>
              </View>
            </Row>
          );
        })}
        {!isPending && visible.length === 0 ? <EmptyState message={t.noProducts} /> : null}
      </ScrollView>

      {/* Floating add-product action. */}
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/add-product')}
        style={{
          position: 'absolute',
          bottom: insets.bottom + 72,
          [isRTL ? 'left' : 'right']: 20,
          height: 56,
          paddingHorizontal: 20,
          borderRadius: 28,
          backgroundColor: colors.red,
          flexDirection: row,
          alignItems: 'center',
          gap: 8,
          shadowColor: colors.red,
          shadowOpacity: 0.4,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 10 },
          elevation: 8,
        }}
      >
        <Icon name="plus" size={20} />
        <Text size={13} weight={700}>
          {t.addProduct}
        </Text>
      </Pressable>
    </View>
  );
}
