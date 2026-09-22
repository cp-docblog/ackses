import React from 'react';
import { ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '../../src/components/Icon';
import { ScreenHeader } from '../../src/components/chrome';
import { Badge, Button, Card, EmptyState, Loading, PhotoPlaceholder, Row, SectionLabel, Text } from '../../src/components/ui';
import { useT } from '../../src/i18n';
import { formatIqd, formatTime, pick } from '../../src/lib/format';
import { useOrder } from '../../src/hooks/queries';
import { ORDER_STATUSES } from '../../src/data/types';
import { colors, radius } from '../../src/theme';

/**
 * Buyer order tracking. Reached from checkout (with `placed=1`, which adds
 * the confirmation banner), from the profile's order list, and from the
 * seller's own orders tab for a quick look.
 */
export default function OrderDetail() {
  const { id, placed } = useLocalSearchParams<{ id: string; placed?: string }>();
  const { t, lang, row, isRTL } = useT();
  const insets = useSafeAreaInsets();
  const { data: order, isPending, isError, refetch } = useOrder(id ?? '');

  if (isPending) return <Loading />;
  if (isError || !order) return <EmptyState message={t.loadFailed} actionLabel={t.retry} onAction={() => refetch()} />;

  const currentIndex = ORDER_STATUSES.indexOf(order.status);
  const itemCount = order.items.reduce((s, i) => s + i.qty, 0);

  return (
    <View style={{ flex: 1, backgroundColor: colors.black, paddingTop: insets.top + 8 }}>
      <ScreenHeader
        title={`${t.orderDetail} #${order.reference}`}
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/(buyer)'))}
      />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 18 }}>
        {placed === '1' ? (
          <Card style={{ padding: 16, borderColor: colors.red }}>
            <Row gap={12}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(227,6,19,.15)', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="check" size={20} color={colors.red} strokeWidth={3} />
              </View>
              <View style={{ flex: 1 }}>
                <Text size={15} weight={700}>
                  {t.orderPlaced}
                </Text>
                <Text size={12} color={colors.muted} lineHeight={1.5} style={{ marginTop: 2 }}>
                  {t.orderPlacedSub}
                </Text>
              </View>
            </Row>
          </Card>
        ) : null}

        {/* Status */}
        <View>
          <Row style={{ justifyContent: 'space-between' }}>
            <SectionLabel>{t.trackOrder}</SectionLabel>
            <Badge
              label={t.statuses[currentIndex] ?? ''}
              height={24}
              background={order.status === 'delivered' ? colors.successBg : colors.warnBg}
              border={order.status === 'delivered' ? colors.successBorder : colors.red}
            />
          </Row>
          <View style={{ marginTop: 12 }}>
            {ORDER_STATUSES.map((status, index) => {
              const reached = index <= currentIndex;
              const isCurrent = index === currentIndex;
              return (
                <View key={status} style={{ flexDirection: row, alignItems: 'center', gap: 14, height: 48 }}>
                  <View style={{ width: 24, height: 48, alignItems: 'center' }}>
                    <View style={{ flex: 1, width: 2, backgroundColor: index === 0 ? 'transparent' : reached ? colors.red : colors.border }} />
                    <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: reached ? colors.red : colors.trackBorder, backgroundColor: reached ? colors.red : colors.black, alignItems: 'center', justifyContent: 'center' }}>
                      {reached && !isCurrent ? <Icon name="check" size={10} strokeWidth={4} /> : null}
                    </View>
                    <View style={{ flex: 1, width: 2, backgroundColor: index === ORDER_STATUSES.length - 1 ? 'transparent' : index < currentIndex ? colors.red : colors.border }} />
                  </View>
                  <Text size={14} weight={isCurrent ? 700 : 500} color={reached ? colors.white : colors.muted} style={{ flex: 1 }}>
                    {t.statuses[index]}
                  </Text>
                  <Text size={11} color={colors.muted} monospace>
                    {formatTime(order.timeline[status])}
                  </Text>
                </View>
              );
            })}
          </View>
          {order.note ? (
            <Card style={{ padding: 12, marginTop: 8 }}>
              <Text size={10} weight={600} color={colors.muted} letterSpacing={1.5}>
                {t.sellerNote.toUpperCase()}
              </Text>
              <Text size={13} lineHeight={1.5} style={{ marginTop: 4 }}>
                {order.note}
              </Text>
            </Card>
          ) : null}
        </View>

        {/* Items */}
        <View>
          <SectionLabel>
            {itemCount} {t.itemsWord}
            {order.shopName ? ` · ${pick(order.shopName, lang)}` : ''}
          </SectionLabel>
          <View style={{ marginTop: 10, gap: 8 }}>
            {order.items.map((item, index) => (
              <Card key={`${item.productId}-${index}`} style={{ padding: 12 }}>
                <Row gap={12}>
                  <PhotoPlaceholder style={{ width: 52, height: 52, borderRadius: radius.md }} stripe={6} />
                  <View style={{ flex: 1 }}>
                    <Text size={13} weight={600} numberOfLines={2}>
                      {pick(item.name, lang)}
                    </Text>
                    <Text size={11} color={colors.muted} style={{ marginTop: 2 }}>
                      × {item.qty} · {formatIqd(item.unitPriceIqd)} {t.iqd}
                    </Text>
                  </View>
                  <Text size={14} weight={800}>
                    {formatIqd(item.unitPriceIqd * item.qty)}
                  </Text>
                </Row>
              </Card>
            ))}
          </View>
        </View>

        {/* Delivery & payment */}
        <View style={{ borderWidth: 1, borderColor: colors.borderSoft, borderRadius: radius['2xl'], padding: 14, gap: 8 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Text size={13} color={colors.muted}>
              {t.deliverTo}
            </Text>
            <Text size={13} style={{ flexShrink: 1 }} align="end">
              {pick(order.city, lang)}
            </Text>
          </Row>
          <Row style={{ justifyContent: 'space-between' }}>
            <Text size={13} color={colors.muted}>
              {t.payment}
            </Text>
            <Text size={13}>{order.paymentMethod === 'cod' ? t.cod : t.card}</Text>
          </Row>
          <View style={{ height: 1, backgroundColor: colors.borderSoft }} />
          <Row style={{ justifyContent: 'space-between' }}>
            <Text size={16} weight={800}>
              {t.total}
            </Text>
            <Text size={16} weight={800}>
              {formatIqd(order.totalIqd)} {t.iqd}
            </Text>
          </Row>
        </View>

        {placed === '1' ? <Button title={t.keepShopping} variant="ghost" onPress={() => router.replace('/(buyer)')} /> : null}
        <View style={{ height: isRTL ? 0 : 0 }} />
      </ScrollView>
    </View>
  );
}
