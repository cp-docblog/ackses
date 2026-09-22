import React, { useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '../src/components/Icon';
import { RoundButton, SheetSurface } from '../src/components/chrome';
import {
  Button,
  Field,
  PhotoPlaceholder,
  Row,
  SectionLabel,
  Segmented,
  Text,
} from '../src/components/ui';
import { useT } from '../src/i18n';
import { useCreateProduct } from '../src/hooks/queries';
import { DEMO_SHOP_ID } from '../src/data/repository';
import { MAKES, MODELS, YEARS, type Condition } from '../src/data/types';
import { colors, mono, radius } from '../src/theme';

const CONDITIONS: Condition[] = ['new', 'used', 'refurbished'];

/** S3 · Add product — a three-step sheet. */
export default function AddProduct() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { t, row, font, isRTL } = useT();
  const insets = useSafeAreaInsets();
  const createProduct = useCreateProduct(DEMO_SHOP_ID);

  const [step, setStep] = useState(0);
  const [images, setImages] = useState<string[]>([]);
  const [name, setName] = useState(t.samplePartName);
  const [oem, setOem] = useState('04465-33471');
  const [brand, setBrand] = useState('Toyota Genuine');
  const [conditionIndex, setConditionIndex] = useState(0);
  const [price, setPrice] = useState('45000');
  const [stock, setStock] = useState(12);
  const [description, setDescription] = useState('');
  const [deliveryIndex, setDeliveryIndex] = useState(0);
  const [fitments, setFitments] = useState([
    { make: 'Toyota', model: 'Camry', yearFrom: 2018, yearTo: 2024 },
    { make: 'Lexus', model: 'ES', yearFrom: 2019, yearTo: 2024 },
  ]);

  // Draft vehicle range being composed in step 2.
  const [draftMake, setDraftMake] = useState<string>(MAKES[0]);
  const [draftModel, setDraftModel] = useState<string>(MODELS[MAKES[0]][0]);
  const [draftFrom, setDraftFrom] = useState(2014);
  const [draftTo, setDraftTo] = useState(2019);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsMultipleSelection: true,
      selectionLimit: 4 - images.length,
    });
    if (!result.canceled) setImages((prev) => [...prev, ...result.assets.map((a) => a.uri)].slice(0, 4));
  };

  const publish = async () => {
    await createProduct.mutateAsync({
      shopId: DEMO_SHOP_ID,
      name: { en: name, ar: name },
      oem,
      brand,
      categoryIndex: 0,
      subcategoryIndex: 0,
      condition: CONDITIONS[conditionIndex],
      priceIqd: Number(price.replace(/[^\d]/g, '')) || 0,
      stock,
      description,
      deliveryOptionIndex: deliveryIndex,
      fitments,
      imageUris: images,
    });
    router.replace('/(seller)/shop');
  };

  const next = () => (step === 2 ? publish() : setStep(step + 1));
  const back = () => (step === 0 ? router.back() : setStep(step - 1));

  const cycle = <T,>(list: readonly T[], current: T, set: (next: T) => void) => () => {
    const index = list.indexOf(current);
    set(list[(index + 1) % list.length]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,.6)' }}>
      <Pressable style={{ height: insets.top + 50 }} onPress={() => router.back()} />

      <SheetSurface fill>
        <View style={{ paddingHorizontal: 20 }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Text size={18} weight={700}>
              {id ? t.edit : t.addProduct}
            </Text>
            <RoundButton label={t.cancel} background={colors.surfaceAlt} onPress={() => router.back()}>
              <Text size={18}>×</Text>
            </RoundButton>
          </Row>

          {/* Step indicator */}
          <Row style={{ gap: 6, marginTop: 14 }}>
            {t.apSteps.map((label, index) => (
              <Pressable key={label} onPress={() => setStep(index)} style={{ flex: 1, gap: 6 }}>
                <View
                  style={{
                    height: 3,
                    borderRadius: 2,
                    backgroundColor: step >= index ? colors.red : colors.border,
                  }}
                />
                <Text size={11} weight={600} color={step >= index ? colors.white : colors.muted}>
                  {label}
                </Text>
              </Pressable>
            ))}
          </Row>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Step 1 — details */}
          {step === 0 ? (
            <>
              <SectionLabel>{t.photos}</SectionLabel>
              <Row style={{ gap: 8, marginTop: 10 }}>
                <Pressable
                  accessibilityRole="button"
                  onPress={pickImage}
                  style={{
                    flex: 1,
                    aspectRatio: 1,
                    borderRadius: radius.lg,
                    borderWidth: 1,
                    borderStyle: 'dashed',
                    borderColor: colors.red,
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 4,
                  }}
                >
                  <Icon name="camera" size={20} color={colors.red} />
                  <Text size={10} weight={600} color={colors.red}>
                    {t.add}
                  </Text>
                </Pressable>
                {[0, 1, 2].map((slot) => {
                  const uri = images[slot];
                  if (uri) {
                    return (
                      <View key={slot} style={{ flex: 1, aspectRatio: 1 }}>
                        <Image
                          source={{ uri }}
                          style={{ width: '100%', height: '100%', borderRadius: radius.lg }}
                          contentFit="cover"
                        />
                        {slot === 0 ? (
                          <View
                            style={{
                              position: 'absolute',
                              bottom: 4,
                              [isRTL ? 'right' : 'left']: 4,
                              height: 16,
                              paddingHorizontal: 5,
                              borderRadius: 4,
                              backgroundColor: colors.red,
                              justifyContent: 'center',
                            }}
                          >
                            <Text size={8} weight={700}>
                              {t.cover}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    );
                  }
                  return slot < 2 ? (
                    <PhotoPlaceholder
                      key={slot}
                      stripe={6}
                      style={{ flex: 1, aspectRatio: 1, borderRadius: radius.lg }}
                    />
                  ) : (
                    <View
                      key={slot}
                      style={{
                        flex: 1,
                        aspectRatio: 1,
                        borderRadius: radius.lg,
                        borderWidth: 1,
                        borderStyle: 'dashed',
                        borderColor: colors.border,
                      }}
                    />
                  );
                })}
              </Row>

              <SectionLabel style={{ marginTop: 20 }}>{t.partName}</SectionLabel>
              <View
                style={{
                  marginTop: 8,
                  height: 48,
                  borderRadius: radius.lg,
                  backgroundColor: colors.black,
                  borderWidth: 1,
                  borderColor: colors.border,
                  paddingHorizontal: 14,
                  justifyContent: 'center',
                }}
              >
                <TextInput
                  value={name}
                  onChangeText={setName}
                  style={{
                    color: colors.white,
                    fontFamily: font(500),
                    fontSize: 13,
                    textAlign: isRTL ? 'right' : 'left',
                    padding: 0,
                  }}
                />
              </View>

              <Row style={{ gap: 8, marginTop: 12, alignItems: 'flex-start' }}>
                <View style={{ flex: 1 }}>
                  <SectionLabel>OEM</SectionLabel>
                  <View
                    style={{
                      marginTop: 8,
                      height: 48,
                      borderRadius: radius.lg,
                      backgroundColor: colors.black,
                      borderWidth: 1,
                      borderColor: colors.border,
                      paddingHorizontal: 14,
                      justifyContent: 'center',
                    }}
                  >
                    <TextInput
                      value={oem}
                      onChangeText={setOem}
                      autoCapitalize="characters"
                      style={{ color: colors.white, fontFamily: mono, fontSize: 13, padding: 0 }}
                    />
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <SectionLabel>{t.brand}</SectionLabel>
                  <View
                    style={{
                      marginTop: 8,
                      height: 48,
                      borderRadius: radius.lg,
                      backgroundColor: colors.black,
                      borderWidth: 1,
                      borderColor: colors.border,
                      paddingHorizontal: 14,
                      justifyContent: 'center',
                    }}
                  >
                    <TextInput
                      value={brand}
                      onChangeText={setBrand}
                      style={{
                        color: colors.white,
                        fontFamily: font(500),
                        fontSize: 13,
                        textAlign: isRTL ? 'right' : 'left',
                        padding: 0,
                      }}
                    />
                  </View>
                </View>
              </Row>

              <SectionLabel style={{ marginTop: 16 }}>{t.category}</SectionLabel>
              <Field
                style={{ marginTop: 8 }}
                value={`${t.catBrakes} › ${t.subPads}`}
                trailing={
                  <Text size={13} color={colors.muted}>
                    ▾
                  </Text>
                }
              />

              <SectionLabel style={{ marginTop: 16 }}>{t.condition}</SectionLabel>
              <View style={{ marginTop: 8 }}>
                <Segmented
                  options={[t.conds[1], t.conds[2], t.refurbished]}
                  selectedIndex={conditionIndex}
                  onSelect={setConditionIndex}
                />
              </View>
            </>
          ) : null}

          {/* Step 2 — compatibility */}
          {step === 1 ? (
            <>
              <Row style={{ justifyContent: 'space-between', gap: 12 }}>
                <SectionLabel>{t.compat}</SectionLabel>
                <Text size={11} color={colors.muted}>
                  {t.compatSub}
                </Text>
              </Row>

              <View style={{ gap: 8, marginTop: 10 }}>
                {fitments.map((fitment, index) => (
                  <Row
                    key={`${fitment.make}-${fitment.model}-${index}`}
                    style={{
                      gap: 12,
                      paddingVertical: 12,
                      paddingHorizontal: 14,
                      borderRadius: radius.xl,
                      backgroundColor: colors.black,
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.red }} />
                    <View style={{ flex: 1 }}>
                      <Text size={13} weight={600}>
                        {fitment.make} {fitment.model}
                      </Text>
                      <Text size={11} color={colors.muted} style={{ marginTop: 2 }}>
                        {fitment.yearFrom} – {fitment.yearTo}
                      </Text>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={t.delete}
                      hitSlop={6}
                      onPress={() => setFitments((prev) => prev.filter((_, i) => i !== index))}
                    >
                      <Text size={16} color={colors.muted}>
                        ✕
                      </Text>
                    </Pressable>
                  </Row>
                ))}
              </View>

              {/* Add a vehicle range — tap a field to cycle through values. */}
              <View
                style={{
                  marginTop: 14,
                  padding: 14,
                  borderRadius: radius['2xl'],
                  borderWidth: 1,
                  borderStyle: 'dashed',
                  borderColor: colors.border,
                  gap: 8,
                }}
              >
                <Text size={12} weight={600} color={colors.muted}>
                  {t.addVehicle}
                </Text>
                <Row gap={8}>
                  <Field
                    style={{ flex: 1 }}
                    height={44}
                    value={draftMake}
                    trailing={<Text color={colors.muted}>▾</Text>}
                    onPress={cycle(MAKES, draftMake, (nextMake) => {
                      setDraftMake(nextMake);
                      setDraftModel(MODELS[nextMake][0]);
                    })}
                  />
                  <Field
                    style={{ flex: 1 }}
                    height={44}
                    value={draftModel}
                    trailing={<Text color={colors.muted}>▾</Text>}
                    onPress={cycle(MODELS[draftMake], draftModel, setDraftModel)}
                  />
                </Row>
                <Row gap={8}>
                  <Field
                    style={{ flex: 1 }}
                    height={44}
                    value={String(draftFrom)}
                    trailing={<Text color={colors.muted}>▾</Text>}
                    onPress={cycle(YEARS, draftFrom, setDraftFrom)}
                  />
                  <Field
                    style={{ flex: 1 }}
                    height={44}
                    value={String(draftTo)}
                    trailing={<Text color={colors.muted}>▾</Text>}
                    onPress={cycle(YEARS, draftTo, setDraftTo)}
                  />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t.add}
                    onPress={() =>
                      setFitments((prev) => [
                        ...prev,
                        {
                          make: draftMake,
                          model: draftModel,
                          yearFrom: Math.min(draftFrom, draftTo),
                          yearTo: Math.max(draftFrom, draftTo),
                        },
                      ])
                    }
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: radius.lg,
                      backgroundColor: colors.red,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon name="plus" size={20} />
                  </Pressable>
                </Row>
              </View>

              <Row
                style={{
                  marginTop: 14,
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  borderRadius: radius.xl,
                  backgroundColor: colors.black,
                  borderWidth: 1,
                  borderColor: colors.border,
                  gap: 10,
                  alignItems: 'flex-start',
                }}
              >
                <Icon name="info" size={18} color={colors.red} />
                <Text size={12} color={colors.muted} lineHeight={1.5} style={{ flex: 1 }}>
                  {t.compatHint}
                </Text>
              </Row>
            </>
          ) : null}

          {/* Step 3 — price & publish */}
          {step === 2 ? (
            <>
              <Row style={{ gap: 8, alignItems: 'flex-start' }}>
                <View style={{ flex: 2 }}>
                  <SectionLabel>{t.price}</SectionLabel>
                  <Row
                    style={{
                      marginTop: 8,
                      height: 52,
                      borderRadius: radius.lg,
                      backgroundColor: colors.black,
                      borderWidth: 1,
                      borderColor: colors.red,
                      paddingHorizontal: 14,
                      justifyContent: 'space-between',
                    }}
                  >
                    <TextInput
                      value={price}
                      onChangeText={setPrice}
                      keyboardType="number-pad"
                      style={{
                        flex: 1,
                        color: colors.white,
                        fontFamily: font(800),
                        fontSize: 18,
                        textAlign: isRTL ? 'right' : 'left',
                        padding: 0,
                      }}
                    />
                    <Text size={11} weight={600} color={colors.muted}>
                      {t.iqd}
                    </Text>
                  </Row>
                </View>
                <View style={{ flex: 1 }}>
                  <SectionLabel>{t.stock}</SectionLabel>
                  <Row
                    style={{
                      marginTop: 8,
                      height: 52,
                      borderRadius: radius.lg,
                      backgroundColor: colors.black,
                      borderWidth: 1,
                      borderColor: colors.border,
                      paddingHorizontal: 6,
                      justifyContent: 'space-between',
                    }}
                  >
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="-"
                      onPress={() => setStock((prev) => Math.max(0, prev - 1))}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: radius.md,
                        backgroundColor: colors.surface,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text size={16}>−</Text>
                    </Pressable>
                    <Text size={16} weight={800}>
                      {stock}
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="+"
                      onPress={() => setStock((prev) => prev + 1)}
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: radius.md,
                        backgroundColor: colors.surface,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Text size={16}>+</Text>
                    </Pressable>
                  </Row>
                </View>
              </Row>

              <SectionLabel style={{ marginTop: 16 }}>{t.bulk}</SectionLabel>
              <View
                style={{
                  marginTop: 8,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: radius.lg,
                  overflow: 'hidden',
                }}
              >
                {[
                  ['1 – 3', '45,000'],
                  ['4 – 9', '41,000'],
                ].map(([range, tierPrice], index) => (
                  <Row
                    key={range}
                    style={{
                      justifyContent: 'space-between',
                      paddingVertical: 12,
                      paddingHorizontal: 14,
                      backgroundColor: colors.black,
                      borderTopWidth: index === 0 ? 0 : 1,
                      borderTopColor: colors.borderSoft,
                    }}
                  >
                    <Text size={13} color={colors.muted}>
                      {range} {t.pcs}
                    </Text>
                    <Text size={13} weight={700}>
                      {tierPrice}
                    </Text>
                  </Row>
                ))}
                <Pressable
                  accessibilityRole="button"
                  style={{
                    height: 44,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: colors.black,
                    borderTopWidth: 1,
                    borderTopColor: colors.borderSoft,
                  }}
                >
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
                    <Pressable
                      key={label}
                      accessibilityRole="radio"
                      accessibilityState={{ selected }}
                      onPress={() => setDeliveryIndex(index)}
                      style={{
                        minHeight: 52,
                        paddingHorizontal: 14,
                        paddingVertical: 10,
                        borderRadius: radius.lg,
                        borderWidth: 1,
                        borderColor: selected ? colors.red : colors.border,
                        backgroundColor: colors.black,
                        flexDirection: row,
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                      }}
                    >
                      <Text size={13} weight={600} style={{ flex: 1 }}>
                        {label} · {fee}
                      </Text>
                      <View
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 10,
                          borderWidth: selected ? 6 : 1,
                          borderColor: selected ? colors.red : '#555',
                        }}
                      />
                    </Pressable>
                  );
                })}
              </View>

              <SectionLabel style={{ marginTop: 16 }}>{t.description}</SectionLabel>
              <View
                style={{
                  marginTop: 8,
                  minHeight: 80,
                  borderRadius: radius.lg,
                  backgroundColor: colors.black,
                  borderWidth: 1,
                  borderColor: colors.border,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                }}
              >
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  placeholder={t.descPh}
                  placeholderTextColor={colors.muted}
                  style={{
                    color: colors.white,
                    fontFamily: font(400),
                    fontSize: 13,
                    textAlign: isRTL ? 'right' : 'left',
                    padding: 0,
                    minHeight: 56,
                  }}
                />
              </View>
            </>
          ) : null}
        </ScrollView>

        <Row
          style={{
            paddingHorizontal: 20,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: colors.borderSoft,
            gap: 10,
          }}
        >
          <Button
            title={step === 0 ? t.cancel : t.back}
            variant="ghost"
            style={{ flex: 1, backgroundColor: colors.black }}
            onPress={back}
          />
          <Button
            title={step === 2 ? t.publish : t.next}
            style={{ flex: 2 }}
            disabled={createProduct.isPending}
            onPress={next}
          />
        </Row>
      </SheetSurface>
    </View>
  );
}
