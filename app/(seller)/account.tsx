import React from 'react';
import { ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { VerifiedDot } from '../../src/components/Icon';
import { LanguageToggle } from '../../src/components/chrome';
import { Badge, Button, ListGroup, ListRow, Row, SectionLabel, StatTile, Text } from '../../src/components/ui';
import { useT } from '../../src/i18n';
import { formatIqd, pick } from '../../src/lib/format';
import { useSeller } from '../../src/hooks/queries';
import { useMySellerId } from '../../src/hooks/useMyShop';
import { useSession } from '../../src/state/session';
import { useStore } from '../../src/state/store';
import { SELLER_BALANCE } from '../../src/data/fixtures';
import { colors, radius } from '../../src/theme';

/** S1 · Seller account — balance, verification, settings. */
export default function SellerAccount() {
  const { t, lang, row, toggleLang } = useT();
  const insets = useSafeAreaInsets();
  const { setRole } = useStore();
  const { user, signOut } = useSession();
  const { data: seller } = useSeller(useMySellerId());

  // The signed-in account's own name wins over the seeded seller record.
  const displayName = user?.fullName || user?.email || (seller ? pick(seller.name, lang) : '');

  const stats = [
    { value: '4.2M', label: t.accStats[0], delta: '+12%' },
    { value: String(SELLER_BALANCE.ordersCount), label: t.accStats[1], delta: '+8' },
    { value: String(SELLER_BALANCE.rating), label: t.accStats[2], delta: '★' },
  ];

  const menuActions: (() => void)[] = [
    () => router.push('/(seller)/shop'),
    () => router.push('/(seller)/orders'),
    () => router.push('/notifications'),
    () => router.push('/payout-method'),
    () => router.push('/support'),
    toggleLang,
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.black, paddingTop: insets.top + 8 }}>
      <Row style={{ paddingHorizontal: 20, justifyContent: 'space-between' }}>
        <Text size={22} weight={700}>
          {t.account}
        </Text>
        <LanguageToggle />
      </Row>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 24 }}
      >
        <Row gap={14}>
          <View
            style={{
              width: 60,
              height: 60,
              borderRadius: 30,
              backgroundColor: colors.surface,
              borderWidth: 2,
              borderColor: colors.red,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text size={22} weight={800}>
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text size={17} weight={700} numberOfLines={1}>
              {displayName}
            </Text>
            <Row gap={6} style={{ marginTop: 2 }}>
              <VerifiedDot />
              <Text size={12} color={colors.muted} numberOfLines={1}>
                {t.verifiedSeller} · {t.member} {seller?.memberSince}
              </Text>
            </Row>
            {user ? (
              <Text size={11} color={colors.muted} style={{ marginTop: 2 }} numberOfLines={1}>
                {t.signedInAs} {user.email}
              </Text>
            ) : null}
          </View>
        </Row>

        {/* Balance */}
        <View
          style={{
            marginTop: 20,
            borderRadius: radius.card,
            padding: 18,
            backgroundColor: colors.red,
            overflow: 'hidden',
          }}
        >
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              right: -30,
              top: -40,
              width: 160,
              height: 160,
              borderRadius: 80,
              backgroundColor: 'rgba(255,255,255,.08)',
            }}
          />
          <Text size={11} weight={600} letterSpacing={2} style={{ opacity: 0.85 }}>
            {t.balance}
          </Text>
          <Row gap={6} style={{ marginTop: 6, alignItems: 'baseline' }}>
            <Text size={30} weight={800}>
              {formatIqd(SELLER_BALANCE.availableIqd)}
            </Text>
            <Text size={13} weight={600}>
              {t.iqd}
            </Text>
          </Row>
          <Row style={{ marginTop: 14, justifyContent: 'space-between', gap: 12 }}>
            <Text size={12} style={{ opacity: 0.85, flex: 1 }}>
              {t.nextPayout} · {t.thursday}
            </Text>
            <Button
              title={t.withdraw}
              size="sm"
              onPress={() => router.push('/withdraw')}
              style={{ backgroundColor: colors.white }}
            />
          </Row>
        </View>

        <Row style={{ gap: 8, marginTop: 14 }}>
          {stats.map((stat) => (
            <StatTile key={stat.label} value={stat.value} label={stat.label} delta={stat.delta} />
          ))}
        </Row>

        {/* Verification */}
        <SectionLabel style={{ marginTop: 24 }}>{t.verification}</SectionLabel>
        <View style={{ marginTop: 10 }}>
          <ListGroup>
            {t.docs.map(([label, state], index) => (
              <ListRow
                key={label}
                label={label}
                first={index === 0}
                trailing={
                  <Badge
                    label={state}
                    height={24}
                    background={index < 2 ? colors.successBg : colors.warnBg}
                    border={index < 2 ? colors.successBorder : colors.red}
                  />
                }
              />
            ))}
          </ListGroup>
        </View>

        {/* Menu */}
        <View style={{ marginTop: 22 }}>
          <ListGroup>
            {t.accMenu.map(([label, fallback], index) => {
              const value = index === 3 && seller?.payoutMethod
                ? (seller.payoutMethod.kind === 'zaincash' ? t.payoutZain : seller.payoutMethod.kind === 'bank' ? t.payoutBank : t.payoutCash)
                : fallback;
              return (
              <ListRow
                key={label}
                label={label}
                value={`${value}${value ? ' ' : ''}›`}
                first={index === 0}
                onPress={menuActions[index]}
              />
              );
            })}
          </ListGroup>
        </View>

        <Button
          title={t.switchToBuying}
          variant="ghost"
          size="md"
          style={{ marginTop: 16, backgroundColor: 'transparent' }}
          onPress={() => {
            setRole('buyer');
            router.replace('/(buyer)');
          }}
        />
        <Button
          title={t.logout}
          variant="ghost"
          size="md"
          style={{ marginTop: 10, backgroundColor: 'transparent' }}
          onPress={async () => {
            await signOut();
            setRole('buyer');
            router.replace('/(buyer)');
          }}
        />
      </ScrollView>
    </View>
  );
}
