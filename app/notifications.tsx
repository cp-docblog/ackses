import React from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '../src/components/chrome';
import { Card, Row, Text, Toggle } from '../src/components/ui';
import { useT } from '../src/i18n';
import { useProfile, useUpdateProfile } from '../src/hooks/queries';
import type { NotificationPrefs } from '../src/data/types';
import { colors } from '../src/theme';

/** Notification preferences, shared by buyers and sellers. */
export default function Notifications() {
  const { t } = useT();
  const insets = useSafeAreaInsets();
  const { data: profile } = useProfile();
  const update = useUpdateProfile();
  const prefs = profile?.notificationPrefs ?? { orders: true, alerts: true, marketing: false };

  const set = (key: keyof NotificationPrefs, value: boolean) => update.mutate({ notificationPrefs: { ...prefs, [key]: value } });

  const rows: { key: keyof NotificationPrefs; title: string; sub: string }[] = [
    { key: 'orders', title: t.notifOrders, sub: t.notifOrdersSub },
    { key: 'alerts', title: t.notifAlerts, sub: t.notifAlertsSub },
    { key: 'marketing', title: t.notifMarketing, sub: t.notifMarketingSub },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.black, paddingTop: insets.top + 8 }}>
      <ScreenHeader title={t.notifications} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 8 }}>
        {rows.map((row) => (
          <Card key={row.key} style={{ paddingVertical: 12, paddingHorizontal: 14 }}>
            <Row style={{ justifyContent: 'space-between', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text size={13} weight={600}>
                  {row.title}
                </Text>
                <Text size={11} color={colors.muted} style={{ marginTop: 2 }}>
                  {row.sub}
                </Text>
              </View>
              <Toggle value={prefs[row.key]} onChange={(v) => set(row.key, v)} />
            </Row>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}
