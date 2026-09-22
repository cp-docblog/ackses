import React, { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '../src/components/Icon';
import { RoundButton, SheetSurface } from '../src/components/chrome';
import { Button, Loading, PhotoPlaceholder, Row, Text } from '../src/components/ui';
import { useT } from '../src/i18n';
import { formatIqd, formatTime, pick } from '../src/lib/format';
import { useOrder, useUpdateOrderStatus } from '../src/hooks/queries';
import { useMyShopId } from '../src/hooks/useMyShop';
import { ORDER_STATUSES } from '../src/data/types';
import { colors, mono, radius } from '../src/theme';

/** S4 · Update order status. */
export default function OrderStatusSheet() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, lang, row, font, isRTL } = useT();
  const insets = useSafeAreaInsets();

  const { data: order, isPending } = useOrder(id ?? '');
  const update = useUpdateOrderStatus(useMyShopId());

  const [selected, setSelected] = useState<number | null>(null);
  const [note, setNote] = useState('');

  const currentIndex = order ? ORDER_STATUSES.indexOf(order.status) : 0;
  const activeIndex = selected ?? currentIndex;

  const save = async () => {
    if (!order) return;
    await update.mutateAsync({ id: order.id, status: ORDER_STATUSES[activeIndex], note });
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,.6)' }}>
      <Pressable style={{ flex: 1 }} onPress={() => router.back()} />

      <SheetSurface style={{ paddingHorizontal: 20 }}>
        {isPending || !order ? (
          <Loading />
        ) : (
          <>
            <Row style={{ justifyContent: 'space-between', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text size={18} weight={700}>
                  {t.updateStatus}
                </Text>
                <Text size={12} color={colors.muted} monospace style={{ marginTop: 2 }}>
                  #{order.reference} · {pick(order.buyerName, lang)} · {pick(order.city, lang)}
                </Text>
              </View>
              <RoundButton label={t.cancel} background={colors.surfaceAlt} onPress={() => router.back()}>
                <Text size={18}>×</Text>
              </RoundButton>
            </Row>

            {/* Order summary */}
            <Row
              style={{
                marginTop: 18,
                gap: 12,
                paddingVertical: 12,
                paddingHorizontal: 14,
                borderRadius: radius.xl,
                backgroundColor: colors.black,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <PhotoPlaceholder style={{ width: 48, height: 48, borderRadius: radius.md }} stripe={6} />
              <View style={{ flex: 1 }}>
                <Text size={13} weight={600} numberOfLines={2}>
                  {pick(order.items[0]?.name ?? { en: '', ar: '' }, lang)}
                </Text>
                <Text size={11} color={colors.muted} style={{ marginTop: 2 }}>
                  × {order.items.reduce((s, i) => s + i.qty, 0)} · {formatIqd(order.totalIqd)} {t.iqd} ·{' '}
                  {order.paymentMethod === 'cod' ? t.cod : t.card}
                </Text>
                {order.address || order.phone ? (
                  <Text size={11} color={colors.muted} style={{ marginTop: 4 }} numberOfLines={2}>
                    {[order.address, order.phone].filter(Boolean).join(' · ')}
                  </Text>
                ) : null}
              </View>
            </Row>

            {/* Timeline */}
            <View style={{ marginTop: 18 }}>
              {ORDER_STATUSES.map((status, index) => {
                const reached = index <= activeIndex;
                const isCurrent = index === activeIndex;
                return (
                  <Pressable
                    key={status}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isCurrent }}
                    onPress={() => setSelected(index)}
                    style={{ flexDirection: row, alignItems: 'center', gap: 14, height: 52 }}
                  >
                    <View style={{ width: 24, height: 52, alignItems: 'center' }}>
                      <View
                        style={{
                          flex: 1,
                          width: 2,
                          backgroundColor:
                            index === 0 ? 'transparent' : reached ? colors.red : colors.border,
                        }}
                      />
                      <View
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 11,
                          borderWidth: 2,
                          borderColor: reached ? colors.red : colors.trackBorder,
                          backgroundColor: reached ? colors.red : colors.black,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {reached && !isCurrent ? <Icon name="check" size={10} strokeWidth={4} /> : null}
                      </View>
                      <View
                        style={{
                          flex: 1,
                          width: 2,
                          backgroundColor:
                            index === ORDER_STATUSES.length - 1
                              ? 'transparent'
                              : index < activeIndex
                                ? colors.red
                                : colors.border,
                        }}
                      />
                    </View>
                    <Text
                      size={14}
                      weight={isCurrent ? 700 : 500}
                      color={reached ? colors.white : colors.muted}
                      style={{ flex: 1 }}
                    >
                      {t.statuses[index]}
                    </Text>
                    <Text size={11} color={colors.muted} style={{ fontFamily: mono }}>
                      {index <= currentIndex ? formatTime(order.timeline[status]) : ''}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Note */}
            <View
              style={{
                marginTop: 12,
                height: 48,
                borderRadius: radius.lg,
                backgroundColor: colors.black,
                borderWidth: 1,
                borderColor: colors.border,
                paddingHorizontal: 14,
                justifyContent: 'center',
              }}
            >
              <TextInput
                value={note}
                onChangeText={setNote}
                placeholder={t.noteToBuyer}
                placeholderTextColor={colors.muted}
                style={{
                  color: colors.white,
                  fontFamily: font(400),
                  fontSize: 13,
                  textAlign: isRTL ? 'right' : 'left',
                  padding: 0,
                }}
              />
            </View>

            <Button
              title={t.saveNotify}
              style={{ marginTop: 14 }}
              disabled={update.isPending}
              onPress={save}
            />
          </>
        )}
      </SheetSurface>
    </View>
  );
}
