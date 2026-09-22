import React, { useEffect } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import {
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
  Montserrat_800ExtraBold,
} from '@expo-google-fonts/montserrat';
import {
  Tajawal_400Regular,
  Tajawal_500Medium,
  Tajawal_700Bold,
  Tajawal_800ExtraBold,
} from '@expo-google-fonts/tajawal';

import { ComingSoonProvider } from '../src/components/ComingSoon';
import { I18nProvider } from '../src/i18n';
import { SessionProvider } from '../src/state/session';
import { StoreProvider } from '../src/state/store';
import { colors } from '../src/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    Montserrat_800ExtraBold,
    Tajawal_400Regular,
    Tajawal_500Medium,
    Tajawal_700Bold,
    Tajawal_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded, fontError]);

  // Keep the (black) splash up rather than flashing fallback system fonts.
  if (!fontsLoaded && !fontError) return <View style={{ flex: 1, backgroundColor: colors.black }} />;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.black }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <I18nProvider>
            <SessionProvider>
              <StoreProvider>
                <ComingSoonProvider>
                  <StatusBar style="light" />
                  <Stack
                    screenOptions={{
                      headerShown: false,
                      contentStyle: { backgroundColor: colors.black },
                      animation: 'slide_from_right',
                    }}
                  >
                    <Stack.Screen name="index" />
                    <Stack.Screen name="onboarding" />
                    <Stack.Screen name="(auth)" />
                    <Stack.Screen name="(buyer)" />
                    <Stack.Screen name="(seller)" />
                    <Stack.Screen name="vin" options={{ presentation: 'transparentModal', animation: 'fade' }} />
                    <Stack.Screen name="filters" options={{ presentation: 'transparentModal', animation: 'fade' }} />
                    <Stack.Screen name="image-search" options={{ presentation: 'modal' }} />
                    <Stack.Screen
                      name="add-product"
                      options={{ presentation: 'transparentModal', animation: 'fade' }}
                    />
                    <Stack.Screen
                      name="order-status"
                      options={{ presentation: 'transparentModal', animation: 'fade' }}
                    />
                    <Stack.Screen
                      name="delete-product"
                      options={{ presentation: 'transparentModal', animation: 'fade' }}
                    />
                  </Stack>
                </ComingSoonProvider>
              </StoreProvider>
            </SessionProvider>
          </I18nProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
