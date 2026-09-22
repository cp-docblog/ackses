import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CITIES, OptionSheet } from '../../src/components/OptionSheet';
import { Button, EmptyState, Loading, PhotoPlaceholder, Row, SectionLabel, Text } from '../../src/components/ui';
import { conditionLabel } from '../../src/components/ProductCard';
import { useT } from '../../src/i18n';
import { formatIqd, pick } from '../../src/lib/format';
import { usePlaceOrder, useProducts, useProfile, useShop } from '../../src/hooks/queries';
import { useAuthGate } from '../../src/hooks/useAuthGate';
import { useSession } from '../../src/state/session';
import { useStore } from '../../src/state/store';
import { defaultFilters } from '../../src/data/types';
import { colors, radius } from '../../src/theme';

/** 07 · Cart — grouped by shop, delivery details, cash on delivery or card. */
export default function Cart() {
  const { t, lang, row, font, isRTL } = useT();
  const insets = useSafeAreaInsets();
  const { cart, cartCount, setQty, removeFromCart, clearCart, vehicle, deliveryCity, setDeliveryCity } = useStore();
  const { user } = useSession();
  const { require } = useAuthGate();
  const placeOrder = usePlaceOrder();

  const { data: profile } = useProfile(!!user);
  const [payment, setPayment] = useState<'cod' | 'card' | null>(null);
  const [cityOpen, setCityOpen] = useState(false);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prefill from the profile once it arrives; the user can still edit.
  const effectiveAddress = address || profile?.addresses[0]?.line || '';
  const effectivePhone = phone || profile?.phone || '';
  const effectivePayment = payment ?? profile?.paymentPreference ?? 'cod';

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

  /** Bulk tiers apply per line: 4+ pads at the 4–9 price, and so on. */
  const unitPrice = (product: (typeof groups)[number]['items'][number], qty: number) => {
    const tier = (product.bulkTiers ?? []).find((tr) => qty >= tr.minQty && (tr.maxQty === null || qty <= tr.maxQty));
    return tier?.priceIqd ?? product.priceIqd;
  };

  const groupSubtotal = (group: (typeof groups)[number]) =>
    group.items.reduce((s, p) => s + unitPrice(p, cart[p.id] ?? 0) * (cart[p.id] ?? 0), 0);

  const subtotal = groups.reduce((sum, g) => sum + groupSubtotal(g), 0);

  const placeCartOrders = async () => {
    setTouched(true);
    if (!effectiveAddress.trim() || !effectivePhone.trim()) return;
    setError(null);
    try {
      let firstId: string | null = null;
      for (const group of groups) {
        const fee = shopFees[group.shopId] ?? 0;
        const id = await placeOrder.mutateAsync({
          shopId: group.shopId,
          totalIqd: groupSubtotal(group) + fee,
          city: deliveryCity,
          paymentMethod: effectivePayment,
          address: effectiveAddress.trim(),
          phone: effectivePhone.trim(),
          items: group.items.map((product) => ({
            productId: product.id,
            name: product.name,
            oem: product.oem,
            condition: product.condition,
            unitPriceIqd: unitPrice(product, cart[product.id] ?? 0),
            qty: cart[product.id] ?? 0,
          })),
        });
        firstId = firstId ?? id;
      }
      clearCart();
      router.replace({ pathname: '/order/[id]', params: { id: firstId ?? '', placed: '1' } });
    } catch (e) {
      setError(e instanceof Error ? e.message : t.authGeneric);
    }
  };

  const checkout = () => require(placeCartOrders, { reason: 'signInToCheckout', next: '/(buyer)/cart' });

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
        <Pressable accessibilityRole="button" onPress={() => setCityOpen(true)} hitSlop={8}>
          <Row gap={4}>
            <Text size={12} color={colors.muted}>
              {t.deliverTo}
            </Text>
            <Text size={12} weight={600}>
              {pick(deliveryCity, lang)} ▾
            </Text>
          </Row>
        </Pressable>
      </Row>

      {isPending ? <Loading /> : null}

      {!isPending && cartCount === 0 ? (
        <EmptyState message={t.cartEmpty} actionLabel={t.browse} onAction={() => router.push('/(buyer)')} />
      ) : null}

      {cartCount > 0 ? (
        <>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 20, gap: 14 }}
          >
            {groups.map((group) => (
              <CartGroup
                key={group.shopId}
                group={group}
                cart={cart}
                unitPrice={unitPrice}
                onFee={(fee) => registerFee(group.shopId, fee)}
                setQty={setQty}
                removeFromCart={removeFromCart}
              />
            ))}

            {/* Delivery details */}
            <SectionLabel style={{ marginTop: 6 }}>{t.delivery}</SectionLabel>
            <View style={{ gap: 8 }}>
              <View
                style={{
                  minHeight: 48,
                  borderRadius: radius.lg,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: touched && !effectiveAddress.trim() ? colors.red : colors.border,
                  paddingHorizontal: 14,
                  justifyContent: 'center',
                }}
              >
                <TextInput
                  value={effectiveAddress}
                  onChangeText={setAddress}
                  placeholder={t.addressLinePh}
                  placeholderTextColor={colors.mutedDark}
                  style={{ color: colors.white, fontFamily: font(500), fontSize: 13, textAlign: isRTL ? 'right' : 'left', paddingVertical: 12 }}
                />
              </View>
              <View
                style={{
                  minHeight: 48,
                  borderRadius: radius.lg,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: touched && !effectivePhone.trim() ? colors.red : colors.border,
                  paddingHorizontal: 14,
                  justifyContent: 'center',
                }}
              >
                <TextInput
                  value={effectivePhone}
                  onChangeText={setPhone}
                  placeholder={t.phonePh}
                  placeholderTextColor={colors.mutedDark}
                  keyboardType="phone-pad"
                  style={{ color: colors.white, fontFamily: font(500), fontSize: 13, textAlign: isRTL ? 'right' : 'left', paddingVertical: 12 }}
                />
              </View>
            </View>

            {/* Payment */}
            <SectionLabel style={{ marginTop: 6 }}>{t.payment}</SectionLabel>
            <Row gap={8}>
              {(
                [
                  { key: 'cod' as const, title: t.cod, sub: t.codSub },
                  { key: 'card' as const, title: t.card, sub: 'ZainCash · Visa' },
                ]
              ).map((option) => {
                const selected = effectivePayment === option.key;
                return (
                  <Pressable
                    key={option.key}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    onPress={() => setPayment(option.key)}
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
                    <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: selected ? 5 : 1, borderColor: selected ? colors.red : '#555' }} />
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
            {effectivePayment === 'card' ? (
              <Text size={11} color={colors.muted} lineHeight={1.5}>
                {t.cardSoon}
              </Text>
            ) : null}

            {/* Totals */}
            <Totals subtotal={subtotal} deliveryTotal={groups.reduce((s, g) => s + (shopFees[g.shopId] ?? 0), 0)} />

            {error ? (
              <Text size={12} weight={600} color={colors.red}>
                {error}
              </Text>
            ) : null}
          </ScrollView>

          <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, borderTopWidth: 1, borderTopColor: colors.borderSoft, backgroundColor: colors.black }}>
            <Button
              title={`${t.checkout} · ${formatIqd(subtotal + groups.reduce((s, g) => s + (shopFees[g.shopId] ?? 0), 0))} ${t.iqd}`}
              onPress={checkout}
              disabled={placeOrder.isPending}
            />
          </View>
        </>
      ) : null}

      <OptionSheet
        visible={cityOpen}
        title={t.chooseCity}
        options={CITIES.map((c) => ({ key: c.en, label: pick(c, lang) }))}
        value={deliveryCity.en}
        onSelect={(key) => {
          const city = CITIES.find((c) => c.en === key);
          if (city) setDeliveryCity(city);
        }}
        onClose={() => setCityOpen(false)}
      />
    </View>
  );
}

