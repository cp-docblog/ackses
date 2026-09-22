import React from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '../../src/components/Icon';
import { DemoDataNotice, Logo } from '../../src/components/chrome';
import { Badge, Button, Card, Row, SectionLabel, StatTile, Text } from '../../src/components/ui';
import { useT } from '../../src/i18n';
import { formatIqd, pick } from '../../src/lib/format';
import { useShop, useShopOrders } from '../../src/hooks/queries';
import { DEMO_SHOP_ID } from '../../src/data/repository';
import { SELLER_BALANCE } from '../../src/data/fixtures';
import { ORDER_STATUSES } from '../../src/data/types';
import { colors, radius } from '../../src/theme';

/**
 * Seller dashboard.
 *
 * The design canvas gives the seller four tabs but only draws the Account
 * screen behind them, so this tab composes pieces that already exist in the
 * design — shop header, stat tiles, order rows — into a landing view. Nothing
 * here introduces a new visual pattern.
 */
export default function SellerDashboard() {
  const { t, lang, row } = useT();
  const insets = useSafeAreaInsets();
  const { data: shop } = useShop(DEMO_SHOP_ID);
  const { data: orders } = useShopOrders(DEMO_SHOP_ID);

  const openOrders = orders?.filter((order) => order.status !== 'delivered') ?? [];

  const stats = [
    { value: '4.2M', label: t.accStats[0], delta: '+12%' },
    { value: String(SELLER_BALANCE.ordersCount), label: t.accStats[1], delta: '+8' },
    { value: String(SELLER_BALANCE.rating), label: t.accStats[2], delta: '★' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.black, paddingTop: insets.top + 8 }}>
      <Row style={{ paddingHorizontal: 20, justifyContent: 'space-between' }}>
        <Logo size={20} />
        <Text size={12} color={colors.muted}>
          {shop ? pick(shop.city, lang) : ''}
        </Text>
      </Row>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <DemoDataNotice />

        <Row style={{ paddingHorizontal: 20, paddingTop: 18, gap: 12 }}>
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
        </Row>

        <Row style={{ paddingHorizontal: 20, paddingTop: 16, gap: 8 }}>
          {stats.map((stat) => (
            <StatTile key={stat.label} value={stat.value} label={stat.label} delta={stat.delta} />
          ))}
        </Row>

        <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
          <Button
            title={t.addProduct}
            icon={<Icon name="plus" size={20} />}
            onPress={() => router.push('/add-product')}
          />
        </View>

        <Row style={{ paddingHorizontal: 20, marginTop: 26, justifyContent: 'space-between' }}>
          <SectionLabel>{t.orders}</SectionLabel>
          <Text size={12} weight={600} color={colors.red} onPress={() => router.push('/(seller)/orders')}>
            {t.seeAll}
          </Text>
        </Row>

        <View style={{ paddingHorizontal: 20, gap: 8, marginTop: 10 }}>
          {openOrders.map((order) => {
            const statusIndex = ORDER_STATUSES.indexOf(order.status);
            return (
              <Card key={order.id} style={{ paddingVertical: 12, paddingHorizontal: 14 }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Text size={12} color={colors.muted} monospace>
                    #{order.reference}
                  </Text>
                  <Badge
                    label={t.statuses[statusIndex] ?? ''}
                    height={24}
                    background={colors.warnBg}
                    border={colors.red}
                  />
                </Row>
                <Text size={13} weight={600} style={{ marginTop: 8 }} numberOfLines={1}>
                  {pick(order.items[0]?.name ?? { en: '', ar: '' }, lang)}
                </Text>
                <Row style={{ marginTop: 8, justifyContent: 'space-between' }}>
                  <Text size={11} color={colors.muted}>
                    {pick(order.buyerName, lang)} · {pick(order.city, lang)}
                  </Text>
                  <Text size={15} weight={800}>
                    {formatIqd(order.totalIqd)} {t.iqd}
                  </Text>
                </Row>
              </Card>
            );
          })}
          {openOrders.length === 0 ? (
            <Text size={12} color={colors.muted}>
              {t.noOrders}
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}
