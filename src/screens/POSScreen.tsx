import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuthStore } from '../store/authStore';
import { useTableStore } from '../store/tableStore';
import { useCartStore } from '../store/cartStore';
import { useAreasAndTables, useCategories, useMenuItems, usePlaceKot, useKots } from '../hooks';
import ItemCard from '../components/pos/ItemCard';
import ItemCustomiseModal from '../components/pos/ItemCustomiseModal';
import TableActionsModal from '../components/tables/TableActionsModal';
import KotTransferModal from '../components/pos/KotTransferModal';
import KotDeleteModal from '../components/pos/KotDeleteModal';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import type { Item } from '../api/types';
import type { CartConfig } from '../api/types';

type Props = NativeStackScreenProps<RootStackParamList, 'POS'>;

type Tab = 'cart' | 'kot' | 'bill';

const POSScreen = ({ navigation }: Props) => {
  const currentTable = useTableStore(s => s.currentTable);
  const {
    getItemsForTable,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    activeTab,
    setActiveTab,
  } = useCartStore();

  const { categories, isLoadingCategories } = useCategories();
  const {
    filteredItems,
    selectedCategoryId,
    itemSearchQuery,
    isLoadingItems,
    selectCategory,
    refetch: refetchItems,
  } = useMenuItems();

  const { place, isPlacing, error: placeError } = usePlaceKot();
  const outletId = useAuthStore(s => s.user?.outletId ?? '');
  const staffId = useAuthStore(s => s.user?.id ?? '');
  const { kots, isLoading: kotsLoading, refetch: refetchKots } = useKots(
    currentTable?.id,
    outletId,
  );

  const [customiseItem, setCustomiseItem] = useState<Item | null>(null);
  const [tableActionsVisible, setTableActionsVisible] = useState(false);
  const [kotTransferVisible, setKotTransferVisible] = useState(false);
  const [kotDeleteVisible, setKotDeleteVisible] = useState(false);

  const { grouped } = useAreasAndTables();
  const allTablesForTransfer = React.useMemo(
    () => (currentTable ? grouped.flatMap(g => g.tables).filter(t => t.id !== currentTable.id) : []),
    [grouped, currentTable?.id],
  );

  const cartItems = currentTable ? getItemsForTable(currentTable.id) : [];
  const cartTotal = cartItems.reduce((s, c) => s + c.totalPrice, 0);
  const cartCount = cartItems.reduce((s, c) => s + c.quantity, 0);

  useEffect(() => {
    refetchKots();
  }, [currentTable?.id, refetchKots]);

  const handleAddToCart = (config: CartConfig, quantity: number) => {
    if (!currentTable || !customiseItem) return;
    addToCart(currentTable.id, customiseItem, config, quantity);
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
    } else {
      Alert.alert('Order failed', result.error ?? 'Could not place order.');
    }
  };

  if (!currentTable) {
    return (
      <View style={styles.centered}>
        <Text style={styles.noTable}>No table selected</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Back to Tables</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'cart', label: `Cart (${cartCount})` },
    { key: 'kot', label: 'KOT' },
    { key: 'bill', label: 'Bill' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Switch table</Text>
        </TouchableOpacity>
        <Text style={styles.tableName}>{currentTable.name}</Text>
        <TouchableOpacity
          style={styles.tableActionsBtn}
          onPress={() => setTableActionsVisible(true)}
        >
          <Text style={styles.tableActionsBtnText}>Table actions</Text>
        </TouchableOpacity>
      </View>

      <TableActionsModal
        visible={tableActionsVisible}
        onClose={() => setTableActionsVisible(false)}
        currentTable={currentTable}
        grouped={grouped}
        onSwitchTable={() => navigation.navigate('Tables')}
        onTransferOrMergeSuccess={refetchKots}
      />

      <KotTransferModal
        visible={kotTransferVisible}
        onClose={() => setKotTransferVisible(false)}
        kots={kots}
        fromTableId={currentTable.id}
        tables={allTablesForTransfer}
        staffId={staffId}
        outletId={outletId}
        onSuccess={refetchKots}
      />
      <KotDeleteModal
        visible={kotDeleteVisible}
        onClose={() => setKotDeleteVisible(false)}
        kots={kots}
        tableId={currentTable.id}
        outletId={outletId}
        staffId={staffId}
        onSuccess={refetchKots}
      />

      <View style={styles.tabRow}>
        {tabs.map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            style={[styles.tab, activeTab === key && styles.tabActive]}
            onPress={() => setActiveTab(key)}
          >
            <Text style={[styles.tabText, activeTab === key && styles.tabTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'cart' && (
        <>
          <ScrollView style={styles.categories} horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[styles.catChip, !selectedCategoryId && styles.catChipActive]}
              onPress={() => selectCategory(null)}
            >
              <Text style={styles.catChipText}>All</Text>
            </TouchableOpacity>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.catChip, selectedCategoryId === cat.id && styles.catChipActive]}
                onPress={() => selectCategory(cat.id)}
              >
                <Text style={styles.catChipText}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {(isLoadingCategories || isLoadingItems) && filteredItems.length === 0 ? (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color="#FFD700" />
            </View>
          ) : (
            <FlatList
              data={filteredItems}
              keyExtractor={item => item.id}
              numColumns={2}
              contentContainerStyle={styles.itemGrid}
              columnWrapperStyle={styles.itemRow}
              renderItem={({ item }) => (
                <ItemCard item={item} onPress={() => setCustomiseItem(item)} />
              )}
            />
          )}

          {cartItems.length > 0 && (
            <ScrollView style={styles.cartList} contentContainerStyle={styles.cartListContent}>
              {cartItems.map(line => (
                <View key={line.cartId} style={styles.cartLine}>
                  <Text style={styles.cartLineName}>
                    {line.name}
                    {line.variantName ? ` (${line.variantName})` : ''} × {line.quantity}
                  </Text>
                  <Text style={styles.cartLinePrice}>₹{line.totalPrice.toFixed(0)}</Text>
                  <View style={styles.cartLineActions}>
                    <TouchableOpacity
                      onPress={() => updateQuantity(currentTable.id, line.cartId, -1)}
                      style={styles.qtyBtn}
                    >
                      <Text style={styles.qtyBtnText}>−</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => updateQuantity(currentTable.id, line.cartId, 1)}
                      style={styles.qtyBtn}
                    >
                      <Text style={styles.qtyBtnText}>+</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => removeFromCart(currentTable.id, line.cartId)}
                      style={styles.removeBtn}
                    >
                      <Text style={styles.removeBtnText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}

          <View style={styles.cartBar}>
            <View>
              <Text style={styles.cartCount}>{cartCount} items</Text>
              <Text style={styles.cartTotal}>₹{cartTotal.toFixed(0)}</Text>
            </View>
            <TouchableOpacity
              style={[styles.placeBtn, (isPlacing || cartCount === 0) && styles.placeBtnDisabled]}
              onPress={handlePlaceOrder}
              disabled={isPlacing || cartCount === 0}
            >
              {isPlacing ? (
                <ActivityIndicator color="#0F172A" size="small" />
              ) : (
                <Text style={styles.placeBtnText}>Place order</Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}

      {activeTab === 'kot' && (
        <ScrollView style={styles.kotList}>
          <View style={styles.kotActions}>
            <TouchableOpacity
              style={styles.kotActionBtn}
              onPress={() => setKotTransferVisible(true)}
              disabled={kots.length === 0}
            >
              <Text style={styles.kotActionBtnText}>Transfer items</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.kotActionBtn}
              onPress={() => setKotDeleteVisible(true)}
              disabled={kots.length === 0}
            >
              <Text style={styles.kotActionBtnText}>Delete items</Text>
            </TouchableOpacity>
          </View>
          {kotsLoading ? (
            <ActivityIndicator color="#FFD700" style={styles.kotLoading} />
          ) : kots.length === 0 ? (
            <Text style={styles.emptyKot}>No KOTs for this table</Text>
          ) : (
            kots.map(kot => (
              <View key={kot.id} style={styles.kotCard}>
                <Text style={styles.kotTitle}>KOT #{kot.kotInvoiceNumber}</Text>
                {kot.items.map(i => (
                  <Text key={i.id} style={styles.kotItem}>
                    {i.name} × {i.quantity} — ₹{i.itemPrice * i.quantity}
                  </Text>
                ))}
              </View>
            ))
          )}
        </ScrollView>
      )}

      {activeTab === 'bill' && (
        <View style={styles.billPlaceholder}>
          <Text style={styles.billPlaceholderText}>Bill</Text>
          <TouchableOpacity
            style={styles.billNavBtn}
            onPress={() => navigation.navigate('Bill')}
          >
            <Text style={styles.billNavBtnText}>Open Bill →</Text>
          </TouchableOpacity>
        </View>
      )}

      <ItemCustomiseModal
        visible={Boolean(customiseItem)}
        item={customiseItem}
        onClose={() => setCustomiseItem(null)}
        onAdd={handleAddToCart}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  noTable: { color: '#94A3B8', marginBottom: 16 },
  backBtn: { backgroundColor: '#334155', padding: 16, borderRadius: 12 },
  backBtnText: { color: '#F8FAFC', fontWeight: '600' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#334155' },
  backButton: { marginRight: 12 },
  backText: { color: '#FFD700', fontSize: 16 },
  tableName: { flex: 1, fontSize: 18, fontWeight: '700', color: '#F8FAFC' },
  tableActionsBtn: { paddingVertical: 8, paddingHorizontal: 12 },
  tableActionsBtnText: { color: '#94A3B8', fontWeight: '600', fontSize: 14 },
  tabRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  tab: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#1E293B' },
  tabActive: { backgroundColor: '#FFD700' },
  tabText: { color: '#94A3B8', fontWeight: '600' },
  tabTextActive: { color: '#0F172A' },
  categories: { maxHeight: 48, paddingVertical: 8, paddingLeft: 16 },
  catChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1E293B', marginRight: 8 },
  catChipActive: { backgroundColor: '#FFD700' },
  catChipText: { color: '#F8FAFC', fontWeight: '600' },
  loading: { flex: 1, justifyContent: 'center' },
  itemGrid: { padding: 16, paddingBottom: 120 },
  itemRow: { gap: 12, marginBottom: 12 },
  cartBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#1E293B',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    elevation: 8,
    zIndex: 10,
  },
  cartCount: { fontSize: 12, color: '#94A3B8' },
  cartTotal: { fontSize: 20, fontWeight: '800', color: '#FFD700' },
  placeBtn: { backgroundColor: '#FFD700', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12 },
  placeBtnDisabled: { opacity: 0.6 },
  placeBtnText: { color: '#0F172A', fontWeight: '700' },
  cartList: { maxHeight: 200, backgroundColor: '#1E293B', marginHorizontal: 16, borderRadius: 12, marginBottom: 8 },
  cartListContent: { padding: 12 },
  cartLine: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  cartLineName: { flex: 1, color: '#F8FAFC', fontSize: 14 },
  cartLinePrice: { color: '#FFD700', fontWeight: '700', marginRight: 8 },
  cartLineActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  qtyBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#334155', justifyContent: 'center', alignItems: 'center' },
  qtyBtnText: { color: '#F8FAFC', fontWeight: '700' },
  removeBtn: { paddingHorizontal: 8 },
  removeBtnText: { color: '#F87171', fontSize: 12 },
  kotList: { flex: 1, padding: 16 },
  kotActions: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  kotActionBtn: { flex: 1, backgroundColor: '#1E293B', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  kotActionBtnText: { color: '#FFD700', fontWeight: '600', fontSize: 14 },
  kotLoading: { marginTop: 24 },
  emptyKot: { color: '#64748B', textAlign: 'center', marginTop: 24 },
  kotCard: { backgroundColor: '#1E293B', borderRadius: 12, padding: 16, marginBottom: 12 },
  kotTitle: { fontSize: 16, fontWeight: '700', color: '#FFD700', marginBottom: 8 },
  kotItem: { fontSize: 14, color: '#F8FAFC', marginBottom: 4 },
  billPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  billPlaceholderText: { fontSize: 20, color: '#94A3B8', marginBottom: 16 },
  billNavBtn: { backgroundColor: '#FFD700', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12 },
  billNavBtnText: { color: '#0F172A', fontWeight: '700' },
});

export default POSScreen;
