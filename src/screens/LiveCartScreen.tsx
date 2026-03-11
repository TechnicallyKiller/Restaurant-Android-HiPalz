import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import { useTableStore } from '../store/tableStore';
import { useCartStore } from '../store/cartStore';
import { useBillStore } from '../store/billStore';
import { useThemeStore } from '../store/themeStore';
import { usePlaceKot, useKots } from '../hooks';
import { canPlaceKot } from '../utils/permissions';
import { getColors, borderBrutal, neoButtonTertiary } from '../theme/neoBrutalism';
import CartListSection from '../components/pos/CartListSection';
import DecrementLineModal from '../components/pos/DecrementLineModal';
import Sidebar from '../components/Sidebar';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import type { CartItem } from '../api/types';

const EMPTY_CART: CartItem[] = [];

type Props = NativeStackScreenProps<RootStackParamList, 'LiveCart'>;

export default function LiveCartScreen({ navigation }: Props) {
  const currentTable = useTableStore(s => s.currentTable);
  const tableId = currentTable?.id ?? null;
  const cartItems = useCartStore(s => {
    if (!tableId) return EMPTY_CART;
    const cart = s.cartsByTableId[tableId];
    return cart ?? EMPTY_CART;
  });
  const updateQuantity = useCartStore(s => s.updateQuantity);
  const updateNotes = useCartStore(s => s.updateNotes);
  const removeFromCart = useCartStore(s => s.removeFromCart);
  const findSimilarItems = useCartStore(s => s.findSimilarItems);
  const setActiveTab = useCartStore(s => s.setActiveTab);
  const getBillEntry = useBillStore(s => s.getBillEntry);

  const outletId = useAuthStore(s => s.user?.outletId ?? '');
  const { place, isPlacing } = usePlaceKot();
  const { refetch: refetchKots } = useKots(currentTable?.id, outletId);

  const [decrementContext, setDecrementContext] = useState<{ itemName: string; lines: CartItem[] } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isDark = useThemeStore(s => s.isDark);
  const c = getColors(isDark);
  const cartTotal = cartItems.reduce((s, c) => s + c.totalPrice, 0);
  const cartCount = cartItems.reduce((s, c) => s + c.quantity, 0);
  const billEntry = currentTable ? getBillEntry(currentTable.id) : null;
  const billSplit = billEntry?.bill?.isSplit ?? false;
  const canPlace = currentTable && cartItems.length > 0 && !billSplit && canPlaceKot();

  useEffect(() => {
    if (currentTable && cartItems.length === 0) {
      navigation.replace('POS');
    }
  }, [currentTable?.id, cartItems.length, navigation]);

  const handleCartDecrementRequest = (line: CartItem) => {
    if (!currentTable) return;
    if (line.quantity > 1) {
      updateQuantity(currentTable.id, line.cartId, -1);
      return;
    }
    const similar = findSimilarItems(currentTable.id, line.areaItemId);
    if (similar.length <= 1) updateQuantity(currentTable.id, line.cartId, -1);
    else setDecrementContext({ itemName: line.name, lines: similar });
  };

  const handlePlaceOrder = async () => {
    if (!currentTable) return;
    if (cartItems.length === 0) {
      Alert.alert('Cart empty', 'Add items before placing order.');
      return;
    }
    const result = await place();
    if (result.success) {
      refetchKots();
      setActiveTab('kot');
      navigation.replace('POS');
    } else {
      Alert.alert('Order failed', result.error ?? 'Could not place order.');
    }
  };

  if (!currentTable) {
    return (
      <SafeAreaView style={[styles.container, styles.centered, { backgroundColor: c.background }]} edges={['top']}>
        <Text style={[styles.noTable, { color: c.mutedForeground }]}>No table selected</Text>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: c.base200, borderColor: c.brutalBorder }]} onPress={() => navigation.goBack()}>
          <Text style={[styles.backBtnText, { color: c.foreground }]}>Back to POS</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: c.base100, borderBottomColor: c.brutalBorder }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Text style={[styles.backText, { color: c.tertiary }]}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: c.foreground }]}>Live Cart</Text>
        <TouchableOpacity style={styles.burgerBtn} onPress={() => setSidebarOpen(true)}>
          <Text style={[styles.burgerIcon, { color: c.foreground }]}>☰</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.tableLabel, { backgroundColor: c.base100, borderBottomColor: c.brutalBorder }]}>
        <Text style={[styles.tableLabelText, { color: c.mutedForeground }]}>{currentTable.name}</Text>
      </View>

      <View style={styles.listWrap} pointerEvents="box-none">
        <CartListSection
          items={cartItems}
          onUpdateQuantity={(cartId, delta) => currentTable && updateQuantity(currentTable.id, cartId, delta)}
          onUpdateNotes={(cartId, notes) => currentTable && updateNotes(currentTable.id, cartId, notes)}
          onDecrementRequest={handleCartDecrementRequest}
          onRemove={(cartId) => currentTable && removeFromCart(currentTable.id, cartId)}
        />
      </View>

      {cartItems.length > 0 && (
        <View style={[styles.footer, { backgroundColor: c.base100, borderTopColor: c.brutalBorder }]}>
          <Text style={[styles.summary, { color: c.tertiary }]}>
            {cartCount} {cartCount === 1 ? 'item' : 'items'} · ₹{cartTotal.toFixed(0)}
          </Text>
          {canPlace ? (
            <TouchableOpacity
              style={[styles.placeOrderBtn, isPlacing && styles.placeOrderBtnDisabled, { backgroundColor: c.tertiary, borderColor: c.brutalBorder }]}
              onPress={handlePlaceOrder}
              disabled={isPlacing}
            >
              {isPlacing ? (
                <ActivityIndicator color={c.background} size="small" />
              ) : (
                <Text style={[styles.placeOrderBtnText, { color: c.background }]}>Place order</Text>
              )}
            </TouchableOpacity>
          ) : billSplit ? (
            <Text style={[styles.cantPlaceHint, { color: c.mutedForeground }]}>Bill is split; place order from POS.</Text>
          ) : null}
        </View>
      )}

      <DecrementLineModal
        visible={Boolean(decrementContext)}
        itemName={decrementContext?.itemName ?? ''}
        lines={decrementContext?.lines ?? []}
        onClose={() => setDecrementContext(null)}
        onSelectLine={(cartId) => {
          if (currentTable) updateQuantity(currentTable.id, cartId, -1);
          setDecrementContext(null);
        }}
      />

      <Sidebar
        visible={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={() => {
          setSidebarOpen(false);
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  noTable: { marginBottom: 16 },
  backBtn: { ...borderBrutal, padding: 16 },
  backBtnText: { fontWeight: '600' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 3,
    zIndex: 10,
  },
  backButton: { marginRight: 12 },
  backText: { fontSize: 16 },
  title: { flex: 1, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  burgerBtn: { padding: 8, minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'flex-end' },
  burgerIcon: { fontSize: 24, fontWeight: '700' },
  tableLabel: { paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 2 },
  tableLabelText: { fontSize: 14, fontWeight: '600' },
  listWrap: { flex: 1 },
  footer: {
    padding: 16,
    borderTopWidth: 3,
  },
  summary: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  placeOrderBtn: {
    ...neoButtonTertiary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  placeOrderBtnDisabled: { opacity: 0.6 },
  placeOrderBtnText: { fontWeight: '700', fontSize: 16, textTransform: 'uppercase' as const },
  cantPlaceHint: { fontSize: 14 },
});