// Delivery fees come from each shop row; the group component reports its
// shop's fee up so totals and checkout use the real figure.
const shopFees: Record<string, number> = {};
function registerFee(shopId: string, fee: number) {
  shopFees[shopId] = fee;
}

function CartGroup({
  group,
  cart,
  unitPrice,
  onFee,
  setQty,
  removeFromCart,
}: {
  group: { shopId: string; items: import('../../src/data/repository').ProductWithFit[] };
  cart: Record<string, number>;
  unitPrice: (p: import('../../src/data/repository').ProductWithFit, qty: number) => number;
  onFee: (fee: number) => void;
  setQty: (id: string, qty: number) => void;
  removeFromCart: (id: string) => void;
}) {
  const { t, lang, row } = useT();
  const { data: shop } = useShop(group.shopId);
  React.useEffect(() => {
    if (shop) onFee(shop.deliveryFee);
  }, [shop, onFee]);

  return (
    <View style={{ borderWidth: 1, borderColor: colors.borderSoft, borderRadius: radius['3xl'], backgroundColor: colors.surface, overflow: 'hidden' }}>
      <Row style={{ gap: 10, paddingVertical: 12, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: colors.hairline }}>
        <View style={{ width: 28, height: 28, borderRadius: radius.md, backgroundColor: colors.black, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}>
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
        const price = unitPrice(product, qty);
        return (
          <Row key={product.id} style={{ gap: 12, paddingVertical: 12, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: colors.hairline }}>
            <PhotoPlaceholder uri={product.imageUrls?.[0] ?? product.imageUrl} style={{ width: 64, height: 64, borderRadius: radius.lg }} stripe={6} />
            <View style={{ flex: 1 }}>
              <Text size={13} weight={600} lineHeight={1.3} numberOfLines={2}>
                {pick(product.name, lang)}
              </Text>
              <Text size={11} color={colors.muted} style={{ marginTop: 2 }}>
                {conditionLabel(product.condition, t)} · OEM {product.oem}
              </Text>
              <Row gap={5} style={{ marginTop: 6, alignItems: 'baseline' }}>
                <Text size={14} weight={800}>
                  {formatIqd(price * qty)}
                </Text>
                <Text size={10} color={colors.muted}>
                  {t.iqd}
                  {price !== product.priceIqd ? ` · ${formatIqd(price)} × ${qty}` : ''}
                </Text>
              </Row>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 8 }}>
              <Pressable accessibilityRole="button" accessibilityLabel={t.delete} onPress={() => removeFromCart(product.id)} hitSlop={6}>
                <Text size={16} color={colors.muted}>
                  ✕
                </Text>
              </Pressable>
              <Row style={{ borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, overflow: 'hidden' }}>
                <Pressable accessibilityRole="button" accessibilityLabel="-" onPress={() => setQty(product.id, qty - 1)} style={{ width: 36, height: 34, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.black }}>
                  <Text size={16}>−</Text>
                </Pressable>
                <View style={{ width: 30, alignItems: 'center' }}>
                  <Text size={13} weight={700}>
                    {qty}
                  </Text>
                </View>
                <Pressable accessibilityRole="button" accessibilityLabel="+" onPress={() => setQty(product.id, Math.min(qty + 1, product.stock))} style={{ width: 36, height: 34, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.black }}>
                  <Text size={16}>+</Text>
                </Pressable>
              </Row>
            </View>
          </Row>
        );
      })}
    </View>
  );
}

function Totals({ subtotal, deliveryTotal }: { subtotal: number; deliveryTotal: number }) {
  const { t } = useT();
  return (
    <View style={{ borderWidth: 1, borderColor: colors.borderSoft, borderRadius: radius['2xl'], padding: 14, gap: 8 }}>
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
          {formatIqd(subtotal + deliveryTotal)} {t.iqd}
        </Text>
      </Row>
    </View>
  );
}
