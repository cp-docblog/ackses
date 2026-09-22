import React, { useState } from 'react';
import { Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, VerifiedMark } from '../../src/components/Icon';
import { BackChevron, RoundButton } from '../../src/components/chrome';
import { conditionLabel } from '../../src/components/ProductCard';
import {
  Badge,
  Button,
  EmptyState,
  Loading,
  PhotoPlaceholder,
  Row,
  SectionLabel,
  Text,
} from '../../src/components/ui';
import { useT } from '../../src/i18n';
import { formatIqd, pick, vehicleLabel } from '../../src/lib/format';
import { Card } from '../../src/components/ui';
import { useProduct, useSeller, useShop } from '../../src/hooks/queries';
import { useStore } from '../../src/state/store';
import { SELLER } from '../../src/data/fixtures';
import { colors, radius } from '../../src/theme';

/** 03 · Product detail. */
export default function ProductDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, lang, row, isRTL } = useT();
  const insets = useSafeAreaInsets();
  const { vehicle, addToCart, cart } = useStore();
  const [justAdded, setJustAdded] = useState(false);
  const [page, setPage] = useState(0);
  const { width } = useWindowDimensions();

  const { data: product, isPending, isError } = useProduct(id ?? '', vehicle);
  const { data: shop } = useShop(product?.shopId ?? '');
  const { data: seller } = useSeller(shop?.sellerId ?? SELLER.id);

  if (isPending) return <Loading />;
  if (isError || !product) return <EmptyState message={t.loadFailed} />;

  const inCart = cart[product.id] ?? 0;

  const outOfStock = product.stock <= 0;
  const add = () => {
    if (outOfStock) return;
    addToCart(product.id);
    setJustAdded(true);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.black }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Gallery — swipe through the listing's photos */}
        <View>
          {product.imageUrls && product.imageUrls.length > 0 ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
            >
              {product.imageUrls.map((uri) => (
                <PhotoPlaceholder key={uri} uri={uri} stripe={10} style={{ height: 340, width }} />
              ))}
            </ScrollView>
          ) : (
            <PhotoPlaceholder
              label={`product photo · ${product.imageLabel}`}
              stripe={10}
              style={{ height: 340, width: '100%' }}
            />
          )}
          <RoundButton
            label={t.back}
            background={colors.scrim}
            onPress={() => router.back()}
            style={{ position: 'absolute', top: insets.top + 8, [isRTL ? 'right' : 'left']: 16 }}
          >
            <BackChevron />
          </RoundButton>
          <Row style={{ position: 'absolute', bottom: 14, alignSelf: 'center', gap: 6 }}>
            {(product.imageUrls?.length ? product.imageUrls : [0, 1, 2]).map((_, i) => (
              <View key={i} style={{ width: i === page ? 18 : 6, height: 6, borderRadius: 3, backgroundColor: i === page ? colors.red : '#555' }} />
            ))}
          </Row>
        </View>

        <View style={{ paddingHorizontal: 20, paddingTop: 18 }}>
          <Row gap={8} style={{ flexWrap: 'wrap' }}>
            {product.fits ? (
              <Badge
                height={26}
                label={`${t.fitsYour} ${vehicleLabel(vehicle)}`}
                icon={<Icon name="check" size={11} strokeWidth={4} />}
              />
            ) : (
              <Badge
                height={26}
                label={`${t.checkFit} · ${vehicleLabel(vehicle)}`}
                background={colors.surface}
                border={colors.border}
              />
            )}
            <Badge
              height={26}
              label={conditionLabel(product.condition, t)}
              background={colors.surface}
              border={colors.border}
            />
          </Row>

          <Text size={20} weight={700} lineHeight={1.25} style={{ marginTop: 12 }}>
            {pick(product.name, lang)}
          </Text>

          <Row gap={14} style={{ marginTop: 8, flexWrap: 'wrap' }}>
            <Text size={12} color={colors.muted} monospace>
              OEM {product.oem}
            </Text>
            <Text size={12} color={colors.muted}>
              {product.brand}
            </Text>
            <Text size={12} color={colors.muted}>
              {t.stock}: {product.stock}
            </Text>
          </Row>

          <Row style={{ marginTop: 14, gap: 6, alignItems: 'baseline' }}>
            <Text size={28} weight={800}>
              {formatIqd(product.priceIqd)}
            </Text>
            <Text size={12} weight={600} color={colors.muted}>
              {t.iqd}
            </Text>
            <Text size={12} color={colors.muted} style={{ flex: 1 }} align="end">
              {t.delivery} 2–3 {t.days} · {t.cod}
            </Text>
          </Row>

          {/* Shop */}
          {shop ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push(`/shop/${shop.id}`)}
              style={{
                marginTop: 18,
                padding: 12,
                paddingHorizontal: 14,
                borderRadius: radius['2xl'],
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.surface,
                flexDirection: row,
                alignItems: 'center',
                gap: 12,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: radius.lg,
                  backgroundColor: colors.black,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text size={14} weight={800} color={colors.red}>
                  {shop.initial}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Row gap={6}>
                  <Text size={14} weight={700} numberOfLines={1} style={{ flexShrink: 1 }}>
                    {pick(shop.name, lang)}
                  </Text>
                  {shop.verified ? <VerifiedMark size={14} /> : null}
                </Row>
                <Text size={12} color={colors.muted} style={{ marginTop: 2 }}>
                  ★ {shop.rating} · {pick(shop.city, lang)} · {t.respRate} {shop.responseRate}%
                </Text>
              </View>
              <Text size={16} color={colors.muted}>
                {isRTL ? '‹' : '›'}
              </Text>
            </Pressable>
          ) : null}

          {/* Seller */}
          {seller ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push(`/seller/${seller.id}`)}
              style={{
                marginTop: 8,
                height: 48,
                paddingHorizontal: 14,
                borderRadius: radius.xl,
                borderWidth: 1,
                borderColor: colors.borderSoft,
                flexDirection: row,
                alignItems: 'center',
                gap: 10,
              }}
            >
              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.border }} />
              <Text size={13} color={colors.muted}>
                {t.soldBy}
              </Text>
              <Text size={13} weight={600} style={{ flex: 1 }}>
                {pick(seller.name, lang)}
              </Text>
              <Text size={16} color={colors.muted}>
                {isRTL ? '‹' : '›'}
              </Text>
            </Pressable>
          ) : null}

          {/* Specs */}
          <SectionLabel style={{ marginTop: 22 }}>{t.specs}</SectionLabel>
          <View
            style={{
              marginTop: 8,
              borderWidth: 1,
              borderColor: colors.borderSoft,
              borderRadius: radius.xl,
              overflow: 'hidden',
            }}
          >
            {product.specs.map((spec, index) => (
              <Row
                key={`${spec.key.en}-${index}`}
                style={{
                  justifyContent: 'space-between',
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  borderTopWidth: index === 0 ? 0 : 1,
                  borderTopColor: colors.hairline,
                  gap: 12,
                }}
              >
                <Text size={13} color={colors.muted}>
                  {pick(spec.key, lang)}
                </Text>
                <Text size={13} weight={600}>
                  {pick(spec.value, lang)}
                </Text>
              </Row>
            ))}
          </View>

          {product.bulkTiers && product.bulkTiers.length > 0 ? (
            <>
              <SectionLabel style={{ marginTop: 22 }}>{t.bulk.replace(' (OPTIONAL)', '').replace(' (اختياري)', '')}</SectionLabel>
              <View style={{ marginTop: 8, borderWidth: 1, borderColor: colors.borderSoft, borderRadius: radius.xl, overflow: 'hidden' }}>
                {product.bulkTiers.map((tier, index) => (
                  <Row key={index} style={{ justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 14, borderTopWidth: index ? 1 : 0, borderTopColor: colors.hairline }}>
                    <Text size={13} color={colors.muted}>
                      {tier.minQty}{tier.maxQty ? ` – ${tier.maxQty}` : '+'} {t.pcs}
                    </Text>
                    <Text size={13} weight={700}>
                      {formatIqd(tier.priceIqd)} {t.iqd}
                    </Text>
                  </Row>
                ))}
              </View>
            </>
          ) : null}

          {product.description ? (
            <>
              <SectionLabel style={{ marginTop: 22 }}>{t.description}</SectionLabel>
              <Card style={{ marginTop: 8, padding: 14 }}>
                <Text size={13} color={colors.muted} lineHeight={1.6}>
                  {product.description}
                </Text>
              </Card>
            </>
          ) : null}

          <View style={{ height: 24 }} />
        </View>
      </ScrollView>

      {/* Actions */}
      <Row
        style={{
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: Math.max(insets.bottom, 20),
          borderTopWidth: 1,
          borderTopColor: colors.borderSoft,
          backgroundColor: colors.black,
          gap: 10,
        }}
      >
        <Button
          title={outOfStock ? t.outStock : justAdded || inCart > 0 ? t.added : t.addToCart}
          variant="outline"
          style={{ flex: 1, opacity: outOfStock ? 0.5 : 1 }}
          disabled={outOfStock}
          onPress={add}
        />
        <Button
          title={t.buyNow}
          style={{ flex: 1, opacity: outOfStock ? 0.5 : 1 }}
          disabled={outOfStock}
          onPress={() => {
            addToCart(product.id);
            router.push('/(buyer)/cart');
          }}
        />
      </Row>
    </View>
  );
}
