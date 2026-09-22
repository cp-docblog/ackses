import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text as RNText,
  TextInput,
  View,
  type PressableProps,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import Svg, { Defs, Pattern, Rect } from 'react-native-svg';
import { Image as ExpoImage } from 'expo-image';

import { useT } from '../i18n';
import { colors, mono, placeholder, radius, type FontWeightToken } from '../theme';

// ─────────────────────────────────────────────────────────────
// Text
// ─────────────────────────────────────────────────────────────

type TProps = TextProps & {
  size?: number;
  weight?: FontWeightToken;
  color?: string;
  align?: 'start' | 'end' | 'center';
  /** Opt out of the localized font — used for OEM numbers and VIN digits. */
  monospace?: boolean;
  /** Multiplier applied to `size`; the design mostly uses 1.3–1.5. */
  lineHeight?: number;
  letterSpacing?: number;
};

export function Text({
  size = 13,
  weight = 400,
  color = colors.white,
  align = 'start',
  monospace,
  lineHeight,
  letterSpacing,
  style,
  ...rest
}: TProps) {
  const { font, align: alignStyle } = useT();
  return (
    <RNText
      {...rest}
      style={[
        {
          fontSize: size,
          color,
          fontFamily: monospace ? mono : font(weight),
          ...(lineHeight ? { lineHeight: size * lineHeight } : null),
          ...(letterSpacing ? { letterSpacing } : null),
        },
        alignStyle(align),
        style,
      ]}
    />
  );
}

/** The `11px / letter-spacing 2 / muted` section headers used throughout. */
export function SectionLabel({ children, style }: { children: React.ReactNode; style?: StyleProp<TextStyle> }) {
  return (
    <Text size={11} weight={600} color={colors.muted} letterSpacing={2} style={style}>
      {children}
    </Text>
  );
}

// ─────────────────────────────────────────────────────────────
// Layout
// ─────────────────────────────────────────────────────────────

/** A flex row that flips to `row-reverse` in Arabic. */
export function Row({
  style,
  gap,
  children,
  ...rest
}: { gap?: number; children?: React.ReactNode; style?: StyleProp<ViewStyle> } & View['props']) {
  const { row } = useT();
  return (
    <View {...rest} style={[{ flexDirection: row, alignItems: 'center' }, gap ? { gap } : null, style]}>
      {children}
    </View>
  );
}

/**
 * The striped tile that stands in for part photography, or the real photo
 * once a listing has one.
 *
 * The stripes are one SVG pattern — a single native view — instead of the
 * two dozen rotated Views the first version stacked per tile, which was the
 * single biggest render cost on the listings grid.
 */
export const PhotoPlaceholder = React.memo(function PhotoPlaceholder({
  style,
  label,
  stripe = 8,
  uri,
}: {
  style?: StyleProp<ViewStyle>;
  label?: string;
  stripe?: number;
  /** When set, the photo is shown and the stripes are only the loading state. */
  uri?: string | null;
}) {
  const period = stripe * 2;
  return (
    <View
      style={[
        { backgroundColor: placeholder.dark, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
        style,
      ]}
    >
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <Pattern
            id={`stripes-${stripe}`}
            patternUnits="userSpaceOnUse"
            width={period}
            height={period}
            patternTransform="rotate(45)"
          >
            <Rect x={0} y={0} width={stripe} height={period} fill={placeholder.light} />
          </Pattern>
        </Defs>
        <Rect x={0} y={0} width="100%" height="100%" fill={`url(#stripes-${stripe})`} />
      </Svg>
      {uri ? (
        <ExpoImage
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={150}
          cachePolicy="memory-disk"
        />
      ) : label ? (
        <RNText style={{ fontFamily: mono, fontSize: 10, color: colors.muted }}>{label}</RNText>
      ) : null}
    </View>
  );
});

// ─────────────────────────────────────────────────────────────
// Controls
// ─────────────────────────────────────────────────────────────

type ButtonProps = PressableProps & {
  title: string;
  variant?: 'primary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function Button({ title, variant = 'primary', size = 'lg', icon, style, ...rest }: ButtonProps) {
  const heights = { sm: 40, md: 48, lg: 52 } as const;
  const fontSizes = { sm: 12, md: 13, lg: 14 } as const;

  const palette: Record<NonNullable<ButtonProps['variant']>, ViewStyle & { color: string }> = {
    primary: { backgroundColor: colors.red, borderWidth: 0, color: colors.white },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.red,
      color: colors.white,
    },
    ghost: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      color: colors.white,
    },
    danger: { backgroundColor: colors.red, borderWidth: 0, color: colors.white },
  };
  const { color, ...box } = palette[variant];

  return (
    <Pressable
      accessibilityRole="button"
      {...rest}
      style={({ pressed }) => [
        {
          height: heights[size],
          borderRadius: radius.xl,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 10,
          paddingHorizontal: 18,
          opacity: pressed ? 0.75 : 1,
        },
        box,
        typeof style === 'function' ? style({ pressed }) : style,
      ]}
    >
      {icon}
      <Text size={fontSizes[size]} weight={variant === 'primary' || variant === 'danger' ? 700 : 600} color={color}>
        {title}
      </Text>
    </Pressable>
  );
}

