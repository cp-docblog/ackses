import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CITIES } from '../src/components/OptionSheet';
import { normalizeIraqiPhone } from '../src/components/SettingsSheet';
import { ScreenHeader } from '../src/components/chrome';
import { Button, Card, Chip, EmptyState, Input, Row, SectionLabel, Text } from '../src/components/ui';
import { useT } from '../src/i18n';
import { pick } from '../src/lib/format';
import { useProfile, useUpdateProfile } from '../src/hooks/queries';
import type { Address } from '../src/data/types';
import { colors } from '../src/theme';

/** Saved delivery addresses; the first one prefills checkout. */
export default function Addresses() {
  const { t, lang, isRTL } = useT();
  const insets = useSafeAreaInsets();
  const { data: profile } = useProfile();
  const update = useUpdateProfile();

  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState('');
  const [line, setLine] = useState('');
  const [phone, setPhone] = useState('');
  const [cityIndex, setCityIndex] = useState(0);
  const [errors, setErrors] = useState<{ label?: string; line?: string; phone?: string }>({});

  const addresses = profile?.addresses ?? [];

  const add = async () => {
    const next: typeof errors = {};
    if (!label.trim()) next.label = t.requiredField;
    if (!line.trim()) next.line = t.requiredField;
    const normalized = normalizeIraqiPhone(phone);
    if (!normalized) next.phone = t.invalidPhone;
    setErrors(next);
    if (Object.keys(next).length || !normalized) return;
    const created: Address = { id: `addr-${Date.now()}`, label: label.trim(), line: line.trim(), city: CITIES[cityIndex], phone: normalized };
    await update.mutateAsync({ addresses: [...addresses, created] });
    setAdding(false);
    setLabel('');
    setLine('');
    setPhone('');
  };

  const remove = (id: string) => update.mutate({ addresses: addresses.filter((a) => a.id !== id) });

  return (
    <View style={{ flex: 1, backgroundColor: colors.black, paddingTop: insets.top + 8 }}>
      <ScreenHeader title={t.addresses} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 10 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {addresses.map((address) => (
          <Card key={address.id} style={{ padding: 14 }}>
            <Row style={{ justifyContent: 'space-between', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text size={14} weight={700}>
                  {address.label}
                </Text>
                <Text size={12} color={colors.muted} lineHeight={1.5} style={{ marginTop: 2 }}>
                  {address.line} · {pick(address.city, lang)}
                </Text>
                <Text size={12} color={colors.muted}>
                  {address.phone}
                </Text>
              </View>
              <Pressable accessibilityRole="button" onPress={() => remove(address.id)} hitSlop={8}>
                <Text size={12} weight={600} color={colors.red}>
                  {t.remove}
                </Text>
              </Pressable>
            </Row>
          </Card>
        ))}
        {!adding && addresses.length === 0 ? <EmptyState message={t.noAddresses} /> : null}

        {adding ? (
          <Card style={{ padding: 14, gap: 14 }}>
            <Input label={t.addressLabelLabel} value={label} onChangeText={setLabel} placeholder={t.addressLabelPh} error={errors.label} autoCapitalize="words" />
            <Input label={t.addressLineLabel} value={line} onChangeText={setLine} placeholder={t.addressLinePh} error={errors.line} />
            <Input label={t.phoneLabel} value={phone} onChangeText={setPhone} placeholder={t.phonePh} error={errors.phone} keyboardType="phone-pad" />
            <View>
              <SectionLabel>{t.cityLabel}</SectionLabel>
              <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                {CITIES.map((city, index) => (
                  <Chip key={city.en} label={pick(city, lang)} selected={cityIndex === index} onPress={() => setCityIndex(index)} />
                ))}
              </View>
            </View>
            <Row gap={10}>
              <Button title={t.cancel} variant="ghost" size="md" style={{ flex: 1 }} onPress={() => setAdding(false)} />
              <Button title={t.save} size="md" style={{ flex: 1 }} onPress={add} disabled={update.isPending} />
            </Row>
          </Card>
        ) : (
          <Button title={`+ ${t.addAddress}`} variant="ghost" size="md" onPress={() => setAdding(true)} />
        )}
      </ScrollView>
    </View>
  );
}
