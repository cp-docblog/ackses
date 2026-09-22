import React from 'react';
import { View } from 'react-native';
import { Redirect, Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '../../src/components/Icon';
import { useT } from '../../src/i18n';
import { useSession } from '../../src/state/session';
import { colors } from '../../src/theme';

/** Seller bottom bar: Dashboard · My shop · Orders · Account. */
export default function SellerLayout() {
  const { t, font } = useT();
  const insets = useSafeAreaInsets();
  const { user, loading } = useSession();

  // The seller area needs an account that owns a shop. Anyone else is sent to
  // the seller sign-up, which starts at shop setup if they are already signed in.
  if (loading) return <View style={{ flex: 1, backgroundColor: colors.black }} />;
  if (!user) return <Redirect href="/(auth)/sell" />;
  if (!user.sellerId) return <Redirect href="/(auth)/sell" />;

  const icon = (name: IconName) =>
    function TabIcon({ focused }: { focused: boolean }) {
      return <Icon name={name} size={22} color={focused ? colors.red : colors.muted} />;
    };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.black },
        tabBarStyle: {
          backgroundColor: colors.black,
          borderTopWidth: 1,
          borderTopColor: colors.borderSoft,
          height: 56 + insets.bottom,
          paddingTop: 8,
          paddingBottom: insets.bottom,
        },
        tabBarActiveTintColor: colors.red,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontFamily: font(600), fontSize: 10 },
      }}
    >
      <Tabs.Screen name="dashboard" options={{ title: t.tabDash, tabBarIcon: icon('grid') }} />
      <Tabs.Screen name="shop" options={{ title: t.tabShop, tabBarIcon: icon('shop') }} />
      <Tabs.Screen name="orders" options={{ title: t.tabOrders, tabBarIcon: icon('orders') }} />
      <Tabs.Screen name="account" options={{ title: t.tabAccount, tabBarIcon: icon('user') }} />
    </Tabs>
  );
}
