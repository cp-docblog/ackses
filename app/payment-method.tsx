import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '../src/components/chrome';
import { Text } from '../src/components/ui';
import { useT } from '../src/i18n';
import { useProfile, useUpdateProfile } from '../src/hooks/queries';
import { colors, radius } from '../src/theme';

/** Default payment method for checkout. */
export default function PaymentMethod() {
  const { t, row } = useT();
  const insets = useSafeAreaInsets();
  const { data: profile } = useProfile();
  const update = useUpdateProfile();
  const current = profile?.paymentPreference ?? 'cod';

  const options = [
    { key: 'cod' as const, title: t.cod, sub: t.codSub },
    { key: 'card' as const, title: t.card, sub: 'ZainCash · Visa' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.black, paddingTop: insets.top + 8 }}>
      <ScreenHeader title={t.paymentPrefTitle} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 10 }}>
        <Text size={13} color={colors.muted} lineHeight={1.5}>
          {t.paymentPrefSub}
        </Text>
        {options.map((option) => {
          const selected = current === option.key;
          return (
            <Pressable
              key={option.key}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => update.mutate({ paymentPreference: option.key })}
              style={{ minHeight: 60, borderRadius: radius.xl, borderWidth: 1, borderColor: selected ? colors.red : colors.border, backgroundColor: colors.surface, flexDirection: row, alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 10 }}
            >
              <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: selected ? 5 : 1, borderColor: selected ? colors.red : '#555' }} />
              <View style={{ flex: 1 }}>
                <Text size={14} weight={700}>
                  {option.title}
                </Text>
                <Text size={11} color={colors.muted}>
                  {option.sub}
                </Text>
              </View>
            </Pressable>
          );
        })}
        <Text size={11} color={colors.muted} lineHeight={1.5}>
          {t.cardSoon}
        </Text>
      </ScrollView>
    </View>
  );
}