/** Rounded selectable chip — the design's filter pills and make/model picker. */
export function Chip({
  label,
  selected,
  onPress,
  height = 36,
  style,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  height?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      style={({ pressed }) => [
        {
          height,
          paddingHorizontal: 12,
          borderRadius: height / 2,
          borderWidth: 1,
          borderColor: selected ? colors.red : colors.border,
          backgroundColor: selected ? colors.red : colors.surface,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.75 : 1,
        },
        style,
      ]}
    >
      <Text size={12} weight={500}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Segmented control used for condition (All / New / Used). */
export function Segmented({
  options,
  selectedIndex,
  onSelect,
}: {
  options: string[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}) {
  const { row } = useT();
  return (
    <View
      style={{
        flexDirection: row,
        backgroundColor: colors.black,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.lg,
        padding: 3,
      }}
    >
      {options.map((option, index) => (
        <Pressable
          key={option}
          accessibilityRole="button"
          accessibilityState={{ selected: index === selectedIndex }}
          onPress={() => onSelect(index)}
          style={{
            flex: 1,
            height: 40,
            borderRadius: radius.md,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: index === selectedIndex ? colors.red : 'transparent',
          }}
        >
          <Text size={12} weight={600} align="center">
            {option}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

/** The pill toggle from the filter sheet and the saved-search rows. */
export function Toggle({ value, onChange }: { value: boolean; onChange: (next: boolean) => void }) {
  const { isRTL } = useT();
  const knob = value ? 23 : 3;
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
      style={{
        width: 46,
        height: 28,
        borderRadius: 14,
        backgroundColor: value ? colors.red : colors.track,
        borderWidth: 1,
        borderColor: value ? colors.red : colors.border,
      }}
    >
      <View
        style={{
          position: 'absolute',
          top: 2,
          [isRTL ? 'right' : 'left']: knob,
          width: 20,
          height: 20,
          borderRadius: 10,
          backgroundColor: colors.white,
        }}
      />
    </Pressable>
  );
}

/** Small status pill: "Fits", "In stock", order status, verification state. */
export function Badge({
  label,
  background = colors.red,
  border,
  icon,
  height = 24,
  textColor = colors.white,
}: {
  label: string;
  background?: string;
  border?: string;
  icon?: React.ReactNode;
  height?: number;
  textColor?: string;
}) {
  const { row } = useT();
  return (
    <View
      style={{
        height,
        paddingHorizontal: 8,
        borderRadius: height / 2,
        backgroundColor: background,
        borderWidth: border ? 1 : 0,
        borderColor: border,
        flexDirection: row,
        alignItems: 'center',
        gap: 4,
      }}
    >
      {icon}
      <Text size={10} weight={700} color={textColor}>
        {label}
      </Text>
    </View>
  );
}

/** Bordered card used for stats, list rows and grouped content. */
export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.borderSoft,
          borderRadius: radius['2xl'],
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function StatTile({ value, label, delta }: { value: string; label: string; delta?: string }) {
  return (
    <Card style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 8 }}>
      <Text size={17} weight={800} align={delta ? 'start' : 'center'}>
        {value}
      </Text>
      <Text size={10} color={colors.muted} align={delta ? 'start' : 'center'} style={{ marginTop: 2 }}>
        {label}
      </Text>
      {delta ? (
        <Text size={10} weight={600} color={colors.red} style={{ marginTop: 4 }}>
          {delta}
        </Text>
      ) : null}
    </Card>
  );
}

/** Read-only field box — the design's inputs are display-only mock fields. */
export function Field({
  value,
  placeholder: hint,
  height = 48,
  monospace,
  trailing,
  onPress,
  style,
}: {
  value?: string;
  placeholder?: string;
  height?: number;
  monospace?: boolean;
  trailing?: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const { row } = useT();
  const body = (
    <View
      style={[
        {
          minHeight: height,
          borderRadius: radius.lg,
          backgroundColor: colors.black,
          borderWidth: 1,
          borderColor: colors.border,
          flexDirection: row,
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 14,
          gap: 8,
        },
        style,
      ]}
    >
      <Text size={13} color={value ? colors.white : colors.muted} monospace={monospace} style={{ flex: 1 }}>
        {value || hint}
      </Text>
      {trailing}
    </View>
  );
  return onPress ? (
    <Pressable accessibilityRole="button" onPress={onPress}>
      {body}
    </Pressable>
  ) : (
    body
  );
}

/**
 * Labelled text input. The prototype only ever drew display-only field boxes,
 * so this matches their geometry (48px, 12px radius, #000 on a #333 border)
 * and adds the states a real input needs: focus, error, and a trailing slot
 * for the password reveal toggle.
 */
export function Input({
  label,
  value,
  onChangeText,
  placeholder: hint,
  error,
  secureTextEntry,
  trailing,
  autoCapitalize = 'sentences',
  keyboardType,
  textContentType,
  autoComplete,
  returnKeyType,
  onSubmitEditing,
  style,
}: {
  label: string;
  value: string;
  onChangeText: (next: string) => void;
  placeholder?: string;
  /** Message shown under the field; also turns the border red. */
  error?: string | null;
  secureTextEntry?: boolean;
  trailing?: React.ReactNode;
  autoCapitalize?: TextInputProps['autoCapitalize'];
  keyboardType?: TextInputProps['keyboardType'];
  textContentType?: TextInputProps['textContentType'];
  autoComplete?: TextInputProps['autoComplete'];
  returnKeyType?: TextInputProps['returnKeyType'];
  onSubmitEditing?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  const { font, isRTL, row } = useT();
  const [focused, setFocused] = React.useState(false);

  const borderColor = error ? colors.red : focused ? colors.muted : colors.border;

  return (
    <View style={style}>
      <SectionLabel>{label}</SectionLabel>
      <View
        style={{
          marginTop: 8,
          minHeight: 48,
          borderRadius: radius.lg,
          backgroundColor: colors.black,
          borderWidth: 1,
          borderColor,
          paddingHorizontal: 14,
          flexDirection: row,
          alignItems: 'center',
          gap: 8,
        }}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={hint}
          placeholderTextColor={colors.mutedDark}
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          keyboardType={keyboardType}
          textContentType={textContentType}
          autoComplete={autoComplete}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          accessibilityLabel={label}
          style={{
            flex: 1,
            color: colors.white,
            fontFamily: font(500),
            fontSize: 14,
            textAlign: isRTL ? 'right' : 'left',
            paddingVertical: 12,
          }}
        />
        {trailing}
      </View>
      {error ? (
        <Text size={11} weight={500} color={colors.red} style={{ marginTop: 6 }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

/** Row of hairline-separated entries, as used on menus and spec tables. */
export function ListGroup({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: colors.borderSoft,
        borderRadius: radius.xl,
        overflow: 'hidden',
      }}
    >
      {children}
    </View>
  );
}

export function ListRow({
  label,
  value,
  trailing,
  onPress,
  first,
}: {
  label: string;
  value?: string;
  trailing?: React.ReactNode;
  onPress?: () => void;
  first?: boolean;
}) {
  const { row } = useT();
  const content = (
    <View
      style={{
        flexDirection: row,
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 52,
        paddingHorizontal: 14,
        borderTopWidth: first ? 0 : 1,
        borderTopColor: colors.hairline,
        gap: 12,
      }}
    >
      <Text size={13} weight={500} style={{ flex: 1 }}>
        {label}
      </Text>
      {trailing ?? (
        <Text size={12} color={colors.muted}>
          {value}
        </Text>
      )}
    </View>
  );
  return onPress ? (
    <Pressable accessibilityRole="button" onPress={onPress}>
      {content}
    </Pressable>
  ) : (
    content
  );
}

// ─────────────────────────────────────────────────────────────
// States
// ─────────────────────────────────────────────────────────────

export function Loading() {
  return (
    <View style={{ paddingVertical: 60, alignItems: 'center' }}>
      <ActivityIndicator color={colors.red} />
    </View>
  );
}

export function EmptyState({
  message,
  actionLabel,
  onAction,
}: {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={{ paddingVertical: 60, paddingHorizontal: 20, alignItems: 'center', gap: 14 }}>
      <Text size={13} color={colors.muted} align="center" lineHeight={1.6}>
        {message}
      </Text>
      {actionLabel && onAction ? (
        <Button title={actionLabel} variant="ghost" size="md" onPress={onAction} style={{ alignSelf: 'center' }} />
      ) : null}
    </View>
  );
}

/** Horizontal scroller with the design's default 20px gutters. */
export function HScroll({
  children,
  gap = 8,
  paddingHorizontal = 20,
  style,
}: {
  children: React.ReactNode;
  gap?: number;
  paddingHorizontal?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const { isRTL } = useT();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap, paddingHorizontal, flexDirection: isRTL ? 'row-reverse' : 'row' }}
      style={style}
    >
      {children}
    </ScrollView>
  );
}
