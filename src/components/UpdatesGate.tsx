import React, { useEffect, useRef, useState } from 'react';
import { AppState, View, type AppStateStatus } from 'react-native';
import * as Updates from 'expo-updates';

import { useT } from '../i18n';
import { colors } from '../theme';
import { Text } from './ui';

/**
 * Over-the-air updates without a manual restart.
 *
 * expo-updates already checks on cold start (`checkAutomatically: ON_LOAD`
 * in app.json). This adds the case the user actually hits: the app has been
 * sitting in the background, a new update was published, and they bring it
 * back to the foreground. We check then, fetch, and reload — with a short
 * notice so the reload does not look like a crash.
 */
export function UpdatesGate({ children }: { children: React.ReactNode }) {
  const { t } = useT();
  const [restarting, setRestarting] = useState(false);
  const checking = useRef(false);
  const lastCheck = useRef(0);

  useEffect(() => {
    if (__DEV__ || !Updates.isEnabled) return;

    const check = async () => {
      // Throttle: a foreground flip every few seconds should not hammer the CDN.
      if (checking.current || Date.now() - lastCheck.current < 60_000) return;
      checking.current = true;
      lastCheck.current = Date.now();
      try {
        const result = await Updates.checkForUpdateAsync();
        if (!result.isAvailable) return;
        await Updates.fetchUpdateAsync();
        setRestarting(true);
        // Give the notice one frame to paint before the bundle swaps.
        setTimeout(() => Updates.reloadAsync().catch(() => setRestarting(false)), 600);
      } catch {
        // Offline, or the update server is unreachable — try again next time.
      } finally {
        checking.current = false;
      }
    };

    const onChange = (state: AppStateStatus) => {
      if (state === 'active') check().catch(() => {});
    };
    const sub = AppState.addEventListener('change', onChange);
    check().catch(() => {});
    return () => sub.remove();
  }, []);

  return (
    <>
      {children}
      {restarting ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 20,
            right: 20,
            bottom: 40,
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderRadius: 14,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.red,
          }}
        >
          <Text size={13} weight={700}>
            {t.updateAvailable}
          </Text>
          <Text size={12} color={colors.muted} style={{ marginTop: 2 }}>
            {t.updateRestarting}
          </Text>
        </View>
      ) : null}
    </>
  );
}
