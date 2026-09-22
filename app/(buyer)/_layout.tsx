import React from 'react';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from '../../src/components/Icon';
import { useT } from '../../src/i18n';
import { useStore } from '../../src/state/store';
import { colors } from '../../src/theme';

/** Bottom bar: Home · Search · Cart · Profile, red for the active tab. */
export default function BuyerLayout() {
  const { t, font } = useT();
  const insets = useSafeAreaInsets();
  const { cartCount } = useStore();

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
      <Tabs.Screen name="index" options={{ title: t.tabHome, tabBarIcon: icon('home') }} />
      <Tabs.Screen name="search" options={{ title: t.tabSearch, tabBarIcon: icon('search') }} />
      <Tabs.Screen
        name="cart"
        options={{
          title: t.tabCart,
          tabBarIcon: icon('cart'),
          tabBarBadge: cartCount > 0 ? cartCount : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.red, color: colors.white, fontSize: 10 },
        }}
      />
      <Tabs.Screen name="profile" options={{ title: t.tabProfile, tabBarIcon: icon('user') }} />
    </Tabs>
  );
}
