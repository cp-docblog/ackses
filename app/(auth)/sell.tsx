import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';

import { AuthScreen, AuthSwitch, RevealToggle } from '../../src/components/AuthScreen';
import { Icon } from '../../src/components/Icon';
import { Button, Chip, Input, Row, SectionLabel, Text } from '../../src/components/ui';
import { useT } from '../../src/i18n';
import { useSession, type AuthError } from '../../src/state/session';
import { useStore } from '../../src/state/store';
import { colors, radius } from '../../src/theme';

/** City list, matching the filter sheet's options. */
const CITIES: { en: string; ar: string }[] = [
  { en: 'Baghdad', ar: 'بغداد' },
  { en: 'Erbil', ar: 'أربيل' },
  { en: 'Basra', ar: 'البصرة' },
  { en: 'Mosul', ar: 'الموصل' },
  { en: 'Najaf', ar: 'النجف' },
];

/**
 * Seller sign-up: create the account, then set up the shop.
 *
 * An account that already exists skips straight to the shop step, so someone
 * who signed up as a buyer and later taps "Open a shop" is not asked to
 * register twice.
 */
export default function Sell() {
  const { t, lang, isRTL } = useT();
  const { signUp, createShop, busy, user } = useSession();
  const { setRole } = useStore();

  // Start on shop setup when there is already a signed-in account.
  const [step, setStep] = useState<'account' | 'shop'>(user ? 'shop' : 'account');
  const [error, setError] = useState<AuthError | null>(null);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  // Account step
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [reveal, setReveal] = useState(false);

  // Shop step
  const [shopNameEn, setShopNameEn] = useState('');
  const [shopNameAr, setShopNameAr] = useState('');
  const [cityIndex, setCityIndex] = useState(0);
  const [address, setAddress] = useState('');

  const fieldError = (field: AuthError['field']) =>
    error && error.field === field ? t[error.messageKey] : null;
  const formError = error && !error.field ? t[error.messageKey] : null;

  const submitAccount = async () => {
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
    // Shop rows need an authenticated session to satisfy RLS, so when the
    // project asks for email confirmation we stop here rather than failing
    // the insert a step later.
    if (needsConfirmation) {
      setAwaitingConfirmation(true);
      return;
    }
    setStep('shop');
  };

  const submitShop = async () => {
    setError(null);
    const city = CITIES[cityIndex];
    const failure = await createShop({
      nameEn: shopNameEn,
      nameAr: shopNameAr,
      cityEn: city.en,
      cityAr: city.ar,
      address,
    });
    if (failure) {
      setError(failure);
      return;
    }
    setRole('seller');
    router.replace('/(seller)/shop');
  };

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

  if (step === 'shop') {
    return (
      <AuthScreen
        title={t.shopSetupTitle}
        subtitle={t.shopSetupSub}
        onBack={user ? () => router.back() : () => setStep('account')}
      >
        <Input
          label={t.shopNameEnLabel}
          value={shopNameEn}
          onChangeText={setShopNameEn}
          placeholder={t.shopNameEnPh}
          error={fieldError('shopName')}
          autoCapitalize="words"
        />

        <Input
          label={t.shopNameArLabel}
          value={shopNameAr}
          onChangeText={setShopNameAr}
          placeholder={t.shopNameArPh}
        />

        <View>
          <SectionLabel>{t.shopCityLabel}</SectionLabel>
          <View
            style={{
              flexDirection: isRTL ? 'row-reverse' : 'row',
              flexWrap: 'wrap',
              gap: 8,
              marginTop: 8,
            }}
          >
            {CITIES.map((city, index) => (
              <Chip
                key={city.en}
                label={lang === 'ar' ? city.ar : city.en}
                selected={cityIndex === index}
                onPress={() => setCityIndex(index)}
              />
            ))}
          </View>
        </View>

        <Input
          label={t.shopAddressLabel}
          value={address}
          onChangeText={setAddress}
          placeholder={t.shopAddressPh}
          returnKeyType="go"
          onSubmitEditing={submitShop}
        />

        {formError ? (
          <Text size={12} weight={600} color={colors.red}>
            {formError}
          </Text>
        ) : null}

        <Button title={t.openYourShop} onPress={submitShop} disabled={busy} style={{ marginTop: 4 }} />

        <Button
          title={t.createShopLater}
          variant="ghost"
          size="md"
          style={{ backgroundColor: 'transparent' }}
          onPress={() => router.replace('/(buyer)')}
        />
      </AuthScreen>
    );
  }

  return (
    <AuthScreen
      title={t.sellTitle}
      subtitle={t.sellSub}
      onBack={() => router.back()}
      footer={
        <View style={{ gap: 16 }}>
          <AuthSwitch prompt={t.haveAccount} action={t.signIn} href="/(auth)/sign-in" />
          <AuthSwitch prompt={t.buyerCta} action={t.signUp} href="/(auth)/sign-up" />
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
        onSubmitEditing={submitAccount}
      />

      {formError ? (
        <Text size={12} weight={600} color={colors.red}>
          {formError}
        </Text>
      ) : null}

      <Button title={t.next} onPress={submitAccount} disabled={busy} style={{ marginTop: 4 }} />
    </AuthScreen>
  );
}
