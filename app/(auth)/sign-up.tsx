import React, { useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { AuthScreen, AuthSwitch, RevealToggle } from '../../src/components/AuthScreen';
import { Icon } from '../../src/components/Icon';
import { Button, Input, Row, Text } from '../../src/components/ui';
import { useT } from '../../src/i18n';
import { useSession, type AuthError } from '../../src/state/session';
import { colors, radius } from '../../src/theme';

/** Buyer sign-up. The seller flow at `sell.tsx` reuses the same fields. */
export default function SignUp() {
  const { next } = useLocalSearchParams<{ next?: string }>();
  const { t } = useT();
  const { signUp, busy } = useSession();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [reveal, setReveal] = useState(false);
  const [error, setError] = useState<AuthError | null>(null);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  const submit = async () => {
    setError(null);
    const { error: failure, needsConfirmation } = await signUp({
      fullName,
      email,
      password,
      confirmPassword,
    });
    if (failure) {
      setError(failure);
      return;
    }
    // With email confirmation on (the Supabase default) sign-up returns no
    // session, so send them to confirm rather than into a half-signed-in app.
    if (needsConfirmation) {
      setAwaitingConfirmation(true);
      return;
    }
    router.replace((next as never) ?? ('/onboarding' as never));
  };

  const fieldError = (field: AuthError['field']) =>
    error && error.field === field ? t[error.messageKey] : null;
  const formError = error && !error.field ? t[error.messageKey] : null;

  if (awaitingConfirmation) {
    return (
      <AuthScreen title={t.confirmEmailTitle} subtitle={t.confirmEmailSub}>
        <Row
          style={{
            gap: 12,
            padding: 14,
            borderRadius: radius['2xl'],
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.borderSoft,
          }}
        >
          <Icon name="info" size={20} color={colors.red} />
          <Text size={13} weight={600} style={{ flex: 1 }}>
            {email}
          </Text>
        </Row>
        <Button title={t.backToSignIn} onPress={() => router.replace('/(auth)/sign-in')} />
      </AuthScreen>
    );
  }

  return (
    <AuthScreen
      title={t.signUpTitle}
      subtitle={t.signUpSub}
      onBack={() => router.back()}
      footer={
        <View style={{ gap: 16 }}>
          <AuthSwitch prompt={t.haveAccount} action={t.signIn} href="/(auth)/sign-in" />
          <AuthSwitch prompt={t.sellerCta} action={t.sellerCtaAction} href="/(auth)/sell" />
        </View>
      }
    >
      <Input
        label={t.fullNameLabel}
        value={fullName}
        onChangeText={setFullName}
        placeholder={t.fullNamePh}
        error={fieldError('fullName')}
        autoCapitalize="words"
        textContentType="name"
        autoComplete="name"
      />

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
      />

      <Input
        label={t.passwordLabel}
        value={password}
        onChangeText={setPassword}
        placeholder={t.passwordPh}
        error={fieldError('password')}
        secureTextEntry={!reveal}
        autoCapitalize="none"
        textContentType="newPassword"
        autoComplete="new-password"
        trailing={<RevealToggle shown={reveal} onToggle={() => setReveal((prev) => !prev)} />}
      />

      <Input
        label={t.confirmPasswordLabel}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry={!reveal}
        autoCapitalize="none"
        textContentType="newPassword"
        autoComplete="new-password"
        returnKeyType="go"
        onSubmitEditing={submit}
      />

      {formError ? (
        <Text size={12} weight={600} color={colors.red}>
          {formError}
        </Text>
      ) : null}

      <Button title={t.signUp} onPress={submit} disabled={busy} style={{ marginTop: 4 }} />
    </AuthScreen>
  );
}
