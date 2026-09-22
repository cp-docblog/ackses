import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';

import { CITIES } from '../src/components/OptionSheet';
import { SettingsSheet, normalizeIraqiPhone } from '../src/components/SettingsSheet';
import { Chip, Input, SectionLabel } from '../src/components/ui';
import { useT } from '../src/i18n';
import { useProfile, useUpdateProfile } from '../src/hooks/queries';
import { pick } from '../src/lib/format';

export default function EditProfile() {
  const { t, lang, isRTL } = useT();
  const { data: profile } = useProfile();
  const update = useUpdateProfile();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [cityIndex, setCityIndex] = useState(0);
  const [errors, setErrors] = useState<{ fullName?: string; phone?: string }>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.fullName);
    setPhone(profile.phone ?? '');
    const idx = CITIES.findIndex((c) => c.en === profile.city.en);
    setCityIndex(idx >= 0 ? idx : 0);
  }, [profile]);

  const save = async () => {
    const next: typeof errors = {};
    if (!fullName.trim()) next.fullName = t.requiredField;
    const normalized = phone.trim() ? normalizeIraqiPhone(phone) : null;
    if (phone.trim() && !normalized) next.phone = t.invalidPhone;
    setErrors(next);
    if (Object.keys(next).length) return;
    await update.mutateAsync({ fullName: fullName.trim(), phone: normalized, city: CITIES[cityIndex] });
    setSaved(true);
    setTimeout(() => router.back(), 500);
  };

  return (
    <SettingsSheet title={t.editProfile} onSave={save} saving={update.isPending} saved={saved} error={update.error ? t.authGeneric : null}>
      <Input label={t.fullNameLabel} value={fullName} onChangeText={setFullName} placeholder={t.fullNamePh} error={errors.fullName} autoCapitalize="words" />
      <Input label={t.phoneLabel} value={phone} onChangeText={setPhone} placeholder={t.phonePh} error={errors.phone} keyboardType="phone-pad" />
      <View>
        <SectionLabel>{t.cityLabel}</SectionLabel>
        <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
          {CITIES.map((city, index) => (
            <Chip key={city.en} label={pick(city, lang)} selected={cityIndex === index} onPress={() => setCityIndex(index)} />
          ))}
        </View>
      </View>
    </SettingsSheet>
  );
}
