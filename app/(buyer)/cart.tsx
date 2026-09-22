import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useComingSoon } from '../../src/components/ComingSoon';
import {
  Button,
  EmptyState,
  Loading,
  PhotoPlaceholder,
  Row,
  SectionLabel,
  Text,
} from '../../src/components/ui';
import { conditionLabel } from '../../src/components/ProductCard';
import { useT } from '../../src/i18n';
import { formatIqd, pick } from '../../src/lib/format';
import { usePlaceOrder, useProducts } from '../../src/hooks/queries';
import { useAuthGate } from '../../src/hooks/useAuthGate';
import { useStore } from '../../src/state/store';
import { SHOPS } from '../../src/data/fixtures';
import { defaultFilters } from '../../src/data/types';
import { colors, radius } from '../../src/theme';

/** 07 · Cart — grouped by shop, cash on delivery by default. */
export default function Cart() {
  const { t, lang, row } = useT();
  const insets = useSafeAreaInsets();
  const { show } = useComingSoon();
  const { cart, cartCount, setQty, removeFromCart, clearCart, vehicle } = useStore();
  const [payment, setPayment] = useState<'cod' | 'card'>('cod');
  const placeOrder = usePlaceOrder();
  const { require } = useAuthGate();

  // The cart stores ids and quantities; pull the catalogue to resolve them.
  const { data: catalogue, isPending } = useProducts({ ...defaultFilters, vehicle }, null);

  const groups = useMemo(() => {
    if (!catalogue) return [];
    const byShop = new Map<string, { shopId: string; items: typeof catalogue }>();
    for (const product of catalogue) {
      if (!cart[product.id]) continue;
      const group = byShop.get(product.shopId) ?? { shopId: product.shopId, items: [] };
      group.items.push(product);
      byShop.set(product.shopId, group);
    }
    return [...byShop.values()];
  }, [catalogue, cart]);

  const subtotal = groups.reduce(
    (sum, group) => sum + group.items.reduce((s, p) => s + p.priceIqd * (cart[p.id] ?? 0), 0),
    0,
  );
  const deliveryTotal = groups.reduce(
    (sum, group) => sum + (SHOPS.find((s) => s.id === group.shopId)?.deliveryFee ?? 0),
    0,
  );
  const total = subtotal + deliveryTotal;

  // Browsing and filling a cart are open; placing the order is not.
  const checkout = () =>
    require(placeCartOrders, { reason: 'signInToCheckout', next: '/(buyer)/cart' });

  const placeCartOrders = async () => {
    for (const group of groups) {
      await placeOrder.mutateAsync({
        shopId: group.shopId,
        totalIqd:
          group.items.reduce((s, p) => s + p.priceIqd * (cart[p.id] ?? 0), 0) +
          (SHOPS.find((s) => s.id === group.shopId)?.deliveryFee ?? 0),
        city: { en: 'Baghdad', ar: 'بغداد' },
        paymentMethod: payment,
        items: group.items.map((product) => ({
          productId: product.id,
          name: product.name,
          oem: product.oem,
          condition: product.condition,
          unitPriceIqd: product.priceIqd,
          qty: cart[product.id] ?? 0,
        })),
      });
    }
    clearCart();
    router.push('/(buyer)/profile');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.black, paddingTop: insets.top + 8 }}>
      <Row style={{ paddingHorizontal: 20, justifyContent: 'space-between', gap: 12 }}>
        <Row gap={6}>
          <Text size={22} weight={700}>
            {t.cart}
          </Text>
          <Text size={14} weight={500} color={colors.muted}>
            ({cartCount})
          </Text>
        </Row>
        <Row gap={4}>
          <Text size={12} color={colors.muted}>
            {t.deliverTo}
          </Text>
          <Text size={12} weight={600}>
            {t.baghdad} ▾
          </Text>
        </Row>
      </Row>

      {isPending ? <Loading /> : null}

      {!isPending && cartCount === 0 ? (
        <EmptyState message={t.cartEmpty} actionLabel={t.browse} onAction={() => router.push('/(buyer)')} />
      ) : null}

      {cartCount > 0 ? (
        <>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 20, gap: 14 }}
          >
            {groups.map((group) => {
              const shop = SHOPS.find((s) => s.id === group.shopId);
              return (
                <View
                  key={group.shopId}
                  style={{
                    borderWidth: 1,
                    borderColor: colors.borderSoft,
                    borderRadius: radius['3xl'],
                    backgroundColor: colors.surface,
                    overflow: 'hidden',
                  }}
                >
                  <Row
                    style={{
                      gap: 10,
                      paddingVertical: 12,
                      paddingHorizontal: 14,
                      borderBottomWidth: 1,
                      borderBottomColor: colors.hairline,
                    }}
                  >
                    <View
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: radius.md,
                        backgroundColor: colors.black,
                        borderWidth: 1,
                        borderColor: colors.border,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text size={11} weight={800} color={colors.red}>
                        {shop?.initial}
                      </Text>
                    </View>
                    <Text size={13} weight={700} style={{ flex: 1 }} numberOfLines={1}>
                      {shop ? pick(shop.name, lang) : ''}
                    </Text>
                    <Text size={11} color={colors.muted}>
                      {t.delivery} {formatIqd(shop?.deliveryFee ?? 0)} {t.iqd}
                    </Text>
                  </Row>

                  {group.items.map((product) => {
                    const qty = cart[product.id] ?? 0;
                    return (
                      <Row
                        key={product.id}
                        style={{
                          gap: 12,
                          paddingVertical: 12,
                          paddingHorizontal: 14,
                          borderBottomWidth: 1,
                          borderBottomColor: colors.hairline,
                        }}
                      >
                        <PhotoPlaceholder
                          style={{ width: 64, height: 64, borderRadius: radius.lg }}
                          stripe={6}
                        />
                        <View style={{ flex: 1 }}>
                          <Text size={13} weight={600} lineHeight={1.3} numberOfLines={2}>
                            {pick(product.name, lang)}
                          </Text>
                          <Text size={11} color={colors.muted} style={{ marginTop: 2 }}>
                            {conditionLabel(product.condition, t)} · OEM {product.oem}
                          </Text>
                          <Row gap={5} style={{ marginTop: 6, alignItems: 'baseline' }}>
                            <Text size={14} weight={800}>
                              {formatIqd(product.priceIqd * qty)}
                            </Text>
                            <Text size={10} color={colors.muted}>
                              {t.iqd}
                            </Text>
                          </Row>
                        </View>
                        <View style={{ alignItems: 'flex-end', gap: 8 }}>
                          <Pressable
                            accessibilityRole="button"
                            accessibilityLabel={t.delete}
                            onPress={() => removeFromCart(product.id)}
                            hitSlop={6}
                          >
                            <Text size={16} color={colors.muted}>
                              ✕
                            </Text>
                          </Pressable>
                          <Row
                            style={{
                              borderWidth: 1,
                              borderColor: colors.border,
                              borderRadius: radius.md,
                              overflow: 'hidden',
                            }}
                          >
                            <Pressable
                              accessibilityRole="button"
                              accessibilityLabel="-"
                              onPress={() => setQty(product.id, qty - 1)}
                              style={{
                                width: 36,
                                height: 34,
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: colors.black,
                              }}
                            >
                              <Text size={16}>−</Text>
                            </Pressable>
                            <View style={{ width: 30, alignItems: 'center' }}>
                              <Text size={13} weight={700}>
                                {qty}
                              </Text>
                            </View>
                            <Pressable
                              accessibilityRole="button"
                              accessibilityLabel="+"
                              onPress={() => setQty(product.id, qty + 1)}
                              style={{
                                width: 36,
                                height: 34,
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: colors.black,
                              }}
                            >
                              <Text size={16}>+</Text>
                            </Pressable>
                          </Row>
                        </View>
                      </Row>
                    );
                  })}
                </View>
              );
            })}

            {/* Payment */}
            <SectionLabel style={{ marginTop: 6 }}>{t.payment}</SectionLabel>
            <Row gap={8}>
              {(
                [
                  { key: 'cod' as const, title: t.cod, sub: t.codSub },
                  { key: 'card' as const, title: t.card, sub: 'ZainCash · Visa' },
                ]
              ).map((option) => {
                const selected = payment === option.key;
                return (
                  <Pressable
                    key={option.key}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    onPress={() => (option.key === 'card' ? show('generic') : setPayment('cod'))}
                    style={{
                      flex: 1,
                      minHeight: 56,
                      borderRadius: radius.xl,
                      borderWidth: 1,
                      borderColor: selected ? colors.red : colors.border,
                      backgroundColor: colors.surface,
                      flexDirection: row,
                      alignItems: 'center',
                      gap: 10,
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                    }}
                  >
                    <View
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 9,
                        borderWidth: selected ? 5 : 1,
                        borderColor: selected ? colors.red : '#555',
                      }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text size={13} weight={700}>
                        {option.title}
                      </Text>
                      <Text size={10} color={colors.muted}>
                        {option.sub}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </Row>

            {/* Totals */}
            <View
              style={{
                borderWidth: 1,
                borderColor: colors.borderSoft,
                borderRadius: radius['2xl'],
                padding: 14,
                gap: 8,
              }}
            >
              <Row style={{ justifyContent: 'space-between' }}>
                <Text size={13} color={colors.muted}>
                  {t.subtotal}
                </Text>
                <Text size={13}>
                  {formatIqd(subtotal)} {t.iqd}
                </Text>
              </Row>
              <Row style={{ justifyContent: 'space-between' }}>
                <Text size={13} color={colors.muted}>
                  {t.delivery}
                </Text>
                <Text size={13}>
                  {formatIqd(deliveryTotal)} {t.iqd}
                </Text>
              </Row>
              <View style={{ height: 1, backgroundColor: colors.borderSoft }} />
              <Row style={{ justifyContent: 'space-between' }}>
                <Text size={16} weight={800}>
                  {t.total}
                </Text>
                <Text size={16} weight={800}>
                  {formatIqd(total)} {t.iqd}
                </Text>
              </Row>
            </View>
          </ScrollView>

          <View
            style={{
              paddingHorizontal: 20,
              paddingTop: 12,
              paddingBottom: 12,
              borderTopWidth: 1,
              borderTopColor: colors.borderSoft,
              backgroundColor: colors.black,
            }}
          >
            <Button
              title={`${t.checkout} · ${formatIqd(total)} ${t.iqd}`}
              onPress={checkout}
              disabled={placeOrder.isPending}
            />
          </View>
        </>
      ) : null}
    </View>
  );
}
