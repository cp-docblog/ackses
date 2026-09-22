import React from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useT } from '../i18n';
import { colors } from '../theme';
import { RoundButton, SheetSurface } from './chrome';
import { Button, Row, Text } from './ui';

/**
 * The shared shell for every edit sheet: dimmed backdrop, sheet surface,
 * title row with a close button, scrolling body, and a Save footer that
 * reports busy / saved states the same way everywhere.
 */
export function SettingsSheet({
  title,
  subtitle,
  children,
  onSave,
  saving,
  saved,
  saveLabel,
  error,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onSave?: () => void;
  saving?: boolean;
  saved?: boolean;
  saveLabel?: string;
  error?: string | null;
}) {
  const { t } = useT();
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: 'rgba(0,0,0,.6)' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Pressable style={{ height: insets.top + 40 }} onPress={() => router.back()} />
      <SheetSurface fill>
        <View style={{ paddingHorizontal: 20 }}>
          <Row style={{ justifyContent: 'space-between', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text size={18} weight={700}>
                {title}
              </Text>
              {subtitle ? (
                <Text size={12} color={colors.muted} lineHeight={1.5} style={{ marginTop: 2 }}>
                  {subtitle}
                </Text>
              ) : null}
            </View>
            <RoundButton label={t.cancel} background={colors.surfaceAlt} onPress={() => router.back()}>
              <Text size={18}>×</Text>
            </RoundButton>
          </Row>
        </View>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 20, gap: 16 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {children}
          {error ? (
            <Text size={12} weight={600} color={colors.red}>
              {error}
            </Text>
          ) : null}
        </ScrollView>
        {onSave ? (
          <View style={{ paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.borderSoft }}>
            <Button title={saved ? t.saved : (saveLabel ?? t.save)} onPress={onSave} disabled={saving} />
          </View>
        ) : null}
      </SheetSurface>
    </KeyboardAvoidingView>
  );
}

/** Iraqi mobiles: +964 7xx xxx xxxx, with or without the plus, spaces or dashes. */
export function normalizeIraqiPhone(raw: string): string | null {
  const digits = raw.replace(/[^\d]/g, '');
  const local = digits.startsWith('964') ? digits.slice(3) : digits.startsWith('0') ? digits.slice(1) : digits;
  if (!/^7\d{9}$/.test(local)) return null;
  return `+964${local}`;
}
