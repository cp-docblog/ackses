import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { AuthScreen, AuthSwitch, RevealToggle } from '../../src/components/AuthScreen';
import { Button, Input, Row, Text } from '../../src/components/ui';
import { useT } from '../../src/i18n';
import type { GateReason } from '../../src/hooks/useAuthGate';
import { useSession, type AuthError } from '../../src/state/session';
import { colors } from '../../src/theme';

/**
 * Sign in.
 *
 * `next` carries where the user was headed when they hit the gate, so
 * checkout, saving a search and opening a shop all resume where they left off.
 */
export default function SignIn() {
  const { next, reason } = useLocalSearchParams<{ next?: string; reason?: string }>();
  const { t } = useT();
  const { signIn, busy } = useSession();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [reveal, setReveal] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);

  const submit = async () => {
    setError(null);
    const failure = await signIn(email, password);
    if (failure) {
      setError(failure);
      return;
    }
    router.replace((next as never) ?? ('/(buyer)' as never));
  };

  const fieldError = (field: AuthError['field']) =>
    error && error.field === field ? t[error.messageKey] : null;
  const formError = error && !error.field ? t[error.messageKey] : null;

  return (
    <AuthScreen
      title={t.signInTitle}
      subtitle={reason ? t[reason as GateReason] : t.signInSub}
      footer={
        <View style={{ gap: 16 }}>
          <AuthSwitch prompt={t.noAccount} action={t.signUp} href="/(auth)/sign-up" />
          <Row style={{ justifyContent: 'center', gap: 6 }}>
            <Text size={13} color={colors.muted}>
              {t.sellerCta}
            </Text>
            <Pressable
              accessibilityRole="link"
              onPress={() => router.replace('/(auth)/sell')}
              hitSlop={8}
            >
              <Text size={13} weight={700} color={colors.red}>
                {t.sellerCtaAction}
              </Text>
            </Pressable>
          </Row>
        </View>
      }
    >
      <Input
        label={t.emailLabel}
        value={email}
        onChangeText={setEmail}
        placeholder={t.emailPh}
        error={fieldError('email')}
        autoCapitalize="none"
        keyboardType="email-address"
        textContentType="emailAddress"
        autoComplete="email"
        returnKeyType="next"
      />

      <Input
        label={t.passwordLabel}
        value={password}
        onChangeText={setPassword}
        placeholder={t.passwordPh}
        error={fieldError('password')}
        secureTextEntry={!reveal}
        autoCapitalize="none"
        textContentType="password"
        autoComplete="current-password"
        returnKeyType="go"
        onSubmitEditing={submit}
        trailing={<RevealToggle shown={reveal} onToggle={() => setReveal((prev) => !prev)} />}
      />

      <Pressable
        accessibilityRole="link"
        onPress={() => router.push('/(auth)/forgot-password')}
        hitSlop={8}
        style={{ alignSelf: 'flex-start' }}
      >
        <Text size={12} weight={600} color={colors.red}>
          {t.forgotPassword}
        </Text>
      </Pressable>

      {formError ? (
        <Text size={12} weight={600} color={colors.red}>
          {formError}
        </Text>
      ) : null}

      <Button title={t.signIn} onPress={submit} disabled={busy} style={{ marginTop: 4 }} />

      <Button
        title={t.continueAsGuest}
        variant="ghost"
        size="md"
        style={{ backgroundColor: 'transparent' }}
        onPress={() => router.replace('/(buyer)')}
      />
    </AuthScreen>
  );
}
