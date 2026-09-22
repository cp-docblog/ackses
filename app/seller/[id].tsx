import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { VerifiedMark } from '../../src/components/Icon';
import { ScreenHeader } from '../../src/components/chrome';
import { Button, Card, EmptyState, Loading, Row, SectionLabel, Text } from '../../src/components/ui';
import { useT } from '../../src/i18n';
import { pick } from '../../src/lib/format';
import { useComingSoon } from '../../src/components/ComingSoon';
import { useSeller, useSellerShops } from '../../src/hooks/queries';
import { colors, radius } from '../../src/theme';

/** 05 · Seller profile (person, buyer view). */
export default function SellerProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, lang, row, isRTL } = useT();
  const insets = useSafeAreaInsets();
  const { show } = useComingSoon();

  const { data: seller, isPending, isError } = useSeller(id ?? '');
  const { data: shops } = useSellerShops(id ?? '');

  if (isPending) return <Loading />;
  if (isError || !seller) return <EmptyState message={t.loadFailed} />;

  const stats = [
    { value: seller.ordersCount.toLocaleString('en-US'), label: t.sellerStats[0] },
    { value: String(seller.rating), label: t.sellerStats[1] },
    { value: seller.responseTime, label: t.sellerStats[2] },
  ];

  // Distribution behind the 4.8 average, as drawn in the design.
  const ratingBars = [
    { star: 5, width: '82%' },
    { star: 4, width: '12%' },
    { star: 3, width: '4%' },
    { star: 2, width: '1%' },
    { star: 1, width: '1%' },
  ] as const;

  return (
    <View style={{ flex: 1, backgroundColor: colors.black, paddingTop: insets.top + 8 }}>
      <ScreenHeader title={t.sellerProfile} onBack={() => router.back()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 40 }}
      >
        <View style={{ alignItems: 'center' }}>
          <View
            style={{
              width: 96,
              height: 96,
              borderRadius: 48,
              backgroundColor: colors.surface,
              borderWidth: 2,
              borderColor: colors.red,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text size={32} weight={800}>
              {pick(seller.initial, lang)}
            </Text>
          </View>
          <Row gap={6} style={{ marginTop: 14 }}>
            <Text size={20} weight={700}>
              {pick(seller.name, lang)}
            </Text>
            {seller.verified ? <VerifiedMark /> : null}
          </Row>
          <Text size={12} color={colors.muted} align="center" style={{ marginTop: 4 }}>
            {t.idVerified} · {t.member} {seller.memberSince} · {pick(seller.city, lang)}
          </Text>
        </View>

        <Row style={{ gap: 8, marginTop: 22 }}>
          {stats.map((stat) => (
            <Card key={stat.label} style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 8 }}>
              <Text size={18} weight={800} align="center">
                {stat.value}
              </Text>
              <Text size={10} color={colors.muted} align="center" style={{ marginTop: 2 }} numberOfLines={1}>
                {stat.label}
              </Text>
            </Card>
          ))}
        </Row>

        <Row style={{ gap: 10, marginTop: 16 }}>
          <Button title={t.message} size="md" style={{ flex: 1 }} onPress={() => show('generic')} />
          <Button
            title={t.call}
            variant="ghost"
            size="md"
            style={{ flex: 1 }}
            onPress={() => show('generic')}
          />
        </Row>

        <SectionLabel style={{ marginTop: 26 }}>{t.shopsBy}</SectionLabel>
        <View style={{ gap: 8, marginTop: 10 }}>
          {shops?.map((shop) => (
            <Pressable
              key={shop.id}
              accessibilityRole="button"
              onPress={() => router.push(`/shop/${shop.id}`)}
              style={{
                flexDirection: row,
                alignItems: 'center',
                gap: 12,
                paddingVertical: 12,
                paddingHorizontal: 14,
                borderRadius: radius['2xl'],
                borderWidth: 1,
                borderColor: colors.borderSoft,
                backgroundColor: colors.surface,
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
                <Text size={14} weight={700}>
                  {pick(shop.name, lang)}
                </Text>
                <Text size={12} color={colors.muted} style={{ marginTop: 2 }}>
                  {pick(shop.city, lang)} · {shop.productCount} {t.shopStats[0]}
                </Text>
              </View>
              <Text size={16} color={colors.muted}>
                {isRTL ? '‹' : '›'}
              </Text>
            </Pressable>
          ))}
        </View>

        <SectionLabel style={{ marginTop: 26 }}>{t.ratings}</SectionLabel>
        <Card style={{ marginTop: 10, padding: 14 }}>
          <Row style={{ gap: 16 }}>
            <View style={{ alignItems: 'center' }}>
              <Text size={34} weight={800} lineHeight={1}>
                {seller.rating}
              </Text>
              <Text size={11} color={colors.red} style={{ marginTop: 4 }}>
                ★★★★★
              </Text>
              <Text size={10} color={colors.muted} style={{ marginTop: 2 }}>
                1,240 {t.reviewsWord}
              </Text>
            </View>
            <View style={{ flex: 1, gap: 6 }}>
              {ratingBars.map((bar) => (
                <Row key={bar.star} gap={8}>
                  <Text size={10} color={colors.muted} style={{ width: 8 }}>
                    {bar.star}
                  </Text>
                  <View
                    style={{
                      flex: 1,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: colors.borderSoft,
                      overflow: 'hidden',
                    }}
                  >
                    <View style={{ height: '100%', width: bar.width, backgroundColor: colors.red }} />
                  </View>
                </Row>
              ))}
            </View>
          </Row>
        </Card>

        <Pressable
          accessibilityRole="button"
          onPress={() => show('generic')}
          style={{ height: 44, alignItems: 'center', justifyContent: 'center', marginTop: 16 }}
        >
          <Text size={12} weight={500} color={colors.muted}>
            {t.report}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}
