import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '../src/components/chrome';
import { Badge, EmptyState, Loading, PhotoPlaceholder, Row, Text } from '../src/components/ui';
import { useT } from '../src/i18n';
import { formatIqd, pick } from '../src/lib/format';
import { useBuyerOrders } from '../src/hooks/queries';
import { ORDER_STATUSES } from '../src/data/types';
import { colors, radius } from '../src/theme';

/** Every order the buyer has placed, newest first. */
export default function BuyerOrders() {
  const { t, lang, row, isRTL } = useT();
  const insets = useSafeAreaInsets();
  const { data: orders, isPending, isError, refetch } = useBuyerOrders();

  return (
    <View style={{ flex: 1, backgroundColor: colors.black, paddingTop: insets.top + 8 }}>
      <ScreenHeader title={t.allOrders} onBack={() => router.back()} />
      {isPending ? <Loading /> : null}
      {isError ? <EmptyState message={t.loadFailed} actionLabel={t.retry} onAction={() => refetch()} /> : null}
      {!isPending && orders?.length === 0 ? <EmptyState message={t.noOrders} actionLabel={t.browse} onAction={() => router.replace('/(buyer)')} /> : null}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, gap: 8 }}>
        {orders?.map((order) => {
          const statusIndex = ORDER_STATUSES.indexOf(order.status);
          const delivered = order.status === 'delivered';
          return (
            <Pressable
              key={order.id}
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/order/[id]', params: { id: order.id } })}
              style={({ pressed }) => ({
                flexDirection: row,
                alignItems: 'center',
                gap: 12,
                paddingVertical: 12,
                paddingHorizontal: 14,
                borderRadius: radius['2xl'],
                borderWidth: 1,
                borderColor: colors.borderSoft,
                backgroundColor: pressed ? colors.surfaceAlt : colors.surface,
              })}
            >
              <PhotoPlaceholder style={{ width: 48, height: 48, borderRadius: radius.lg }} stripe={6} />
              <View style={{ flex: 1 }}>
                <Text size={13} weight={600} numberOfLines={1}>
                  {pick(order.items[0]?.name ?? { en: '', ar: '' }, lang)}
                  {order.items.length > 1 ? ` +${order.items.length - 1}` : ''}
                </Text>
                <Text size={11} color={colors.muted} style={{ marginTop: 2 }}>
                  #{order.reference} · {formatIqd(order.totalIqd)} {t.iqd}
                  {order.shopName ? ` · ${pick(order.shopName, lang)}` : ''}
                </Text>
              </View>
              <Badge height={26} label={t.statuses[statusIndex] ?? ''} background={delivered ? colors.successBg : colors.warnBg} border={delivered ? colors.successBorder : colors.red} />
              <Text size={16} color={colors.muted}>
                {isRTL ? '‹' : '›'}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
