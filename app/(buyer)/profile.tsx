import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '../../src/components/Icon';
import { LanguageToggle } from '../../src/components/chrome';
import { Badge, Button, Card, HScroll, ListGroup, ListRow, PhotoPlaceholder, Row, SectionLabel, Text, Toggle } from '../../src/components/ui';
import { useT } from '../../src/i18n';
import { formatIqd, pick, vehicleLabel } from '../../src/lib/format';
import { useBuyerOrders, useGarage, useProfile, useSavedSearches, useToggleSavedSearch } from '../../src/hooks/queries';
import { useAuthGate } from '../../src/hooks/useAuthGate';
import { useSession } from '../../src/state/session';
import { useStore } from '../../src/state/store';
import { ORDER_STATUSES } from '../../src/data/types';
import { colors, radius } from '../../src/theme';

/** 06 · Buyer profile — garage, saved searches, orders, settings. */
export default function BuyerProfile() {
  const { t, lang, isRTL } = useT();
  const insets = useSafeAreaInsets();
  const { vehicle, setVehicle, setRole } = useStore();
  const { user, signOut } = useSession();
  const { require } = useAuthGate();

  const { data: profile } = useProfile(!!user);
  const { data: garage } = useGarage();
  const { data: savedSearches } = useSavedSearches();
  const { data: orders } = useBuyerOrders();
  const toggleAlerts = useToggleSavedSearch();

  const displayName = profile?.fullName || user?.fullName || user?.email || '';
  const cityLabel = profile ? pick(profile.city, lang) : t.baghdad;

  const menu: { label: string; value: string; href: string }[] = [
    { label: t.addresses, value: String(profile?.addresses.length ?? 0), href: '/addresses' },
    { label: t.paymentPrefTitle, value: profile?.paymentPreference === 'card' ? t.card : t.cod, href: '/payment-method' },
    { label: t.notifications, value: profile?.notificationPrefs.orders ? t.savedSearchOn : t.savedSearchOff, href: '/notifications' },
    { label: t.helpSupport, value: '', href: '/support' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.black, paddingTop: insets.top + 8 }}>
      <Row style={{ paddingHorizontal: 20, justifyContent: 'space-between' }}>
        <Text size={22} weight={700}>
          {t.profile}
        </Text>
        <LanguageToggle />
      </Row>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: 18, paddingBottom: 24 }}>
        {user ? (
          <Row style={{ paddingHorizontal: 20, gap: 14 }}>
            <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}>
              <Text size={22} weight={800}>
                {displayName.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text size={17} weight={700} numberOfLines={1}>
                {displayName}
              </Text>
              <Text size={12} color={colors.muted} style={{ marginTop: 2 }} numberOfLines={1}>
                {profile?.phone ? `${profile.phone} · ` : ''}
                {cityLabel}
              </Text>
            </View>
            <Button title={t.edit} variant="ghost" size="sm" onPress={() => router.push('/edit-profile')} />
          </Row>
        ) : (
          <View style={{ paddingHorizontal: 20 }}>
            <Card style={{ padding: 16 }}>
              <Text size={16} weight={700}>
                {t.guestGreeting}
              </Text>
              <Text size={13} color={colors.muted} lineHeight={1.5} style={{ marginTop: 6 }}>
                {t.guestSub}
              </Text>
              <Row style={{ gap: 10, marginTop: 14 }}>
                <Button title={t.signIn} size="md" style={{ flex: 1 }} onPress={() => router.push('/(auth)/sign-in')} />
                <Button title={t.signUp} variant="ghost" size="md" style={{ flex: 1 }} onPress={() => router.push('/(auth)/sign-up')} />
              </Row>
            </Card>
          </View>
        )}

        {/* Garage */}
        <Row style={{ paddingHorizontal: 20, marginTop: 26, justifyContent: 'space-between' }}>
          <SectionLabel>{t.garage}</SectionLabel>
          <Pressable accessibilityRole="button" onPress={() => router.push('/onboarding')} hitSlop={8}>
            <Text size={12} weight={600} color={colors.red}>
              + {t.addCar}
            </Text>
          </Pressable>
        </Row>
        <HScroll gap={10} style={{ marginTop: 10, flexGrow: 0 }}>
          {(garage && garage.length ? garage : vehicle ? [vehicle] : []).map((car) => {
            const active = vehicle?.make === car.make && vehicle?.model === car.model && vehicle?.year === car.year;
            return (
              <Pressable
                key={car.id}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => setVehicle(car)}
                style={{ width: 200, padding: 14, borderRadius: radius['3xl'], borderWidth: 1, borderColor: active ? colors.red : colors.borderSoft, backgroundColor: colors.surface }}
              >
                <PhotoPlaceholder style={{ height: 64, borderRadius: radius.lg }} stripe={6} />
                <Text size={14} weight={700} style={{ marginTop: 10 }}>
                  {vehicleLabel(car)}
                </Text>
                <Text size={11} color={colors.muted} monospace style={{ marginTop: 2 }}>
                  {car.vin ?? ''}
                </Text>
                {active ? (
                  <View style={{ marginTop: 8, alignSelf: 'flex-start' }}>
                    <Badge label={t.activeCar} height={22} />
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </HScroll>

        {user ? (
          <>
            {/* Saved searches */}
            <SectionLabel style={{ paddingHorizontal: 20, marginTop: 26 }}>{t.savedSearches}</SectionLabel>
            <View style={{ paddingHorizontal: 20, gap: 8, marginTop: 10 }}>
              {savedSearches?.map((search) => (
                <Row key={search.id} style={{ gap: 12, paddingVertical: 12, paddingHorizontal: 14, borderRadius: radius['2xl'], borderWidth: 1, borderColor: colors.borderSoft, backgroundColor: colors.surface }}>
                  <Icon name="search" size={18} color={colors.muted} />
                  <View style={{ flex: 1 }}>
                    <Text size={13} weight={600}>
                      {pick(search.query, lang)}
                    </Text>
                    <Text size={11} color={colors.muted} style={{ marginTop: 2 }}>
                      {pick(search.meta, lang)}
                    </Text>
                  </View>
                  <Toggle value={search.alertsEnabled} onChange={(enabled) => require(() => toggleAlerts.mutate({ id: search.id, enabled }), { reason: 'signInToSave', next: '/(buyer)/profile' })} />
                </Row>
              ))}
              {savedSearches?.length === 0 ? (
                <Text size={12} color={colors.muted}>
                  {t.noResults}
                </Text>
              ) : null}
            </View>

            {/* Orders */}
            <Row style={{ paddingHorizontal: 20, marginTop: 26, justifyContent: 'space-between' }}>
              <SectionLabel>{t.orders}</SectionLabel>
              <Pressable accessibilityRole="button" onPress={() => router.push('/orders')} hitSlop={8}>
                <Text size={12} weight={600} color={colors.red}>
                  {t.seeAll}
                </Text>
              </Pressable>
            </Row>
            <View style={{ paddingHorizontal: 20, gap: 8, marginTop: 10 }}>
              {orders?.slice(0, 3).map((order) => {
                const statusIndex = ORDER_STATUSES.indexOf(order.status);
                const delivered = order.status === 'delivered';
                return (
                  <Pressable key={order.id} accessibilityRole="button" onPress={() => router.push({ pathname: '/order/[id]', params: { id: order.id } })}>
                    <Row style={{ gap: 12, paddingVertical: 12, paddingHorizontal: 14, borderRadius: radius['2xl'], borderWidth: 1, borderColor: colors.borderSoft, backgroundColor: colors.surface }}>
                      <PhotoPlaceholder style={{ width: 48, height: 48, borderRadius: radius.lg }} stripe={6} />
                      <View style={{ flex: 1 }}>
                        <Text size={13} weight={600} numberOfLines={1}>
                          {pick(order.items[0]?.name ?? { en: '', ar: '' }, lang)}
                        </Text>
                        <Text size={11} color={colors.muted} style={{ marginTop: 2 }}>
                          #{order.reference} · {formatIqd(order.totalIqd)} {t.iqd}
                        </Text>
                      </View>
                      <Badge height={26} label={t.statuses[statusIndex] ?? ''} background={delivered ? colors.successBg : colors.warnBg} border={delivered ? colors.successBorder : colors.red} />
                    </Row>
                  </Pressable>
                );
              })}
              {orders?.length === 0 ? (
                <Text size={12} color={colors.muted}>
                  {t.noOrders}
                </Text>
              ) : null}
            </View>
          </>
        ) : null}

        {/* Settings */}
        <View style={{ paddingHorizontal: 20, marginTop: 22 }}>
          <ListGroup>
            {menu.map((item, index) => (
              <ListRow
                key={item.label}
                label={item.label}
                value={`${item.value}${item.value ? ' ' : ''}${isRTL ? '‹' : '›'}`}
                first={index === 0}
                onPress={() =>
                  item.href === '/support'
                    ? router.push(item.href as never)
                    : require(() => router.push(item.href as never), { reason: 'signInToGarage', next: item.href })
                }
              />
            ))}
          </ListGroup>
        </View>

        {/* Selling */}
        <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
          <Card style={{ padding: 14 }}>
            <Row style={{ gap: 12 }}>
              <Icon name="shop" size={20} color={colors.red} />
              <Text size={13} weight={600} style={{ flex: 1 }}>
                {user?.sellerId ? t.switchToSelling : t.sellerCta}
              </Text>
              <Button
                title={user?.sellerId ? t.tabShop : t.sellerCtaAction}
                size="sm"
                onPress={() =>
                  require(
                    () => {
                      if (user?.sellerId) {
                        setRole('seller');
                        router.replace('/(seller)/dashboard');
                      } else {
                        router.push('/(auth)/sell');
                      }
                    },
                    { reason: 'signInToSell', next: '/(auth)/sell' },
                  )
                }
              />
            </Row>
          </Card>
        </View>

        {user ? (
          <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
            <Button
              title={t.signOut}
              variant="ghost"
              size="md"
              style={{ backgroundColor: 'transparent' }}
              onPress={async () => {
                await signOut();
                router.replace('/(auth)/sign-in');
              }}
            />
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
