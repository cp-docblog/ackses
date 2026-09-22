import React, { useState } from 'react';
import { TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { SettingsSheet } from '../src/components/SettingsSheet';
import { Chip, SectionLabel, Text } from '../src/components/ui';
import { useT } from '../src/i18n';
import { useCreateReport } from '../src/hooks/queries';
import { useAuthGate } from '../src/hooks/useAuthGate';
import { colors, radius } from '../src/theme';

export default function ReportSeller() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, font, isRTL } = useT();
  const { require } = useAuthGate();
  const report = useCreateReport();
  const [reason, setReason] = useState<number | null>(null);
  const [details, setDetails] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = () =>
    require(
      async () => {
        if (reason === null) return setError(t.requiredField);
        setError(null);
        await report.mutateAsync({ sellerId: id ?? '', reason: t.reportReasons[reason], details: details.trim() });
        setSent(true);
        setTimeout(() => router.back(), 900);
      },
      { reason: 'signInToSave', next: `/seller/${id}` },
    );

  return (
    <SettingsSheet title={t.reportTitle} subtitle={t.reportSub} onSave={submit} saving={report.isPending} saved={sent} saveLabel={sent ? t.reportSent : t.sendReport} error={error ?? (report.error ? t.authGeneric : null)}>
      <View>
        <SectionLabel>{t.category}</SectionLabel>
        <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
          {t.reportReasons.map((label, index) => (
            <Chip key={label} label={label} selected={reason === index} onPress={() => setReason(index)} />
          ))}
        </View>
      </View>
      <View style={{ minHeight: 100, borderRadius: radius.lg, backgroundColor: colors.black, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 12 }}>
        <TextInput value={details} onChangeText={setDetails} multiline placeholder={t.reportDetailsPh} placeholderTextColor={colors.muted} style={{ color: colors.white, fontFamily: font(400), fontSize: 13, textAlign: isRTL ? 'right' : 'left', minHeight: 76, padding: 0 }} />
      </View>
      {sent ? (
        <Text size={12} weight={600} color={colors.red}>
          {t.reportSent}
        </Text>
      ) : null}
    </SettingsSheet>
  );
}
