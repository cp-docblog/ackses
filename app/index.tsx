import React from 'react';
import { View } from 'react-native';
import { Redirect } from 'expo-router';

import { useSession } from '../src/state/session';
import { useStore } from '../src/state/store';
import { colors } from '../src/theme';

/**
 * Entry point. No account → sign-in. Signed in but no car yet → onboarding.
 * Otherwise the buyer tabs, or the seller tabs if they left the app in
 * selling mode and still own a shop.
 */
export default function Index() {
  const { role, hydrated, vehicle, onboarded } = useStore();
  const { user, loading } = useSession();

  if (!hydrated || loading) return <View style={{ flex: 1, backgroundColor: colors.black }} />;
  if (!user) return <Redirect href="/(auth)/sign-in" />;
  if (!onboarded || !vehicle) return <Redirect href="/onboarding" />;
  if (role === 'seller' && user.sellerId) return <Redirect href="/(seller)/dashboard" />;
  return <Redirect href="/(buyer)" />;
}
