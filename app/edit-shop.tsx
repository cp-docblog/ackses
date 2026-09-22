import React, { useEffect, useState } from 'react';
import { TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { CITIES } from '../src/components/OptionSheet';
import { SettingsSheet, normalizeIraqiPhone } from '../src/components/SettingsSheet';
import { Chip, Input, SectionLabel } from '../src/components/ui';
import { useT } from '../src/i18n';
import { pick } from '../src/lib/format';
import { useShop, useUpdateShop } from '../src/hooks/queries';
import { useMyShopId } from '../src/hooks/useMyShop';
import { colors, radius } from '../src/theme';

export default function EditShop() {
  const { t, lang, font, isRTL } = useT();
  const shopId = useMyShopId();
  const { data: shop } = useShop(shopId);
  const update = useUpdateShop(shopId);

  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [about, setAbout] = useState('');
  const [address, setAddress] = useState('');
  const [hours, setHours] = useState('');
  const [phone, setPhone] = useState('');
  const [fee, setFee] = useState('');
  const [cityIndex, setCityIndex] = useState(0);
  const [errors, setErrors] = useState<{ nameEn?: string; phone?: string }>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!shop) return;
    setNameEn(shop.name.en);
    setNameAr(shop.name.ar);
    setAbout(pick(shop.about, lang));
    setAddress(pick(shop.address, lang));
    setHours(shop.hours);
    setPhone(shop.phone ?? '');
    setFee(String(shop.deliveryFee));
    const idx = CITIES.findIndex((c) => c.en === shop.city.en);
    setCityIndex(idx >= 0 ? idx : 0);
  }, [shop, lang]);

  const save = async () => {
    const next: typeof errors = {};
    if (!nameEn.trim()) next.nameEn = t.requiredField;
    const normalized = phone.trim() ? normalizeIraqiPhone(phone) : null;
    if (phone.trim() && !normalized) next.phone = t.invalidPhone;
    setErrors(next);
    if (Object.keys(next).length) return;
    await update.mutateAsync({
      name: { en: nameEn.trim(), ar: nameAr.trim() || nameEn.trim() },
      about: { en: about.trim(), ar: about.trim() },
      address: { en: address.trim(), ar: address.trim() },
      city: CITIES[cityIndex],
      hours: hours.trim(),
      phone: normalized,
      deliveryFee: Number(fee.replace(/[^\d]/g, '')) || 0,
    });
    setSaved(true);
    setTimeout(() => router.back(), 500);
  };

  return (
    <SettingsSheet title={t.editShopTitle} onSave={save} saving={update.isPending} saved={saved} error={update.error ? t.authGeneric : null}>
      <Input label={t.shopNameEnLabel} value={nameEn} onChangeText={setNameEn} error={errors.nameEn} autoCapitalize="words" />
      <Input label={t.shopNameArLabel} value={nameAr} onChangeText={setNameAr} />
      <View>
        <SectionLabel>{t.shopAboutLabel}</SectionLabel>
        <View style={{ marginTop: 8, minHeight: 80, borderRadius: radius.lg, backgroundColor: colors.black, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 12 }}>
          <TextInput value={about} onChangeText={setAbout} multiline style={{ color: colors.white, fontFamily: font(400), fontSize: 13, textAlign: isRTL ? 'right' : 'left', minHeight: 56, padding: 0 }} />
        </View>
      </View>
      <View>
        <SectionLabel>{t.shopCityLabel}</SectionLabel>
        <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
          {CITIES.map((city, index) => (
            <Chip key={city.en} label={pick(city, lang)} selected={cityIndex === index} onPress={() => setCityIndex(index)} />
          ))}
        </View>
      </View>
      <Input label={t.shopAddressLabel} value={address} onChangeText={setAddress} placeholder={t.shopAddressPh} />
      <Input label={t.shopHoursLabel} value={hours} onChangeText={setHours} placeholder="9:00 – 21:00" />
      <Input label={t.shopPhoneLabel} value={phone} onChangeText={setPhone} placeholder={t.phonePh} error={errors.phone} keyboardType="phone-pad" />
      <Input label={t.deliveryFeeLabel} value={fee} onChangeText={setFee} keyboardType="number-pad" />
    </SettingsSheet>
  );
}
