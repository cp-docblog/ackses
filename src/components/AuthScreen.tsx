import React from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useT } from '../i18n';
import { useSession } from '../state/session';
import { colors, radius } from '../theme';
import { Icon } from './Icon';
import { BackChevron, LanguageToggle, Logo, RoundButton } from './chrome';
import { Row, Text } from './ui';

/**
 * Shared chrome for the four auth screens: the red corner glow and wordmark
 * from onboarding, the language toggle, and a keyboard-aware scroll body.
 */
export function AuthScreen({
  title,
  subtitle,
  children,
  footer,
  onBack,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onBack?: () => void;
}) {
  const { t } = useT();
  const insets = useSafeAreaInsets();
  const { isReal } = useSession();

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.black }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
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

      <Row
        style={{
          paddingHorizontal: 20,
          paddingTop: insets.top + 12,
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <Row gap={10}>
          {onBack ? (
            <RoundButton label={t.back} onPress={onBack}>
              <BackChevron />
            </RoundButton>
          ) : null}
          <Logo size={22} />
        </Row>
        <LanguageToggle />
      </Row>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 32,
          paddingBottom: Math.max(insets.bottom, 20) + 20,
          flexGrow: 1,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text size={26} weight={700} lineHeight={1.2}>
          {title}
        </Text>
        <Text size={14} color={colors.muted} lineHeight={1.5} style={{ marginTop: 8 }}>
          {subtitle}
        </Text>

        {/* Running on fixtures: say so, rather than implying a real account. */}
        {!isReal ? (
          <Row
            style={{
              marginTop: 18,
              gap: 8,
              paddingVertical: 10,
              paddingHorizontal: 12,
              borderRadius: radius.lg,
              backgroundColor: colors.surfaceAlt,
              borderWidth: 1,
              borderColor: colors.borderSoft,
            }}
          >
            <Icon name="info" size={16} color={colors.muted} />
            <Text size={11} weight={600} color={colors.muted} style={{ flex: 1 }}>
              {t.demoAuthNotice}
            </Text>
          </Row>
        ) : null}

        <View style={{ marginTop: 26, gap: 16 }}>{children}</View>

        <View style={{ flex: 1 }} />

        {footer ? <View style={{ marginTop: 28 }}>{footer}</View> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/** `New to ACKSES?  Create account` — the cross-link under each form. */
export function AuthSwitch({
  prompt,
  action,
  href,
}: {
  prompt: string;
  action: string;
  href: string;
}) {
  return (
    <Row style={{ justifyContent: 'center', gap: 6 }}>
      <Text size={13} color={colors.muted}>
        {prompt}
      </Text>
      <Pressable accessibilityRole="link" onPress={() => router.replace(href as never)} hitSlop={8}>
        <Text size={13} weight={700} color={colors.red}>
          {action}
        </Text>
      </Pressable>
    </Row>
  );
}

/** Reveal/hide control for password fields. */
export function RevealToggle({ shown, onToggle }: { shown: boolean; onToggle: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onToggle} hitSlop={8}>
      <Text size={11} weight={700} color={colors.muted}>
        {shown ? '••' : 'ABC'}
      </Text>
    </Pressable>
  );
}
