import React from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { Icon } from '../src/components/Icon';
import { Button, Row, Text } from '../src/components/ui';
import { useT } from '../src/i18n';
import { pick } from '../src/lib/format';
import { useDeleteProduct, useProduct } from '../src/hooks/queries';
import { DEMO_SHOP_ID } from '../src/data/repository';
import { useStore } from '../src/state/store';
import { colors, radius } from '../src/theme';

/** S5 · Delete product confirmation dialog. */
export default function DeleteProduct() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, lang } = useT();
  const { vehicle } = useStore();
  const { data: product } = useProduct(id ?? '', vehicle);
  const remove = useDeleteProduct(DEMO_SHOP_ID);

  const confirm = async () => {
    if (id) await remove.mutateAsync(id);
    router.back();
  };

  return (
    <Pressable
      onPress={() => router.back()}
      style={{
        flex: 1,
        backgroundColor: 'rgba(0,0,0,.72)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <Pressable
        onPress={() => {}}
        style={{
          width: '100%',
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radius.sheet - 4,
          paddingHorizontal: 20,
          paddingTop: 24,
          paddingBottom: 20,
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
          <Icon name="trash" size={24} color={colors.red} />
        </View>
        <Text size={17} weight={700} align="center" style={{ marginTop: 14 }}>
          {t.deleteTitle}
        </Text>
        <Text size={13} color={colors.muted} align="center" lineHeight={1.5} style={{ marginTop: 6 }}>
          {product ? pick(product.name, lang) : ''}
          {'\n'}
          {t.deleteSub}
        </Text>
        <Row style={{ gap: 10, marginTop: 20, alignSelf: 'stretch' }}>
          <Button
            title={t.cancel}
            variant="ghost"
            size="md"
            style={{ flex: 1, backgroundColor: colors.black }}
            onPress={() => router.back()}
          />
          <Button
            title={t.delete}
            variant="danger"
            size="md"
            style={{ flex: 1 }}
            disabled={remove.isPending}
            onPress={confirm}
          />
        </Row>
      </Pressable>
    </Pressable>
  );
}
