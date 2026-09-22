import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '../src/components/Icon';
import { OptionSheet } from '../src/components/OptionSheet';
import { RoundButton, SheetSurface } from '../src/components/chrome';
import { Button, Field, PhotoPlaceholder, Row, SectionLabel, Segmented, Text } from '../src/components/ui';
import { useT } from '../src/i18n';
import { useCreateProduct, useProduct, useUpdateProduct } from '../src/hooks/queries';
import { useMyShopId } from '../src/hooks/useMyShop';
import { useStore } from '../src/state/store';
import { MAKES, MODELS, YEARS, type BulkTier, type Condition } from '../src/data/types';
import { colors, mono, radius } from '../src/theme';

const CONDITIONS: Condition[] = ['new', 'used', 'refurbished'];

/** S3 · Add / edit product — a three-step sheet that writes for real. */
export default function AddProduct() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { t, row, font, isRTL } = useT();
  const insets = useSafeAreaInsets();
  const shopId = useMyShopId();
  const { vehicle } = useStore();
  const createProduct = useCreateProduct(shopId);
  const updateProduct = useUpdateProduct(shopId);
  const { data: existing } = useProduct(id ?? '', vehicle);
  const editing = !!id;

  const [step, setStep] = useState(0);
  const [images, setImages] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [oem, setOem] = useState('');
  const [brand, setBrand] = useState('');
  const [categoryIndex, setCategoryIndex] = useState(0);
  const [subcategoryIndex, setSubcategoryIndex] = useState<number | null>(null);
  const [conditionIndex, setConditionIndex] = useState(0);
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState(1);
  const [description, setDescription] = useState('');
  const [deliveryIndex, setDeliveryIndex] = useState(0);
  const [fitments, setFitments] = useState<{ make: string; model: string; yearFrom: number; yearTo: number }[]>([]);
  const [tiers, setTiers] = useState<BulkTier[]>([]);
  const [catOpen, setCatOpen] = useState(false);
  const [subOpen, setSubOpen] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; oem?: string; price?: string; photos?: string }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  // Draft vehicle range for step 2.
  const [draftMake, setDraftMake] = useState<string>(MAKES[0]);
  const [draftModel, setDraftModel] = useState<string>(MODELS[MAKES[0]][0]);
  const [draftFrom, setDraftFrom] = useState(2014);
  const [draftTo, setDraftTo] = useState(2019);

  // Edit mode: load the listing into the form once.
  useEffect(() => {
    if (!editing || !existing) return;
    setImages(existing.imageUrls ?? []);
    setName(existing.name.en);
    setOem(existing.oem);
    setBrand(existing.brand);
    setCategoryIndex(existing.categoryIndex);
    setSubcategoryIndex(existing.subcategoryIndex ?? null);
    setConditionIndex(Math.max(0, CONDITIONS.indexOf(existing.condition)));
    setPrice(String(existing.priceIqd));
    setStock(existing.stock);
    setDescription(existing.description ?? '');
    setDeliveryIndex(existing.deliveryOption ?? 0);
    setFitments(existing.fitments);
    setTiers(existing.bulkTiers ?? []);
  }, [editing, existing]);

  const subcats = t.subcats[categoryIndex] ?? [];

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7, allowsMultipleSelection: true, selectionLimit: 4 - images.length });
    if (!result.canceled) setImages((prev) => [...prev, ...result.assets.map((a) => a.uri)].slice(0, 4));
  };

  const validateStep1 = () => {
    const next: typeof errors = {};
    if (!name.trim()) next.name = t.requiredField;
    if (!oem.trim()) next.oem = t.requiredField;
    setErrors(next);
    return Object.keys(next).length === 0;
  };
  const validateStep3 = () => {
    const next: typeof errors = {};
    if (!Number(price.replace(/[^\d]/g, ''))) next.price = t.requiredField;
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const publish = async () => {
    if (!validateStep3()) return;
    setSubmitError(null);
    setStatus(images.some((u) => !/^https?:/.test(u)) ? t.uploadingPhotos : null);
    const input = {
      shopId,
      name: { en: name.trim(), ar: name.trim() },
      oem: oem.trim().toUpperCase(),
      brand: brand.trim(),
      categoryIndex,
      subcategoryIndex,
      condition: CONDITIONS[conditionIndex],
      priceIqd: Number(price.replace(/[^\d]/g, '')) || 0,
      stock,
      description: description.trim(),
      deliveryOptionIndex: deliveryIndex,
      fitments,
      imageUris: images,
      bulkTiers: tiers.filter((tr) => tr.priceIqd > 0).sort((a, b) => a.minQty - b.minQty),
    };
    try {
      if (editing && id) await updateProduct.mutateAsync({ id, input });
      else await createProduct.mutateAsync(input);
      setStatus(editing ? t.productUpdated : t.productPublished);
      setTimeout(() => router.replace('/(seller)/shop'), 600);
    } catch (e) {
      setStatus(null);
      setSubmitError(e instanceof Error && /upload|storage/i.test(e.message) ? t.photoUploadFailed : t.authGeneric);
    }
  };

  const next = () => {
    if (step === 0 && !validateStep1()) return;
    if (step === 2) return publish();
    setStep(step + 1);
  };
  const back = () => (step === 0 ? router.back() : setStep(step - 1));
  const busy = createProduct.isPending || updateProduct.isPending;

  const cycle = <T,>(list: readonly T[], current: T, set: (n: T) => void) => () => set(list[(list.indexOf(current) + 1) % list.length]);

  const fieldBox = (error?: string) => ({
    marginTop: 8,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.black,
    borderWidth: 1,
    borderColor: error ? colors.red : colors.border,
    paddingHorizontal: 14,
    justifyContent: 'center' as const,
  });
  const inputStyle = { color: colors.white, fontFamily: font(500), fontSize: 13, textAlign: isRTL ? ('right' as const) : ('left' as const), padding: 0 };

  return (
    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,.6)' }}>
      <Pressable style={{ height: insets.top + 50 }} onPress={() => router.back()} />
      <SheetSurface fill>
        <View style={{ paddingHorizontal: 20 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Text size={18} weight={700}>
              {editing ? t.edit : t.addProduct}
            </Text>
            <RoundButton label={t.cancel} background={colors.surfaceAlt} onPress={() => router.back()}>
              <Text size={18}>×</Text>
            </RoundButton>
          </Row>
          <Row style={{ gap: 6, marginTop: 14 }}>
            {t.apSteps.map((label, index) => (
              <Pressable key={label} onPress={() => (index < step || (index === 1 && validateStep1()) ? setStep(index) : null)} style={{ flex: 1, gap: 6 }}>
                <View style={{ height: 3, borderRadius: 2, backgroundColor: step >= index ? colors.red : colors.border }} />
                <Text size={11} weight={600} color={step >= index ? colors.white : colors.muted}>
                  {label}
                </Text>
              </Pressable>
            ))}
          </Row>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 20 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {step === 0 ? (
            <>
              <SectionLabel>{t.photos}</SectionLabel>
              <Row style={{ gap: 8, marginTop: 10 }}>
                <Pressable accessibilityRole="button" onPress={pickImage} disabled={images.length >= 4} style={{ flex: 1, aspectRatio: 1, borderRadius: radius.lg, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.red, alignItems: 'center', justifyContent: 'center', gap: 4, opacity: images.length >= 4 ? 0.4 : 1 }}>
                  <Icon name="camera" size={20} color={colors.red} />
                  <Text size={10} weight={600} color={colors.red}>
                    {t.add}
                  </Text>
                </Pressable>
                {[0, 1, 2].map((slot) => {
                  const uri = images[slot];
                  return uri ? (
                    <Pressable key={slot} onPress={() => setImages((prev) => prev.filter((_, i) => i !== slot))} style={{ flex: 1, aspectRatio: 1 }}>
                      <Image source={{ uri }} style={{ width: '100%', height: '100%', borderRadius: radius.lg }} contentFit="cover" />
                      {slot === 0 ? (
                        <View style={{ position: 'absolute', bottom: 4, [isRTL ? 'right' : 'left']: 4, height: 16, paddingHorizontal: 5, borderRadius: 4, backgroundColor: colors.red, justifyContent: 'center' }}>
                          <Text size={8} weight={700}>
                            {t.cover}
                          </Text>
                        </View>
                      ) : null}
                      <View style={{ position: 'absolute', top: 4, [isRTL ? 'left' : 'right']: 4, width: 18, height: 18, borderRadius: 9, backgroundColor: colors.scrim, alignItems: 'center', justifyContent: 'center' }}>
                        <Text size={11}>✕</Text>
                      </View>
                    </Pressable>
                  ) : (
                    <View key={slot} style={{ flex: 1, aspectRatio: 1, borderRadius: radius.lg, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.border }} />
                  );
                })}
              </Row>
              {images.length > 3 ? (
                <Text size={11} color={colors.muted} style={{ marginTop: 6 }}>
                  +{images.length - 3}
                </Text>
              ) : null}

              <SectionLabel style={{ marginTop: 20 }}>{t.partName}</SectionLabel>
              <View style={fieldBox(errors.name)}>
                <TextInput value={name} onChangeText={setName} placeholder={t.samplePartName} placeholderTextColor={colors.mutedDark} style={inputStyle} />
              </View>
              {errors.name ? <Text size={11} color={colors.red} style={{ marginTop: 4 }}>{errors.name}</Text> : null}

              <Row style={{ gap: 8, marginTop: 12, alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <SectionLabel>OEM</SectionLabel>
                  <View style={fieldBox(errors.oem)}>
                    <TextInput value={oem} onChangeText={setOem} autoCapitalize="characters" placeholder="04465-33471" placeholderTextColor={colors.mutedDark} style={{ color: colors.white, fontFamily: mono, fontSize: 13, padding: 0 }} />
                  </View>
                  {errors.oem ? <Text size={11} color={colors.red} style={{ marginTop: 4 }}>{errors.oem}</Text> : null}
                </View>
                <View style={{ flex: 1 }}>
                  <SectionLabel>{t.brand}</SectionLabel>
                  <View style={fieldBox()}>
                    <TextInput value={brand} onChangeText={setBrand} placeholder="Toyota Genuine" placeholderTextColor={colors.mutedDark} style={inputStyle} />
                  </View>
                </View>
              </Row>

              <SectionLabel style={{ marginTop: 16 }}>{t.category}</SectionLabel>
              <Field style={{ marginTop: 8 }} value={`${t.cats[categoryIndex]}${subcategoryIndex !== null && subcats[subcategoryIndex] ? ` › ${subcats[subcategoryIndex]}` : ''}`} trailing={<Text size={13} color={colors.muted}>▾</Text>} onPress={() => setCatOpen(true)} />
              {subcats.length ? (
                <Field style={{ marginTop: 8 }} height={44} value={subcategoryIndex !== null ? subcats[subcategoryIndex] : ''} placeholder={`${t.subcategoryWord} · ${t.none}`} trailing={<Text size={13} color={colors.muted}>▾</Text>} onPress={() => setSubOpen(true)} />
              ) : null}

              <SectionLabel style={{ marginTop: 16 }}>{t.condition}</SectionLabel>
              <View style={{ marginTop: 8 }}>
                <Segmented options={[t.conds[1], t.conds[2], t.refurbished]} selectedIndex={conditionIndex} onSelect={setConditionIndex} />
              </View>
            </>
          ) : null}

          {step === 1 ? (
            <>
              <Row style={{ justifyContent: 'space-between', gap: 12 }}>
                <SectionLabel>{t.compat}</SectionLabel>
                <Text size={11} color={colors.muted}>
                  {t.compatSub}
                </Text>
              </Row>
              <View style={{ gap: 8, marginTop: 10 }}>
                {fitments.map((f, index) => (
                  <Row key={`${f.make}-${f.model}-${index}`} style={{ gap: 12, paddingVertical: 12, paddingHorizontal: 14, borderRadius: radius.xl, backgroundColor: colors.black, borderWidth: 1, borderColor: colors.border }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.red }} />
                    <View style={{ flex: 1 }}>
                      <Text size={13} weight={600}>
                        {f.make} {f.model}
                      </Text>
                      <Text size={11} color={colors.muted} style={{ marginTop: 2 }}>
                        {f.yearFrom} – {f.yearTo}
                      </Text>
                    </View>
                    <Pressable accessibilityRole="button" accessibilityLabel={t.delete} hitSlop={6} onPress={() => setFitments((prev) => prev.filter((_, i) => i !== index))}>
                      <Text size={16} color={colors.muted}>
                        ✕
                      </Text>
                    </Pressable>
                  </Row>
                ))}
              </View>
              <View style={{ marginTop: 14, padding: 14, borderRadius: radius['2xl'], borderWidth: 1, borderStyle: 'dashed', borderColor: colors.border, gap: 8 }}>
                <Text size={12} weight={600} color={colors.muted}>
                  {t.addVehicle}
                </Text>
                <Row gap={8}>
                  <Field style={{ flex: 1 }} height={44} value={draftMake} trailing={<Text color={colors.muted}>▾</Text>} onPress={cycle(MAKES, draftMake, (m) => { setDraftMake(m); setDraftModel(MODELS[m][0]); })} />
                  <Field style={{ flex: 1 }} height={44} value={draftModel} trailing={<Text color={colors.muted}>▾</Text>} onPress={cycle(MODELS[draftMake], draftModel, setDraftModel)} />
                </Row>
                <Row gap={8}>
                  <Field style={{ flex: 1 }} height={44} value={String(draftFrom)} trailing={<Text color={colors.muted}>▾</Text>} onPress={cycle(YEARS, draftFrom, setDraftFrom)} />
                  <Field style={{ flex: 1 }} height={44} value={String(draftTo)} trailing={<Text color={colors.muted}>▾</Text>} onPress={cycle(YEARS, draftTo, setDraftTo)} />
                  <Pressable accessibilityRole="button" accessibilityLabel={t.add} onPress={() => setFitments((prev) => [...prev, { make: draftMake, model: draftModel, yearFrom: Math.min(draftFrom, draftTo), yearTo: Math.max(draftFrom, draftTo) }])} style={{ width: 44, height: 44, borderRadius: radius.lg, backgroundColor: colors.red, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="plus" size={20} />
                  </Pressable>
                </Row>
              </View>
              <Row style={{ marginTop: 14, paddingVertical: 12, paddingHorizontal: 14, borderRadius: radius.xl, backgroundColor: colors.black, borderWidth: 1, borderColor: colors.border, gap: 10, alignItems: 'flex-start' }}>
                <Icon name="info" size={18} color={colors.red} />
                <Text size={12} color={colors.muted} lineHeight={1.5} style={{ flex: 1 }}>
                  {t.compatHint}
                </Text>
              </Row>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <Row style={{ gap: 8, alignItems: 'flex-start' }}>
                <View style={{ flex: 2 }}>
                  <SectionLabel>{t.price}</SectionLabel>
                  <Row style={{ marginTop: 8, height: 52, borderRadius: radius.lg, backgroundColor: colors.black, borderWidth: 1, borderColor: errors.price ? colors.red : colors.red, paddingHorizontal: 14, justifyContent: 'space-between' }}>
                    <TextInput value={price} onChangeText={setPrice} keyboardType="number-pad" placeholder="45000" placeholderTextColor={colors.mutedDark} style={{ flex: 1, color: colors.white, fontFamily: font(800), fontSize: 18, textAlign: isRTL ? 'right' : 'left', padding: 0 }} />
                    <Text size={11} weight={600} color={colors.muted}>
                      {t.iqd}
                    </Text>
                  </Row>
                  {errors.price ? <Text size={11} color={colors.red} style={{ marginTop: 4 }}>{errors.price}</Text> : null}
                </View>
                <View style={{ flex: 1 }}>
                  <SectionLabel>{t.stock}</SectionLabel>
                  <Row style={{ marginTop: 8, height: 52, borderRadius: radius.lg, backgroundColor: colors.black, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 6, justifyContent: 'space-between' }}>
                    <Pressable accessibilityRole="button" accessibilityLabel="-" onPress={() => setStock((p) => Math.max(0, p - 1))} style={{ width: 36, height: 36, borderRadius: radius.md, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
                      <Text size={16}>−</Text>
                    </Pressable>
                    <Text size={16} weight={800}>
                      {stock}
                    </Text>
                    <Pressable accessibilityRole="button" accessibilityLabel="+" onPress={() => setStock((p) => p + 1)} style={{ width: 36, height: 36, borderRadius: radius.md, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
                      <Text size={16}>+</Text>
                    </Pressable>
                  </Row>
                </View>
              </Row>

              <SectionLabel style={{ marginTop: 16 }}>{t.bulk}</SectionLabel>
              <View style={{ marginTop: 8, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, overflow: 'hidden' }}>
                {tiers.map((tier, index) => (
                  <Row key={index} style={{ gap: 8, paddingVertical: 8, paddingHorizontal: 12, backgroundColor: colors.black, borderTopWidth: index ? 1 : 0, borderTopColor: colors.borderSoft }}>
                    <TierNumber value={tier.minQty} onChange={(v) => setTiers((p) => p.map((x, i) => (i === index ? { ...x, minQty: v } : x)))} label={t.tierFrom} />
                    <TierNumber value={tier.maxQty ?? 0} onChange={(v) => setTiers((p) => p.map((x, i) => (i === index ? { ...x, maxQty: v || null } : x)))} label={t.tierTo} />
                    <TierNumber value={tier.priceIqd} onChange={(v) => setTiers((p) => p.map((x, i) => (i === index ? { ...x, priceIqd: v } : x)))} label={t.tierPrice} wide />
                    <Pressable accessibilityRole="button" accessibilityLabel={t.removeTier} hitSlop={6} onPress={() => setTiers((p) => p.filter((_, i) => i !== index))}>
                      <Text size={16} color={colors.muted}>
                        ✕
                      </Text>
                    </Pressable>
                  </Row>
                ))}
                <Pressable accessibilityRole="button" onPress={() => setTiers((p) => [...p, { minQty: (p[p.length - 1]?.maxQty ?? 0) + 1, maxQty: null, priceIqd: Math.round((Number(price.replace(/[^\d]/g, '')) || 0) * 0.9) }])} style={{ height: 44, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.black, borderTopWidth: tiers.length ? 1 : 0, borderTopColor: colors.borderSoft }}>
                  <Text size={12} weight={600} color={colors.red}>
                    + {t.addTier}
                  </Text>
                </Pressable>
              </View>

              <SectionLabel style={{ marginTop: 16 }}>{t.deliveryOpts}</SectionLabel>
              <View style={{ gap: 8, marginTop: 8 }}>
                {t.deliveryList.map(([label, fee], index) => {
                  const selected = deliveryIndex === index;
                  return (
                    <Pressable key={label} accessibilityRole="radio" accessibilityState={{ selected }} onPress={() => setDeliveryIndex(index)} style={{ minHeight: 52, paddingHorizontal: 14, paddingVertical: 10, borderRadius: radius.lg, borderWidth: 1, borderColor: selected ? colors.red : colors.border, backgroundColor: colors.black, flexDirection: row, alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                      <Text size={13} weight={600} style={{ flex: 1 }}>
                        {label} · {fee}
                      </Text>
                      <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: selected ? 6 : 1, borderColor: selected ? colors.red : '#555' }} />
                    </Pressable>
                  );
                })}
              </View>

              <SectionLabel style={{ marginTop: 16 }}>{t.description}</SectionLabel>
              <View style={{ marginTop: 8, minHeight: 80, borderRadius: radius.lg, backgroundColor: colors.black, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 12 }}>
                <TextInput value={description} onChangeText={setDescription} multiline placeholder={t.descPh} placeholderTextColor={colors.muted} style={{ color: colors.white, fontFamily: font(400), fontSize: 13, textAlign: isRTL ? 'right' : 'left', padding: 0, minHeight: 56 }} />
              </View>

              {status ? (
                <Text size={12} weight={600} color={colors.muted} style={{ marginTop: 12 }}>
                  {status}
                </Text>
              ) : null}
              {submitError ? (
                <Text size={12} weight={600} color={colors.red} style={{ marginTop: 8 }}>
                  {submitError}
                </Text>
              ) : null}
            </>
          ) : null}
        </ScrollView>

        <Row style={{ paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.borderSoft, gap: 10 }}>
          <Button title={step === 0 ? t.cancel : t.back} variant="ghost" style={{ flex: 1, backgroundColor: colors.black }} onPress={back} />
          <Button title={step === 2 ? (editing ? t.saveChanges : t.publish) : t.next} style={{ flex: 2 }} disabled={busy} onPress={next} />
        </Row>
      </SheetSurface>

      <OptionSheet
        visible={catOpen}
        title={t.categoryPicker}
        options={t.cats.map((label, index) => ({ key: String(index), label }))}
        value={String(categoryIndex)}
        onSelect={(key) => {
          setCategoryIndex(Number(key));
          setSubcategoryIndex(null);
        }}
        onClose={() => setCatOpen(false)}
      />
      <OptionSheet
        visible={subOpen}
        title={t.subcategoryWord}
        options={[{ key: 'none', label: t.none }, ...subcats.map((label, index) => ({ key: String(index), label }))]}
        value={subcategoryIndex === null ? 'none' : String(subcategoryIndex)}
        onSelect={(key) => setSubcategoryIndex(key === 'none' ? null : Number(key))}
        onClose={() => setSubOpen(false)}
      />
    </View>
  );
}

function TierNumber({ value, onChange, label, wide }: { value: number; onChange: (v: number) => void; label: string; wide?: boolean }) {
  const { font } = useT();
  return (
    <View style={{ flex: wide ? 2 : 1 }}>
      <Text size={9} weight={600} color={colors.muted} letterSpacing={1}>
        {label.toUpperCase()}
      </Text>
      <TextInput
        value={value ? String(value) : ''}
        onChangeText={(txt) => onChange(Number(txt.replace(/[^\d]/g, '')) || 0)}
        keyboardType="number-pad"
        placeholder="—"
        placeholderTextColor={colors.mutedDark}
        style={{ color: colors.white, fontFamily: font(700), fontSize: 13, padding: 0, paddingVertical: 4 }}
      />
    </View>
  );
}

