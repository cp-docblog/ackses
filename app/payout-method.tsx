import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';

import { SettingsSheet } from '../src/components/SettingsSheet';
import { Chip, Input, SectionLabel } from '../src/components/ui';
import { useT } from '../src/i18n';
import { useSeller, useUpdateSellerContact } from '../src/hooks/queries';
import { useMySellerId } from '../src/hooks/useMyShop';
import type { PayoutMethod } from '../src/data/types';

export default function PayoutMethodScreen() {
  const { t, isRTL } = useT();
  const sellerId = useMySellerId();
  const { data: seller } = useSeller(sellerId);
  const update = useUpdateSellerContact(sellerId);

  const kinds: { key: PayoutMethod['kind']; label: string }[] = [
    { key: 'zaincash', label: t.payoutZain },
    { key: 'bank', label: t.payoutBank },
    { key: 'cash', label: t.payoutCash },
  ];
  const [kind, setKind] = useState<PayoutMethod['kind']>('zaincash');
  const [account, setAccount] = useState('');
  const [holder, setHolder] = useState('');
  const [errors, setErrors] = useState<{ account?: string; holder?: string }>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!seller?.payoutMethod) return;
    setKind(seller.payoutMethod.kind);
    setAccount(seller.payoutMethod.account);
    setHolder(seller.payoutMethod.holder);
  }, [seller]);

  const save = async () => {
    const next: typeof errors = {};
    if (kind !== 'cash' && !account.trim()) next.account = t.requiredField;
    if (!holder.trim()) next.holder = t.requiredField;
    setErrors(next);
    if (Object.keys(next).length) return;
    await update.mutateAsync({ payoutMethod: { kind, account: account.trim(), holder: holder.trim() } });
    setSaved(true);
    setTimeout(() => router.back(), 500);
  };

  return (
    <SettingsSheet title={t.payoutMethod} subtitle={t.payoutMethodSub} onSave={save} saving={update.isPending} saved={saved} error={update.error ? t.authGeneric : null}>
      <View>
        <SectionLabel>{t.payment}</SectionLabel>
        <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
          {kinds.map((k) => (
            <Chip key={k.key} label={k.label} selected={kind === k.key} onPress={() => setKind(k.key)} />
          ))}
        </View>
      </View>
      {kind !== 'cash' ? <Input label={t.payoutAccountLabel} value={account} onChangeText={setAccount} error={errors.account} keyboardType={kind === 'zaincash' ? 'phone-pad' : 'default'} autoCapitalize="none" /> : null}
      <Input label={t.payoutHolderLabel} value={holder} onChangeText={setHolder} error={errors.holder} autoCapitalize="words" />
    </SettingsSheet>
  );
}
