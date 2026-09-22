import React from 'react';
import { Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useT } from '../i18n';
import { colors, radius } from '../theme';
import { Icon } from './Icon';
import { Row, Text } from './ui';

/**
 * A bottom sheet of choices — sort order, delivery city, category. One
 * component so every picker in the app looks and behaves the same.
 */
export function OptionSheet<T extends string>({
  visible,
  title,
  options,
  value,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: { key: T; label: string; sub?: string }[];
  value: T | null;
  onSelect: (key: T) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { row } = useT();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,.6)' }} onPress={onClose} />
      <View
        style={{
          backgroundColor: colors.surface,
          borderTopLeftRadius: radius.sheet,
          borderTopRightRadius: radius.sheet,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingBottom: Math.max(insets.bottom, 20),
          maxHeight: '75%',
        }}
      >
        <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginTop: 14, marginBottom: 14 }} />
        <Text size={18} weight={700} style={{ paddingHorizontal: 20, marginBottom: 8 }}>
          {title}
        </Text>
        <ScrollView>
          {options.map((option) => {
            const selected = option.key === value;
            return (
              <Pressable
                key={option.key}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => {
                  onSelect(option.key);
                  onClose();
                }}
                style={({ pressed }) => ({
                  flexDirection: row,
                  alignItems: 'center',
                  gap: 12,
                  minHeight: 52,
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  backgroundColor: pressed ? colors.surfaceAlt : 'transparent',
                })}
              >
                <View style={{ flex: 1 }}>
                  <Text size={14} weight={selected ? 700 : 500}>
                    {option.label}
                  </Text>
                  {option.sub ? (
                    <Text size={11} color={colors.muted} style={{ marginTop: 2 }}>
                      {option.sub}
                    </Text>
                  ) : null}
                </View>
                {selected ? <Icon name="check" size={16} color={colors.red} strokeWidth={3} /> : null}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

/** The five Iraqi cities the app ships with, in both languages. */
export const CITIES: { en: string; ar: string }[] = [
  { en: 'Baghdad', ar: 'بغداد' },
  { en: 'Erbil', ar: 'أربيل' },
  { en: 'Basra', ar: 'البصرة' },
  { en: 'Mosul', ar: 'الموصل' },
  { en: 'Najaf', ar: 'النجف' },
];
