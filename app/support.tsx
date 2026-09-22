import React, { useState } from 'react';
import { Linking, Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '../src/components/chrome';
import { Card, Row, SectionLabel, Text } from '../src/components/ui';
import { useT } from '../src/i18n';
import { colors, radius } from '../src/theme';

/** Support contacts for the marketplace itself. */
const SUPPORT = {
  whatsapp: '9647700000000',
  phone: '+9647700000000',
  email: 'support@ackses.com',
};

export default function Support() {
  const { t, row, isRTL } = useT();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState<number | null>(0);

  const contacts = [
    { label: t.supportWhatsapp, value: `+${SUPPORT.whatsapp}`, href: `https://wa.me/${SUPPORT.whatsapp}` },
    { label: t.supportCall, value: SUPPORT.phone, href: `tel:${SUPPORT.phone}` },
    { label: t.supportEmail, value: SUPPORT.email, href: `mailto:${SUPPORT.email}` },
  ];
  const faqs = [
    [t.faq1q, t.faq1a],
    [t.faq2q, t.faq2a],
    [t.faq3q, t.faq3a],
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.black, paddingTop: insets.top + 8 }}>
      <ScreenHeader title={t.helpSupport} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 10 }}>
        <Text size={13} color={colors.muted} lineHeight={1.5}>
          {t.supportIntro}
        </Text>
        {contacts.map((c) => (
          <Pressable key={c.label} accessibilityRole="link" onPress={() => Linking.openURL(c.href).catch(() => {})}>
            <Card style={{ paddingVertical: 12, paddingHorizontal: 14 }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <View>
                  <Text size={13} weight={700}>
                    {c.label}
                  </Text>
                  <Text size={12} color={colors.muted} style={{ marginTop: 2 }}>
                    {c.value}
                  </Text>
                </View>
                <Text size={16} color={colors.muted}>
                  {isRTL ? '‹' : '›'}
                </Text>
              </Row>
            </Card>
          </Pressable>
        ))}
        <SectionLabel style={{ marginTop: 12 }}>{t.faqTitle}</SectionLabel>
        <View style={{ borderWidth: 1, borderColor: colors.borderSoft, borderRadius: radius.xl, overflow: 'hidden' }}>
          {faqs.map(([q, a], i) => (
            <Pressable key={q} accessibilityRole="button" accessibilityState={{ expanded: open === i }} onPress={() => setOpen(open === i ? null : i)} style={{ paddingHorizontal: 14, paddingVertical: 12, borderTopWidth: i ? 1 : 0, borderTopColor: colors.hairline }}>
              <View style={{ flexDirection: row, justifyContent: 'space-between', gap: 12 }}>
                <Text size={13} weight={600} style={{ flex: 1 }}>
                  {q}
                </Text>
                <Text size={12} color={colors.muted}>
                  {open === i ? '▴' : '▾'}
                </Text>
              </View>
              {open === i ? (
                <Text size={12} color={colors.muted} lineHeight={1.6} style={{ marginTop: 6 }}>
                  {a}
                </Text>
              ) : null}
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
