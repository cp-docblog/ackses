import React from 'react';
import { Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useT } from '../i18n';
import { colors, radius } from '../theme';
import { isSupabaseConfigured } from '../lib/supabase';
import { Text } from './ui';

/** `ACKSES` wordmark with the leading A in brand red. */
export function Logo({ size = 22, dim }: { size?: number; dim?: boolean }) {
  const { font } = useT();
  return (
    <View style={{ flexDirection: 'row', opacity: dim ? 0.35 : 1 }}>
      <Text size={size} weight={800} color={colors.red} letterSpacing={2} style={{ fontFamily: font(800) }}>
        A
      </Text>
      <Text size={size} weight={800} letterSpacing={2}>
        CKSES
      </Text>
    </View>
  );
}

/** EN / ع switch, as it appears on onboarding, buyer profile and seller account. */
export function LanguageToggle() {
  const { lang, setLang, font } = useT();
  const isAr = lang === 'ar';
  return (
    <View
      style={{
        flexDirection: 'row',
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 20,
        overflow: 'hidden',
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="English"
        accessibilityState={{ selected: !isAr }}
        onPress={() => setLang('en')}
        style={{
          height: 32,
          paddingHorizontal: 12,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isAr ? 'transparent' : colors.red,
        }}
      >
        <Text size={12} weight={600} style={{ fontFamily: font(600) }}>
          EN
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="العربية"
        accessibilityState={{ selected: isAr }}
        onPress={() => setLang('ar')}
        style={{
          height: 32,
          paddingHorizontal: 12,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: isAr ? colors.red : 'transparent',
        }}
      >
        <Text size={13} weight={700}>
          ع
        </Text>
      </Pressable>
    </View>
  );
}

/** Circular icon button used for back / close affordances. */
export function RoundButton({
  label,
  onPress,
  background = colors.surface,
  children,
  style,
}: {
  label: string;
  onPress?: () => void;
  background?: string;
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        {
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: background,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.7 : 1,
        },
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

/** Chevron that points "back" in the active writing direction. */
export function BackChevron() {
  const { isRTL } = useT();
  return (
    <Text size={18} weight={600}>
      {isRTL ? '›' : '‹'}
    </Text>
  );
}

/** `‹  Title` header row, 20px gutters, sits under the safe-area inset. */
export function ScreenHeader({
  title,
  onBack,
  right,
}: {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  const { row } = useT();
  return (
    <View
      style={{
        flexDirection: row,
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 20,
      }}
    >
      {onBack ? (
        <RoundButton label="Back" onPress={onBack}>
          <BackChevron />
        </RoundButton>
      ) : null}
      <Text size={16} weight={700} style={{ flex: 1 }}>
        {title}
      </Text>
      {right}
    </View>
  );
}

/**
 * Bottom sheet surface: rounded top corners on `#111`, sitting above the home
 * indicator. Used by the filter, VIN, add-product and order-status screens.
 */
export function SheetSurface({
  children,
  style,
  fill,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Stretch to fill the remaining height instead of hugging its content. */
  fill?: boolean;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderTopLeftRadius: radius.sheet,
          borderTopRightRadius: radius.sheet,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingBottom: Math.max(insets.bottom, 20),
          ...(fill ? { flex: 1 } : { marginTop: 'auto' }),
        },
        style,
      ]}
    >
      <View
        style={{
          width: 40,
          height: 4,
          borderRadius: 2,
          backgroundColor: colors.border,
          alignSelf: 'center',
          marginTop: 14,
          marginBottom: 14,
        }}
      />
      {children}
    </View>
  );
}

/** Tells the reviewer the screens are reading bundled demo data. */
export function DemoDataNotice() {
  const { t } = useT();
  if (isSupabaseConfigured) return null;
  return (
    <View
      style={{
        paddingVertical: 6,
        paddingHorizontal: 20,
        backgroundColor: colors.surfaceAlt,
        borderBottomWidth: 1,
        borderBottomColor: colors.borderSoft,
      }}
    >
      <Text size={10} weight={500} color={colors.muted} align="center">
        {t.demoMode}
      </Text>
    </View>
  );
}
