import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { ONBOARDED_KEY } from './index';
import { Icon } from '../src/components/Icon';
import { LanguageToggle, Logo } from '../src/components/chrome';
import { Button, Chip, HScroll, Row, SectionLabel, Text } from '../src/components/ui';
import { useT } from '../src/i18n';
import { vehicleLabel } from '../src/lib/format';
import { useStore } from '../src/state/store';
import { MAKES, MODELS, YEARS } from '../src/data/types';
import { colors, radius } from '../src/theme';

/** 01 · Onboarding — my car. */
export default function Onboarding() {
  const { t, row } = useT();
  const insets = useSafeAreaInsets();
  const { vehicle, setVehicle } = useStore();

  const [make, setMake] = useState(vehicle?.make ?? 'Toyota');
  const [model, setModel] = useState(vehicle?.model ?? 'Camry');
  const [year, setYear] = useState(vehicle?.year ?? 2018);

  const models = MODELS[make] ?? [];

  const pickMake = (next: string) => {
    setMake(next);
    setModel(MODELS[next][0]);
  };

  const commit = async () => {
    setVehicle({ id: vehicle?.id ?? 'primary', make, model, year, vin: vehicle?.vin ?? null });
    await AsyncStorage.setItem(ONBOARDED_KEY, 'true').catch(() => {});
    router.replace('/(buyer)');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.black, paddingTop: insets.top + 20 }}>
      {/* Red glow bleeding off the bottom-end corner, as in the design. */}
      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          bottom: -160,
          right: -120,
          width: 420,
          height: 420,
          borderRadius: 210,
          backgroundColor: 'rgba(227,6,19,.16)',
        }}
      />

      <Row style={{ paddingHorizontal: 20, justifyContent: 'space-between' }}>
        <Logo />
        <LanguageToggle />
      </Row>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <Text size={26} weight={700} lineHeight={1.2} style={{ marginTop: 36 }}>
          {t.onbTitle}
        </Text>
        <Text size={14} color={colors.muted} lineHeight={1.5} style={{ marginTop: 8 }}>
          {t.onbSub}
        </Text>

        <SectionLabel style={{ marginTop: 26 }}>{t.make}</SectionLabel>
        <View style={{ flexDirection: row, flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
          {MAKES.map((entry) => (
            <Chip
              key={entry}
              label={entry}
              height={48}
              selected={entry === make}
              onPress={() => pickMake(entry)}
              style={{ width: '31.5%', borderRadius: radius.lg }}
            />
          ))}
        </View>

        <SectionLabel style={{ marginTop: 20 }}>{t.model}</SectionLabel>
        <View style={{ flexDirection: row, flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
          {models.map((entry) => (
            <Chip key={entry} label={entry} height={40} selected={entry === model} onPress={() => setModel(entry)} />
          ))}
        </View>

        <SectionLabel style={{ marginTop: 20 }}>{t.year}</SectionLabel>
        <HScroll paddingHorizontal={0} style={{ marginTop: 10, marginHorizontal: -20, paddingHorizontal: 20 }}>
          {YEARS.map((entry) => (
            <Chip
              key={entry}
              label={String(entry)}
              height={40}
              selected={entry === year}
              onPress={() => setYear(entry)}
              style={{ width: 64 }}
            />
          ))}
        </HScroll>

        <Row style={{ marginTop: 22, gap: 12 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
          <Text size={12} color={colors.muted}>
            {t.or}
          </Text>
          <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
        </Row>

        <Button
          title={t.vinCta}
          variant="ghost"
          size="md"
          icon={<Icon name="vin" size={18} color={colors.red} />}
          style={{ marginTop: 14 }}
          onPress={() => router.push('/vin')}
        />
      </ScrollView>

      <Row
        style={{
          paddingHorizontal: 20,
          paddingBottom: Math.max(insets.bottom, 20),
          paddingTop: 12,
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <Text size={13} color={colors.muted} style={{ flex: 1 }}>
          {vehicleLabel({ make, model, year })}
        </Text>
        <Button title={t.continue} onPress={commit} style={{ paddingHorizontal: 28 }} />
      </Row>
    </View>
  );
}
