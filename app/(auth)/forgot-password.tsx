import React, { useState } from 'react';
import { router } from 'expo-router';

import { AuthScreen } from '../../src/components/AuthScreen';
import { Button, Input, Text } from '../../src/components/ui';
import { useT } from '../../src/i18n';
import { useSession, type AuthError } from '../../src/state/session';
import { colors } from '../../src/theme';

/**
 * Password reset request.
 *
 * The confirmation is deliberately the same whether or not the address has an
 * account, so this screen cannot be used to enumerate registered emails.
 */
export default function ForgotPassword() {
  const { t } = useT();
  const { sendPasswordReset, busy } = useSession();

  const [email, setEmail] = useState('');
  const [error, setError] = useState<AuthError | null>(null);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    setError(null);
    const failure = await sendPasswordReset(email);
    if (failure) {
      setError(failure);
      return;
    }
    setSent(true);
  };

  if (sent) {
    return (
      <AuthScreen title={t.resetSentTitle} subtitle={t.resetSentSub}>
        <Text size={13} weight={600}>
          {email}
        </Text>
        <Button title={t.backToSignIn} onPress={() => router.replace('/(auth)/sign-in')} />
      </AuthScreen>
    );
  }

  return (
    <AuthScreen title={t.forgotTitle} subtitle={t.forgotSub} onBack={() => router.back()}>
      <Input
        label={t.emailLabel}
        value={email}
        onChangeText={setEmail}
        placeholder={t.emailPh}
        error={error?.field === 'email' ? t[error.messageKey] : null}
        autoCapitalize="none"
        keyboardType="email-address"
        textContentType="emailAddress"
        autoComplete="email"
        returnKeyType="go"
        onSubmitEditing={submit}
      />

      {error && !error.field ? (
        <Text size={12} weight={600} color={colors.red}>
          {t[error.messageKey]}
        </Text>
      ) : null}

      <Button title={t.sendResetLink} onPress={submit} disabled={busy} style={{ marginTop: 4 }} />
    </AuthScreen>
  );
}
