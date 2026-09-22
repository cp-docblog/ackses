import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useComingSoon } from '../../src/components/ComingSoon';
import { Icon } from '../../src/components/Icon';
import { DemoDataNotice, Logo, RoundButton } from '../../src/components/chrome';
import { ProductGridCard } from '../../src/components/ProductCard';
import { EmptyState, HScroll, Loading, Row, Text } from '../../src/components/ui';
import { useT } from '../../src/i18n';
import { vehicleLabel } from '../../src/lib/format';
import { useProducts } from '../../src/hooks/queries';
import { useStore } from '../../src/state/store';
import { colors, radius } from '../../src/theme';

/** 02 · Listings — search, my-car filter, compatibility badges. */
export default function Listings() {
  const { t, row, font, isRTL } = useT();
  const insets = useSafeAreaInsets();
  const { show } = useComingSoon();
  const { filters, setFilters, resetFilters, vehicle, cartCount } = useStore();
  const [draft, setDraft] = useState(filters.text);

  const subcategoryPosition = useMemo(() => {
    if (filters.categoryIndex < 0 || !filters.subcategory) return null;
    const index = t.subcats[filters.categoryIndex]?.indexOf(filters.subcategory) ?? -1;
    return index >= 0 ? index : null;
  }, [filters.categoryIndex, filters.subcategory, t.subcats]);

  const { data: products, isPending, isError } = useProducts(filters, subcategoryPosition);

  const submitSearch = () => setFilters((prev) => ({ ...prev, text: draft }));

  return (
    <View style={{ flex: 1, backgroundColor: colors.black, paddingTop: insets.top + 8 }}>
      <Row style={{ paddingHorizontal: 20, justifyContent: 'space-between' }}>
        <Logo size={20} />
        <Row gap={6}>
          <RoundButton label={t.tabProfile} onPress={() => router.push('/(buyer)/profile')}>
            <Icon name="user" size={20} />
          </RoundButton>
          <RoundButton label={t.tabCart} onPress={() => router.push('/(buyer)/cart')}>
            <Icon name="cart" size={20} />
            {cartCount > 0 ? (
              <View
                style={{
                  position: 'absolute',
                  top: 4,
                  [isRTL ? 'left' : 'right']: 4,
                  minWidth: 18,
                  height: 18,
                  borderRadius: 9,
                  backgroundColor: colors.red,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 5,
                }}
              >
                <Text size={11} weight={700}>
                  {cartCount}
                </Text>
              </View>
            ) : null}
          </RoundButton>
        </Row>
      </Row>

      {/* Search bar: free text + OEM, with image and VIN entry points. */}
      <Row style={{ paddingHorizontal: 20, paddingTop: 14, gap: 8 }}>
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
            onSubmitEditing={submitSearch}
            onBlur={submitSearch}
            returnKeyType="search"
            placeholder={t.searchPh}
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
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.imgTitle}
            onPress={() => router.push('/image-search')}
            hitSlop={8}
          >
            <Icon name="camera" size={20} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.vinTitle}
            onPress={() => router.push('/vin')}
            hitSlop={8}
          >
            <Icon name="vin" size={20} />
          </Pressable>
        </Row>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.filters}
          onPress={() => router.push('/filters')}
          style={{
            width: 48,
            height: 48,
            borderRadius: radius.xl,
            backgroundColor: colors.red,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="filters" size={20} />
        </Pressable>
      </Row>

      {/* My car + fits-only quick filters. */}
      <HScroll style={{ marginTop: 12, flexGrow: 0 }}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/(buyer)/profile')}
          style={{
            height: 38,
            paddingHorizontal: 12,
            borderRadius: 19,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
            flexDirection: row,
            alignItems: 'center',
            gap: 8,
          }}
        >
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.red }} />
          <Text size={12} weight={600}>
            {vehicleLabel(vehicle)}
          </Text>
          <Text size={12} color={colors.muted}>
            ▾
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: filters.fitsOnly }}
          onPress={() => setFilters((prev) => ({ ...prev, fitsOnly: !prev.fitsOnly }))}
          style={{
            height: 38,
            paddingHorizontal: 12,
            borderRadius: 19,
            borderWidth: 1,
            borderColor: filters.fitsOnly ? colors.red : colors.border,
            backgroundColor: filters.fitsOnly ? colors.red : colors.surface,
            flexDirection: row,
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Icon name="check" size={14} strokeWidth={3} />
          <Text size={12} weight={600}>
            {t.fitsOnly}
          </Text>
        </Pressable>
      </HScroll>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <DemoDataNotice />

        {/* Category rail. */}
        <HScroll gap={10} style={{ marginTop: 18 }}>
          {t.cats.map((label, index) => {
            const selected = filters.categoryIndex === index;
            return (
              <Pressable
                key={label}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() =>
                  setFilters((prev) => ({
                    ...prev,
                    categoryIndex: selected ? -1 : index,
                    subcategory: null,
                  }))
                }
                style={{ alignItems: 'center', gap: 8, width: 68 }}
              >
                <View
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: radius['3xl'],
                    backgroundColor: selected ? colors.red : colors.surface,
                    borderWidth: 1,
                    borderColor: selected ? colors.red : colors.borderSoft,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name="target" size={22} color={selected ? colors.white : colors.red} />
                </View>
                <Text size={11} weight={500} align="center" numberOfLines={1}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </HScroll>

        <Row style={{ paddingHorizontal: 20, paddingTop: 20, justifyContent: 'space-between' }}>
          <Row gap={5}>
            <Text size={15} weight={700}>
              {t.results}
            </Text>
            <Text size={15} weight={500} color={colors.muted}>
              ({products?.length ?? 0})
            </Text>
          </Row>
          <Text size={12} color={colors.muted}>
            {t.sort} ▾
          </Text>
        </Row>

        {isPending ? <Loading /> : null}
        {isError ? <EmptyState message={t.loadFailed} /> : null}
        {!isPending && !isError && products?.length === 0 ? (
          <EmptyState
            message={t.noResults}
            actionLabel={t.clearFilters}
            onAction={() => {
              resetFilters();
              setDraft('');
            }}
          />
        ) : null}

        <View
          style={{
            flexDirection: isRTL ? 'row-reverse' : 'row',
            flexWrap: 'wrap',
            gap: 12,
            paddingHorizontal: 20,
            paddingTop: 14,
          }}
        >
          {products?.map((product) => (
            <View key={product.id} style={{ width: '47%', flexGrow: 1 }}>
              <ProductGridCard product={product} onPress={() => router.push(`/product/${product.id}`)} />
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
