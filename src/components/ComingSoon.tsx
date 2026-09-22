import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Modal, Pressable, View } from 'react-native';

import { useT } from '../i18n';
import { colors, radius } from '../theme';
import { Icon } from './Icon';
import { Button, Text } from './ui';

/**
 * VIN decoding and visual part search ship as UI only for now. Every control
 * that would need the missing backend routes here instead, so the screens stay
 * fully reviewable without pretending to work.
 */
export type ComingSoonTopic = 'vin' | 'image' | 'generic';

type ComingSoonValue = {
  show: (topic: ComingSoonTopic, options?: { onSecondary?: () => void; secondaryLabel?: string }) => void;
};

const ComingSoonContext = createContext<ComingSoonValue | null>(null);

type Pending = {
  topic: ComingSoonTopic;
  onSecondary?: () => void;
  secondaryLabel?: string;
};

export function ComingSoonProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<Pending | null>(null);
  const { t, row } = useT();

  const show = useCallback<ComingSoonValue['show']>((topic, options) => {
    setPending({ topic, ...options });
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  const body =
    pending?.topic === 'vin'
      ? t.comingSoonVin
      : pending?.topic === 'image'
        ? t.comingSoonImage
        : t.comingSoonGeneric;

  const dismiss = () => setPending(null);

  return (
    <ComingSoonContext.Provider value={value}>
      {children}
      <Modal visible={!!pending} transparent animationType="fade" onRequestClose={dismiss}>
        <Pressable
          onPress={dismiss}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,.72)',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          {/* Stop presses inside the card from dismissing. */}
          <Pressable
            onPress={() => {}}
            style={{
              width: '100%',
              maxWidth: 360,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: radius.sheet - 4,
              padding: 24,
              alignItems: 'center',
            }}
          >
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: 'rgba(227,6,19,.15)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="info" size={24} color={colors.red} />
            </View>
            <Text size={17} weight={700} align="center" style={{ marginTop: 14 }}>
              {t.comingSoonTitle}
            </Text>
            <Text size={13} color={colors.muted} align="center" lineHeight={1.5} style={{ marginTop: 6 }}>
              {body}
            </Text>
            <View style={{ flexDirection: row, gap: 10, marginTop: 20, alignSelf: 'stretch' }}>
              {pending?.onSecondary ? (
                <Button
                  title={pending.secondaryLabel ?? t.pickByCar}
                  variant="ghost"
                  size="md"
                  style={{ flex: 1 }}
                  onPress={() => {
                    const action = pending.onSecondary;
                    setPending(null);
                    action?.();
                  }}
                />
              ) : null}
              <Button title={t.gotIt} size="md" style={{ flex: 1 }} onPress={dismiss} />
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </ComingSoonContext.Provider>
  );
}

export function useComingSoon(): ComingSoonValue {
  const ctx = useContext(ComingSoonContext);
  if (!ctx) throw new Error('useComingSoon must be used inside <ComingSoonProvider>');
  return ctx;
}

/** Ribbon shown at the top of the two preview-only screens. */
export function PreviewBanner({ label }: { label: string }) {
  const { row } = useT();
  return (
    <View
      style={{
        flexDirection: row,
        alignItems: 'center',
        gap: 8,
        marginHorizontal: 20,
        marginTop: 12,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: radius.lg,
        backgroundColor: 'rgba(227,6,19,.12)',
        borderWidth: 1,
        borderColor: colors.red,
      }}
    >
      <Icon name="info" size={16} color={colors.red} />
      <Text size={11} weight={600} color={colors.white} style={{ flex: 1 }}>
        {label}
      </Text>
    </View>
  );
}
