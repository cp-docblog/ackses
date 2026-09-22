import React from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PreviewBanner, useComingSoon } from '../src/components/ComingSoon';
import { Icon } from '../src/components/Icon';
import { Logo, RoundButton, SheetSurface } from '../src/components/chrome';
import { Button, PhotoPlaceholder, Row, Text } from '../src/components/ui';
import { useT } from '../src/i18n';
import { colors, mono, radius } from '../src/theme';

/** The 13 characters the design shows as already entered. */
const SAMPLE_VIN = '4T1B11HK5JU12';
const VIN_LENGTH = 17;

/**
 * 01b · VIN / chassis lookup.
 *
 * Preview only: decoding a VIN needs a vehicle database we have not wired up,
 * so every control here opens the Coming Soon dialog, which offers to fall
 * back to picking the car by make/model/year.
 */
export default function VinLookup() {
  const { t, row } = useT();
  const insets = useSafeAreaInsets();
  const { show } = useComingSoon();

  const chars = SAMPLE_VIN.padEnd(VIN_LENGTH, ' ').split('');

  const notYet = () =>
    show('vin', {
      secondaryLabel: t.pickByCar,
      onSecondary: () => router.replace('/onboarding'),
    });

  return (
    <View style={{ flex: 1, backgroundColor: colors.black }}>
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 20 }}>
        <Logo dim />
      </View>
      <PreviewBanner label={`${t.comingSoonBadge} · ${t.vinTitle}`} />

      <SheetSurface style={{ paddingHorizontal: 20 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Text size={18} weight={700}>
            {t.vinTitle}
          </Text>
          <RoundButton label={t.cancel} background={colors.surfaceAlt} onPress={() => router.back()}>
            <Text size={18}>×</Text>
          </RoundButton>
        </Row>
        <Text size={13} color={colors.muted} lineHeight={1.5} style={{ marginTop: 4 }}>
          {t.vinSub}
        </Text>

        {/* VIN is always read left-to-right, whatever the UI language. */}
        <View style={{ flexDirection: 'row', gap: 3, marginTop: 18 }}>
          {chars.map((char, index) => (
            <View
              key={index}
              style={{
                flex: 1,
                height: 40,
                borderRadius: radius.sm,
                backgroundColor: colors.black,
                borderWidth: 1,
                borderColor: index < SAMPLE_VIN.length ? '#555' : colors.red,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text size={13} weight={700} style={{ fontFamily: mono }}>
                {char.trim()}
              </Text>
            </View>
          ))}
        </View>

        <Row style={{ gap: 8, marginTop: 12 }}>
          <Button
            title={t.scanVin}
            variant="ghost"
            size="md"
            icon={<Icon name="scan" size={16} />}
            style={{ flex: 1, backgroundColor: colors.black }}
            onPress={notYet}
          />
          <Button
            title={t.pasteVin}
            variant="ghost"
            size="md"
            style={{ flex: 1, backgroundColor: colors.black }}
            onPress={notYet}
          />
        </Row>

        <Pressable onPress={notYet}>
          <Row
            style={{
              marginTop: 18,
              backgroundColor: colors.black,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: radius['2xl'],
              padding: 14,
              gap: 14,
            }}
          >
            <PhotoPlaceholder label="car" style={{ width: 64, height: 48, borderRadius: radius.md }} stripe={6} />
            <View style={{ flex: 1 }}>
              <Text size={11} weight={700} color={colors.red} letterSpacing={2}>
                {t.decoded}
              </Text>
              <Text size={15} weight={700} style={{ marginTop: 2 }}>
                Toyota Camry 2018
              </Text>
              <Text size={12} color={colors.muted}>
                2.5L · XV70 · GCC spec
              </Text>
            </View>
          </Row>
        </Pressable>

        <Button title={t.useCar} style={{ marginTop: 16 }} onPress={notYet} />
      </SheetSurface>
    </View>
  );
}
