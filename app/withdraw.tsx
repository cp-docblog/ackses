import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';

import { SettingsSheet } from '../src/components/SettingsSheet';
import { Badge, Card, Input, Row, SectionLabel, Text } from '../src/components/ui';
import { useT } from '../src/i18n';
import { formatIqd } from '../src/lib/format';
import { usePayouts, useRequestPayout, useSeller } from '../src/hooks/queries';
import { useMySellerId } from '../src/hooks/useMyShop';
import { SELLER_BALANCE } from '../src/data/fixtures';
import { colors } from '../src/theme';

/** Request a payout of the available balance. */
export default function Withdraw() {
  const { t } = useT();
  const sellerId = useMySellerId();
  const { data: seller } = useSeller(sellerId);
  const { data: payouts } = usePayouts(sellerId);
  const request = useRequestPayout(sellerId);

  // Balance is the seeded figure until a ledger exists; pending payouts count against it.
  const pending = (payouts ?? []).filter((p) => p.status === 'pending').reduce((s, p) => s + p.amountIqd, 0);
  const available = Math.max(0, SELLER_BALANCE.availableIqd - pending);

  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (!seller?.payoutMethod) return setError(t.setPayoutFirst);
    const value = Number(amount.replace(/[^\d]/g, ''));
    if (!value || value > available) return setError(t.requiredField);
    setError(null);
    await request.mutateAsync({ amountIqd: value, method: seller.payoutMethod });
    setDone(true);
    setTimeout(() => router.back(), 700);
  };

  const tone = { pending: [colors.warnBg, colors.red, t.payoutPending], paid: [colors.successBg, colors.successBorder, t.payoutPaid], rejected: [colors.track, colors.trackBorder, t.payoutRejected] } as const;

  return (
    <SettingsSheet title={t.withdrawTitle} subtitle={t.withdrawSub} onSave={submit} saving={request.isPending} saved={done} saveLabel={done ? t.payoutRequested : t.requestPayout} error={error ?? (request.error ? t.authGeneric : null)}>
      <Card style={{ padding: 14 }}>
        <Text size={11} weight={600} color={colors.muted} letterSpacing={2}>
          {t.balance}
        </Text>
        <Row gap={6} style={{ alignItems: 'baseline', marginTop: 4 }}>
          <Text size={26} weight={800}>
            {formatIqd(available)}
          </Text>
          <Text size={12} weight={600} color={colors.muted}>
            {t.iqd}
          </Text>
        </Row>
        <Text size={11} color={colors.muted} style={{ marginTop: 4 }}>
          {t.payoutMethod}: {seller?.payoutMethod ? `${seller.payoutMethod.kind === 'zaincash' ? t.payoutZain : seller.payoutMethod.kind === 'bank' ? t.payoutBank : t.payoutCash} · ${seller.payoutMethod.account || seller.payoutMethod.holder}` : '—'}
        </Text>
      </Card>
      <View>
        <Input label={t.amountLabel} value={amount} onChangeText={setAmount} keyboardType="number-pad" placeholder={formatIqd(available)} />
        <Pressable accessibilityRole="button" onPress={() => setAmount(String(available))} hitSlop={8} style={{ alignSelf: 'flex-start', marginTop: 8 }}>
          <Text size={12} weight={600} color={colors.red}>
            {t.withdrawAll}
          </Text>
        </Pressable>
      </View>
      {!seller?.payoutMethod ? (
        <Pressable accessibilityRole="button" onPress={() => router.replace('/payout-method')}>
          <Text size={12} weight={600} color={colors.red}>
            {t.setPayoutFirst} ›
          </Text>
        </Pressable>
      ) : null}
      <View>
        <SectionLabel>{t.payoutHistory}</SectionLabel>
        <View style={{ marginTop: 8, gap: 8 }}>
          {(payouts ?? []).map((p) => (
            <Card key={p.id} style={{ paddingVertical: 10, paddingHorizontal: 14 }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Text size={13} weight={700}>
                  {formatIqd(p.amountIqd)} {t.iqd}
                </Text>
                <Badge label={tone[p.status][2]} height={22} background={tone[p.status][0]} border={tone[p.status][1]} />
              </Row>
              <Text size={11} color={colors.muted} style={{ marginTop: 2 }}>
                {new Date(p.createdAt).toLocaleDateString('en-GB')}
              </Text>
            </Card>
          ))}
          {payouts?.length === 0 ? (
            <Text size={12} color={colors.muted}>
              {t.noPayouts}
            </Text>
          ) : null}
        </View>
      </View>
    </SettingsSheet>
  );
}
