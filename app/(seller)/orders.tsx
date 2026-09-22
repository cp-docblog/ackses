import React, { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Badge, Button, Card, Chip, EmptyState, HScroll, Loading, Row, Text } from '../../src/components/ui';
import { useT } from '../../src/i18n';
import { formatIqd, pick } from '../../src/lib/format';
import { useShopOrders } from '../../src/hooks/queries';
import { DEMO_SHOP_ID } from '../../src/data/repository';
import { ORDER_STATUSES } from '../../src/data/types';
import { colors } from '../../src/theme';

/** S2 · My shop, Orders tab. */
export default function SellerOrders() {
  const { t, lang } = useT();
  const insets = useSafeAreaInsets();
  const [chip, setChip] = useState(0);

  const { data: orders, isPending } = useShopOrders(DEMO_SHOP_ID);

  /** Chips are All · New · Preparing · Shipped · Delivered. */
  const visible = useMemo(() => {
    if (!orders) return [];
    if (chip === 0) return orders;
    const wanted: Record<number, typeof ORDER_STATUSES> = {
      1: ['received'],
      2: ['preparing'],
      3: ['shipped', 'out_for_delivery'],
      4: ['delivered'],
    };
    const statuses = wanted[chip] ?? [];
    return orders.filter((order) => statuses.includes(order.status));
  }, [orders, chip]);

  const tone = (status: (typeof ORDER_STATUSES)[number]) =>
    status === 'delivered'
      ? { background: colors.successBg, border: colors.successBorder }
      : { background: colors.warnBg, border: colors.red };

  return (
    <View style={{ flex: 1, backgroundColor: colors.black, paddingTop: insets.top + 8 }}>
      <Row style={{ paddingHorizontal: 20, justifyContent: 'space-between' }}>
        <Text size={22} weight={700}>
          {t.tabOrders}
        </Text>
        <Text size={12} color={colors.muted}>
          {orders?.length ?? 0}
        </Text>
      </Row>

      <HScroll style={{ marginTop: 16, flexGrow: 0 }}>
        {t.orderChips.map((label, index) => (
          <Chip
            key={label}
            label={label}
            height={34}
            selected={chip === index}
            onPress={() => setChip(index)}
          />
        ))}
      </HScroll>

      {isPending ? <Loading /> : null}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 24, gap: 8 }}
      >
        {visible.map((order) => {
          const statusIndex = ORDER_STATUSES.indexOf(order.status);
          const colours = tone(order.status);
          return (
            <Card key={order.id} style={{ paddingVertical: 12, paddingHorizontal: 14 }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Text size={12} color={colors.muted} monospace>
                  #{order.reference}
                </Text>
                <Badge
                  label={t.statuses[statusIndex] ?? ''}
                  height={24}
                  background={colours.background}
                  border={colours.border}
                />
              </Row>
              <Text size={13} weight={600} style={{ marginTop: 8 }} numberOfLines={2}>
                {pick(order.items[0]?.name ?? { en: '', ar: '' }, lang)}
              </Text>
              <Text size={11} color={colors.muted} style={{ marginTop: 2 }}>
                {pick(order.buyerName, lang)} · {pick(order.city, lang)} ·{' '}
                {order.paymentMethod === 'cod' ? t.cod : t.card}
              </Text>
              <Row style={{ marginTop: 10, justifyContent: 'space-between', gap: 12 }}>
                <Row gap={4} style={{ alignItems: 'baseline' }}>
                  <Text size={15} weight={800}>
                    {formatIqd(order.totalIqd)}
                  </Text>
                  <Text size={10} color={colors.muted}>
                    {t.iqd}
                  </Text>
                </Row>
                <Button
                  title={t.updateStatus}
                  size="sm"
                  onPress={() => router.push({ pathname: '/order-status', params: { id: order.id } })}
                />
              </Row>
            </Card>
          );
        })}
        {!isPending && visible.length === 0 ? <EmptyState message={t.noOrders} /> : null}
      </ScrollView>
    </View>
  );
}
