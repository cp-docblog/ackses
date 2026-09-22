import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useSession } from '../src/state/session';
import { useStore } from '../src/state/store';
import { colors } from '../src/theme';

const ONBOARDED_KEY = 'ackses.onboarded';

/**
 * Entry point: first run goes to onboarding so we learn the buyer's car,
 * afterwards straight to the listings. Someone who left the app in selling
 * mode lands back in the seller tabs, provided the account still owns a shop.
 */
export default function Index() {
  const { role, hydrated } = useStore();
  const { user, loading: sessionLoading } = useSession();
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDED_KEY)
      .then((value) => setOnboarded(value === 'true'))
      .catch(() => setOnboarded(false));
  }, []);

  if (onboarded === null || !hydrated || sessionLoading) {
    return <View style={{ flex: 1, backgroundColor: colors.black }} />;
  }
  if (!onboarded) return <Redirect href="/onboarding" />;
  if (role === 'seller' && user?.sellerId) return <Redirect href="/(seller)/dashboard" />;
  return <Redirect href="/(buyer)" />;
}

export { ONBOARDED_KEY };
