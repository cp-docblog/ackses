import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';

import { useT } from '../i18n';
import { vehicleLabel } from '../lib/format';
import { useSaveSearch } from '../hooks/queries';
import { useStore } from '../state/store';
import { BRANDS, PRICE_CEILING, PRICE_FLOOR } from '../data/types';
import { colors, radius } from '../theme';
import { Chip, Row, SectionLabel, Segmented, Text, Toggle } from './ui';

/** An empty field means "no bound", not zero. */
function parsePrice(text: string): number | null {
  const digits = text.replace(/[^\d]/g, '');
  return digits ? Math.max(0, Number(digits)) : null;
}

/**
 * 02b · Advanced filters. Rendered inline as the Search tab and as a bottom
 * sheet over the listings. Every control here filters for real.
 */
export function FiltersPanel({ onClose }: { onClose?: () => void }) {
  const { t, row, font, isRTL } = useT();
  const { filters, setFilters, resetFilters, vehicle } = useStore();
  const saveSearch = useSaveSearch();

  const [openCategory, setOpenCategory] = useState<number | null>(
    filters.categoryIndex >= 0 ? filters.categoryIndex : 0,
  );
  const [minDraft, setMinDraft] = useState(filters.minPriceIqd?.toString() ?? '');
  const [maxDraft, setMaxDraft] = useState(filters.maxPriceIqd?.toString() ?? '');
  const [saveEnabled, setSaveEnabled] = useState(false);

  // The design shows counts beside each top-level category.
  const categoryCounts = [42, 118, 64, 51, 37, 29];

  // Highlights the portion of the track the typed range covers. With no range
  // set the whole track is highlighted, since nothing is being excluded.
  const trackBounds = useMemo(() => {
    const span = PRICE_CEILING - PRICE_FLOOR;
    const clamp = (value: number) => Math.max(0, Math.min(1, (value - PRICE_FLOOR) / span));
    const left = filters.minPriceIqd === null ? 0 : clamp(filters.minPriceIqd);
    const right = filters.maxPriceIqd === null ? 1 : clamp(filters.maxPriceIqd);
    return {
      left: `${left * 100}%`,
      width: `${Math.max(0, right - left) * 100}%`,
    } as { left: `${number}%`; width: `${number}%` };
  }, [filters.minPriceIqd, filters.maxPriceIqd]);

  const priceInput = (
    value: string,
    onChangeText: (next: string) => void,
    onCommit: () => void,
    label: string,
    hint: string,
  ) => (
    <Row
      style={{
        flex: 1,
        height: 44,
        borderRadius: radius.lg,
        backgroundColor: colors.black,
        borderWidth: 1,
        borderColor: colors.border,
        paddingHorizontal: 12,
        gap: 8,
      }}
    >
      <Text size={13} color={colors.muted}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onBlur={onCommit}
        onSubmitEditing={onCommit}
        keyboardType="number-pad"
        returnKeyType="done"
        placeholder={hint}
        placeholderTextColor={colors.border}
        style={{
          flex: 1,
          color: colors.white,
          fontFamily: font(600),
          fontSize: 13,
          textAlign: isRTL ? 'left' : 'right',
          paddingVertical: 0,
        }}
      />
    </Row>
  );

  return (
    <View style={{ flex: 1 }}>
      <Row style={{ paddingHorizontal: 20, justifyContent: 'space-between' }}>
        <Text size={18} weight={700}>
          {t.filters}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            resetFilters();
            setMinDraft('');
            setMaxDraft('');
            setOpenCategory(0);
          }}
          hitSlop={8}
        >
          <Text size={13} weight={600} color={colors.red}>
            {t.reset}
          </Text>
        </Pressable>
      </Row>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 6, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Category tree */}
        <SectionLabel style={{ marginTop: 10 }}>{t.category}</SectionLabel>
        <View
          style={{
            marginTop: 8,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: radius.xl,
            overflow: 'hidden',
          }}
        >
          {t.cats.slice(0, 3).map((label, index) => {
            const open = openCategory === index;
            const subs = t.subcats[index] ?? [];
            return (
              <View key={label}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded: open }}
                  onPress={() => setOpenCategory(open ? null : index)}
                  style={{
                    height: 48,
                    paddingHorizontal: 14,
                    backgroundColor: colors.black,
                    borderTopWidth: index === 0 ? 0 : 1,
                    borderTopColor: colors.borderSoft,
                    flexDirection: row,
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Text size={13} weight={600}>
                    {label}
                  </Text>
                  <Text size={12} color={colors.muted}>
                    {categoryCounts[index]} {open ? '▴' : '▾'}
                  </Text>
                </Pressable>
                {open ? (
                  <View
                    style={{
                      flexDirection: row,
                      flexWrap: 'wrap',
                      gap: 8,
                      paddingHorizontal: 14,
                      paddingBottom: 14,
                      paddingTop: 6,
                      backgroundColor: colors.black,
                    }}
                  >
                    {subs.map((sub) => (
                      <Chip
                        key={sub}
                        label={sub}
                        selected={filters.subcategory === sub && filters.categoryIndex === index}
                        onPress={() =>
                          setFilters((prev) =>
                            prev.subcategory === sub && prev.categoryIndex === index
                              ? { ...prev, subcategory: null }
                              : { ...prev, categoryIndex: index, subcategory: sub },
                          )
                        }
                      />
                    ))}
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>

        {/* Condition */}
        <SectionLabel style={{ marginTop: 18 }}>{t.condition}</SectionLabel>
        <View style={{ marginTop: 8 }}>
          <Segmented
            options={t.conds}
            selectedIndex={filters.conditionIndex}
            onSelect={(index) => setFilters((prev) => ({ ...prev, conditionIndex: index }))}
          />
        </View>

        {/* Brand */}
        <SectionLabel style={{ marginTop: 18 }}>{t.brand}</SectionLabel>
        <View style={{ flexDirection: row, flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
          {BRANDS.map((brand) => (
            <Chip
              key={brand}
              label={brand}
              selected={filters.brand === brand}
              onPress={() =>
                setFilters((prev) => ({ ...prev, brand: prev.brand === brand ? null : brand }))
              }
            />
          ))}
        </View>

        {/* Price */}
        <SectionLabel style={{ marginTop: 18 }}>
          {t.price} ({t.iqd})
        </SectionLabel>
        <Row style={{ gap: 10, marginTop: 8 }}>
          {priceInput(minDraft, setMinDraft, () => {
            const next = parsePrice(minDraft);
            setMinDraft(next?.toString() ?? '');
            setFilters((prev) => ({
              ...prev,
              minPriceIqd: next,
              // Keep the two ends from crossing over.
              maxPriceIqd:
                next !== null && prev.maxPriceIqd !== null && prev.maxPriceIqd < next
                  ? next
                  : prev.maxPriceIqd,
            }));
          }, t.min, '10,000')}
          <View style={{ width: 10, height: 1, backgroundColor: colors.border }} />
          {priceInput(maxDraft, setMaxDraft, () => {
            const next = parsePrice(maxDraft);
            setMaxDraft(next?.toString() ?? '');
            setFilters((prev) => ({
              ...prev,
              maxPriceIqd: next,
              minPriceIqd:
                next !== null && prev.minPriceIqd !== null && prev.minPriceIqd > next
                  ? next
                  : prev.minPriceIqd,
            }));
          }, t.max, '250,000')}
        </Row>
        {/* Range read-out for the values typed above. */}
        <View style={{ height: 24, marginTop: 10, marginHorizontal: 6, justifyContent: 'center' }}>
          <View style={{ height: 2, backgroundColor: colors.border }} />
          <View
            style={{
              position: 'absolute',
              height: 2,
              backgroundColor: colors.red,
              left: trackBounds.left,
              width: trackBounds.width,
            }}
          />
        </View>

        {/* City */}
        <SectionLabel style={{ marginTop: 18 }}>{t.city}</SectionLabel>
        <View style={{ flexDirection: row, flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
          {t.cities.map((city) => (
            <Chip
              key={city}
              label={city}
              selected={filters.city === city}
              onPress={() => setFilters((prev) => ({ ...prev, city: prev.city === city ? null : city }))}
            />
          ))}
        </View>

        {/* Fits my car */}
        <Row
          style={{
            marginTop: 18,
            minHeight: 56,
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: radius.xl,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.black,
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <View style={{ flex: 1, gap: 2 }}>
            <Text size={13} weight={600}>
              {t.fitsOnly}
            </Text>
            <Text size={11} weight={500} color={colors.muted}>
              {vehicleLabel(vehicle)}
            </Text>
          </View>
          <Toggle
            value={filters.fitsOnly}
            onChange={(next) => setFilters((prev) => ({ ...prev, fitsOnly: next }))}
          />
        </Row>

        {/* Save this search */}
        <Row
          style={{
            marginTop: 10,
            minHeight: 56,
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: radius.xl,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.black,
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <View style={{ flex: 1, gap: 2 }}>
            <Text size={13} weight={600}>
              {t.saveSearch}
            </Text>
            <Text size={11} weight={500} color={colors.muted}>
              {t.saveSearchSub}
            </Text>
          </View>
          <Toggle
            value={saveEnabled}
            onChange={(next) => {
              setSaveEnabled(next);
              if (next) {
                const label =
                  filters.text.trim() ||
                  [
                    filters.categoryIndex >= 0 ? t.cats[filters.categoryIndex] : null,
                    filters.brand,
                    filters.city,
                    filters.fitsOnly ? vehicleLabel(vehicle) : null,
                  ]
                    .filter(Boolean)
                    .join(' · ') ||
                  t.results;
                saveSearch.mutate({ filters, label });
              }
            }}
          />
        </Row>
      </ScrollView>

      {onClose ? (
        <Row
          style={{
            paddingHorizontal: 20,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: colors.borderSoft,
            gap: 10,
          }}
        >
          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={{
              flex: 1,
              height: 52,
              borderRadius: radius.xl,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.black,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text size={13} weight={600}>
              {t.cancel}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={{
              flex: 2,
              height: 52,
              borderRadius: radius.xl,
              backgroundColor: colors.red,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text size={14} weight={700}>
              {t.showResults}
            </Text>
          </Pressable>
        </Row>
      ) : null}
    </View>
  );
}
