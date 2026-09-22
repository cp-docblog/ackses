import React, { useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, VerifiedMark } from '../../src/components/Icon';
import { BackChevron, RoundButton } from '../../src/components/chrome';
import { ProductGridCard } from '../../src/components/ProductCard';
import {
  Card,
  Chip,
  EmptyState,
  HScroll,
  Loading,
  PhotoPlaceholder,
  Row,
  Text,
} from '../../src/components/ui';
import { useT } from '../../src/i18n';
import { pick } from '../../src/lib/format';
import { useFollowing, useSetFollowing, useShop, useShopProducts, useShopReviews } from '../../src/hooks/queries';
import { useAuthGate } from '../../src/hooks/useAuthGate';
import { useSession } from '../../src/state/session';
import { useStore } from '../../src/state/store';
import { colors, radius } from '../../src/theme';

/** 04 · Shop profile (buyer view). */
export default function ShopProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, lang, row, font, isRTL } = useT();
  const insets = useSafeAreaInsets();
  const { vehicle } = useStore();
  const { user } = useSession();
  const { require } = useAuthGate();
  const [tab, setTab] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const { data: following = false } = useFollowing(id ?? '', !!user);
  const setFollowing = useSetFollowing(id ?? '');

  const { data: shop, isPending, isError } = useShop(id ?? '');
  const { data: products } = useShopProducts(id ?? '', vehicle);
  const { data: reviews } = useShopReviews(id ?? '');

  if (isPending) return <Loading />;
  if (isError || !shop) return <EmptyState message={t.loadFailed} />;

  const text = query.trim().toLowerCase();
  const visible = products
    ?.filter((p) => (categoryFilter === null ? true : p.categoryIndex === categoryFilter))
    .filter((p) => (text ? `${p.name.en} ${p.name.ar} ${p.oem} ${p.brand}`.toLowerCase().includes(text) : true));

  const stats = [
    { value: String(shop.productCount), label: t.shopStats[0] },
    { value: String(shop.rating), label: t.shopStats[1] },
    { value: `${shop.responseRate}%`, label: t.shopStats[2] },
    { value: shop.followers, label: t.shopStats[3] },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.black }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Cover */}
        <View>
          <PhotoPlaceholder label="shop cover photo" stripe={10} style={{ height: 170, width: '100%' }} />
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: 'rgba(26,3,5,.55)',
            }}
          />
          <RoundButton
            label={t.back}
            background={colors.scrim}
            onPress={() => router.back()}
            style={{ position: 'absolute', top: insets.top + 8, [isRTL ? 'right' : 'left']: 16 }}
          >
            <BackChevron />
          </RoundButton>
        </View>

        {/* Identity */}
        <Row style={{ paddingHorizontal: 20, marginTop: -28, alignItems: 'flex-end', gap: 14 }}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: radius.card,
              backgroundColor: colors.surface,
              borderWidth: 2,
              borderColor: colors.black,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text size={26} weight={800} color={colors.red}>
              {shop.initial}
            </Text>
          </View>
          <View style={{ flex: 1, paddingBottom: 4 }}>
            <Row gap={6} style={{ flexWrap: 'wrap' }}>
              <Text size={16} weight={700} lineHeight={1.2} style={{ flexShrink: 1 }}>
                {pick(shop.name, lang)}
              </Text>
              {shop.verified ? <VerifiedMark /> : null}
            </Row>
            <Text size={12} color={colors.muted} style={{ marginTop: 2 }}>
              {pick(shop.city, lang)} · {t.since} {shop.since}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => require(() => setFollowing.mutate(!following), { reason: 'signInToSave', next: `/shop/${id}` })}
            style={{
              height: 40,
              paddingHorizontal: 16,
              borderRadius: radius.lg,
              backgroundColor: following ? colors.surface : colors.red,
              borderWidth: following ? 1 : 0,
              borderColor: colors.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text size={12} weight={700}>
              {following ? t.following : t.follow}
            </Text>
          </Pressable>
        </Row>

        {/* Stats */}
        <Row style={{ paddingHorizontal: 20, paddingTop: 18, gap: 8 }}>
          {stats.map((stat) => (
            <Card key={stat.label} style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 8 }}>
              <Text size={16} weight={800} align="center">
                {stat.value}
              </Text>
              <Text size={10} color={colors.muted} align="center" style={{ marginTop: 2 }} numberOfLines={1}>
                {stat.label}
              </Text>
            </Card>
          ))}
        </Row>

        {/* Tabs */}
        <Row
          style={{
            paddingHorizontal: 20,
            paddingTop: 18,
            gap: 6,
            borderBottomWidth: 1,
            borderBottomColor: colors.borderSoft,
          }}
        >
          {t.tabs.map((label, index) => (
            <Pressable
              key={label}
              accessibilityRole="button"
              accessibilityState={{ selected: tab === index }}
              onPress={() => setTab(index)}
              style={{
                height: 44,
                paddingHorizontal: 14,
                borderBottomWidth: 2,
                borderBottomColor: tab === index ? colors.red : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text size={13} weight={600} color={tab === index ? colors.white : colors.muted}>
                {label}
              </Text>
            </Pressable>
          ))}
        </Row>

        {/* Products */}
        {tab === 0 ? (
          <>
            <Row
              style={{
                marginHorizontal: 20,
                marginTop: 14,
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
                placeholder={t.searchInShop}
                placeholderTextColor={colors.muted}
                style={{ flex: 1, color: colors.white, fontFamily: font(500), fontSize: 12, textAlign: isRTL ? 'right' : 'left', paddingVertical: 0 }}
              />
            </Row>

            <HScroll style={{ marginTop: 12, flexGrow: 0 }}>
              {t.cats.slice(0, 4).map((label, index) => (
                <Chip
                  key={label}
                  label={label}
                  height={32}
                  selected={categoryFilter === index}
                  onPress={() => setCategoryFilter(categoryFilter === index ? null : index)}
                />
              ))}
            </HScroll>

            <View
              style={{
                flexDirection: isRTL ? 'row-reverse' : 'row',
                flexWrap: 'wrap',
                gap: 12,
                paddingHorizontal: 20,
                paddingTop: 14,
              }}
            >
              {visible?.map((product) => (
                <View key={product.id} style={{ width: '47%', flexGrow: 1 }}>
                  <ProductGridCard
                    product={product}
                    imageHeight={110}
                    showMeta={false}
                    onPress={() => router.push(`/product/${product.id}`)}
                  />
                </View>
              ))}
            </View>
            {visible?.length === 0 ? <EmptyState message={t.noResults} /> : null}
          </>
        ) : null}

        {/* About */}
        {tab === 1 ? (
          <View style={{ paddingHorizontal: 20, paddingTop: 18, gap: 8 }}>
            <Text size={13} color={colors.muted} lineHeight={1.6}>
              {pick(shop.about, lang)}
            </Text>
            {[
              [t.hours, shop.hours],
              [t.address, pick(shop.address, lang)],
              [t.payment, t.cod],
            ].map(([label, value]) => (
              <Row
                key={label}
                style={{
                  justifyContent: 'space-between',
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  backgroundColor: colors.surface,
                  borderRadius: radius.lg,
                  gap: 12,
                }}
              >
                <Text size={13} color={colors.muted}>
                  {label}
                </Text>
                <Text size={13}>{value}</Text>
              </Row>
            ))}
          </View>
        ) : null}

        {/* Reviews */}
        {tab === 2 ? (
          <View style={{ paddingHorizontal: 20, paddingTop: 18, gap: 10 }}>
            {reviews?.map((review) => (
              <Card key={review.id} style={{ paddingVertical: 12, paddingHorizontal: 14 }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Text size={12} weight={600}>
                    {pick(review.author, lang)}
                  </Text>
                  <Text size={12} color={colors.red}>
                    {'★'.repeat(review.stars)}
                    {'☆'.repeat(5 - review.stars)}
                  </Text>
                </Row>
                <Text size={13} color={colors.muted} lineHeight={1.5} style={{ marginTop: 6 }}>
                  {pick(review.text, lang)}
                </Text>
              </Card>
            ))}
            {reviews?.length === 0 ? <EmptyState message={t.noResults} /> : null}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
