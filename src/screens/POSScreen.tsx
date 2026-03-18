import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import { useTableStore } from '../store/tableStore';
import { useCartStore } from '../store/cartStore';
import { useBillStore } from '../store/billStore';
import {
  useAreasAndTables,
  useCategories,
  useMenuItems,
  usePlaceKot,
  useKots,
  useBillPreview,
  useBillByTable,
  useBillGenerate,
} from '../hooks';
import { cartLineToConfig } from '../api/cartUtils';
import { reprintKot } from '../api';
import { canPlaceKot } from '../utils/permissions';
import ItemCard from '../components/pos/ItemCard';
import ItemCustomiseModal from '../components/pos/ItemCustomiseModal';
import RepeatLastOrNewModal from '../components/pos/RepeatLastOrNewModal';
import DecrementLineModal from '../components/pos/DecrementLineModal';
import CartModal from '../components/pos/CartModal';
import CartListSection from '../components/pos/CartListSection';
import KotCard from '../components/pos/KotCard';
import KotReprintConfirmModal from '../components/pos/KotReprintConfirmModal';
import SearchInput from '../components/SearchInput';
import TableActionsModal from '../components/tables/TableActionsModal';
import KotTransferModal from '../components/pos/KotTransferModal';
import KotDeleteModal from '../components/pos/KotDeleteModal';
import BillGeneratedWarningModal from '../components/tables/BillGeneratedWarningModal';
import Sidebar from '../components/Sidebar';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import type { Item } from '../api/types';
import type { CartConfig, CartItem } from '../api/types';
import { colors, borderBrutal, neoCard, neoButtonTertiary, shadowBrutal } from '../theme/neoBrutalism';

type Props = NativeStackScreenProps<RootStackParamList, 'POS'>;

type Tab = 'cart' | 'kot' | 'bill';

const POSScreen = ({ navigation }: Props) => {
  const currentTable = useTableStore(s => s.currentTable);
  const hasBillForTable = useBillStore(s => s.hasBillForTable);
  const getBillEntry = useBillStore(s => s.getBillEntry);
  const billForTab = useBillStore(s => (currentTable ? s.getBillForTable(currentTable.id) : null));
  const setBillForTable = useBillStore(s => s.setBillForTable);
  const { fetchPreview, isLoading: previewLoading } = useBillPreview();
  const { refresh: refetchBill, isRefreshing: billRefreshing } = useBillByTable(currentTable?.id);
  const { generate: generateBill, isGenerating: isGeneratingBill } = useBillGenerate();
  const {
    getItemsForTable,
    addToCart,
    updateQuantity,
    updateNotes,
    removeFromCart,
    findSimilarItems,
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
    setItemSearchQuery,
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
  const [repeatItem, setRepeatItem] = useState<Item | null>(null);
  const [decrementContext, setDecrementContext] = useState<{ itemName: string; lines: CartItem[] } | null>(null);
  const [cartModalVisible, setCartModalVisible] = useState(false);
  const [addItemsModalVisible, setAddItemsModalVisible] = useState(false);
  const [reprintKotId, setReprintKotId] = useState<string | null>(null);
  const [reprintKotNumber, setReprintKotNumber] = useState<number | null>(null);
  const [isReprinting, setIsReprinting] = useState(false);
  const [tableActionsVisible, setTableActionsVisible] = useState(false);
  const [kotTransferVisible, setKotTransferVisible] = useState(false);
  const [kotDeleteVisible, setKotDeleteVisible] = useState(false);
  const [showAddMoreItems, setShowAddMoreItems] = useState(false);
  const [addMoreFromKotVisible, setAddMoreFromKotVisible] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [postKotRefreshing, setPostKotRefreshing] = useState(false);
  const [genBillWarningVisible, setGenBillWarningVisible] = useState(false);

  const { grouped, refetch: refetchTables } = useAreasAndTables();
  const allTablesForTransfer = React.useMemo(
    () => (currentTable ? grouped.flatMap(g => g.tables).filter(t => t.id !== currentTable.id) : []),
    [grouped, currentTable?.id],
  );

  const cartItems = currentTable ? getItemsForTable(currentTable.id) : [];
  const cartTotal = cartItems.reduce((s, c) => s + c.totalPrice, 0);
  const cartCount = cartItems.reduce((s, c) => s + c.quantity, 0);

  const kotCount = kots?.length ?? 0;
  const isEmptyTable = kotCount === 0 && cartItems.length === 0;
  const billEntry = currentTable ? getBillEntry(currentTable.id) : null;
  const hasBill = !!billEntry?.bill?.id;
  const showBillTab = kotCount > 0 || hasBill;




  // Removed aggressive tab-flipping useEffect to prevent race conditions during order placement.
  // Instead, we trust the manual and automatic tab switches.

  useEffect(() => {
    if (activeTab === 'bill' && currentTable && kotCount > 0) {
      if (hasBillForTable(currentTable.id)) refetchBill();
      else fetchPreview();
    }
  }, [activeTab, currentTable?.id, kotCount, hasBillForTable, refetchBill, fetchPreview]);

  const handleAddToCart = (config: CartConfig, quantity: number) => {
    if (!currentTable || !customiseItem) return;
    addToCart(currentTable.id, customiseItem, config, quantity);
  };

  const itemHasOptions = (item: Item) => {
    const variants = item.itemVariants?.length ?? 0;
    const addons = item.itemAddons?.length ?? 0;
    return variants >= 2 || addons > 0;
  };

  const defaultConfigForItem = (item: Item): CartConfig => {
    const first = item.itemVariants?.[0];
    return {
      variantId: first?.id ?? undefined,
      variantName: first?.name ?? undefined,
      addons: [],
    };
  };

  const getQuantityForItem = (itemId: string) => {
    if (!currentTable) return 0;
    const similar = findSimilarItems(currentTable.id, itemId);
    return similar.reduce((s, c) => s + c.quantity, 0);
  };

  const handleAddItem = (item: Item) => {
    if (!currentTable) return;
    if (!itemHasOptions(item)) {
      addToCart(currentTable.id, item, defaultConfigForItem(item), 1);
      return;
    }
    const similar = findSimilarItems(currentTable.id, item.id);
    if (similar.length === 0) {
      setCustomiseItem(item);
      return;
    }
    setRepeatItem(item);
  };

  const handleIncrementItem = (item: Item) => {
    if (!currentTable) return;
    if (!itemHasOptions(item)) {
      addToCart(currentTable.id, item, defaultConfigForItem(item), 1);
      return;
    }
    const similar = findSimilarItems(currentTable.id, item.id);
    if (similar.length === 0) {
      setCustomiseItem(item);
      return;
    }
    setRepeatItem(item);
  };

  const handleDecrementItem = (item: Item) => {
    if (!currentTable) return;
    const similar = findSimilarItems(currentTable.id, item.id);
    if (similar.length === 0) return;
    if (similar.length === 1) {
      updateQuantity(currentTable.id, similar[0].cartId, -1);
      return;
    }
    setDecrementContext({ itemName: item.name, lines: similar });
  };

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
      setPostKotRefreshing(true);
      try {
        await Promise.all([refetchKots(), refetchTables()]);
      } finally {
        setPostKotRefreshing(false);
      }
      setCartModalVisible(false);
      const data = await generateBill();
      if (data) {
        setGenBillWarningVisible(true);
        // Already fetched by generateBill hook which calls setBillForTable
      } else {
        setActiveTab('kot');
      }
    } else {
      Alert.alert('Order failed', result.error ?? 'Could not place order.');
    }
  };

  const handleReprintKot = async () => {
    if (!reprintKotId) return;
    setIsReprinting(true);
    try {
      await reprintKot(reprintKotId);
      setReprintKotId(null);
      setReprintKotNumber(null);
      refetchKots();
    } catch (err) {
      Alert.alert('Reprint failed', err instanceof Error ? err.message : 'Could not reprint');
    } finally {
      setIsReprinting(false);
    }
  };

  if (!currentTable) {
    return (
      <View style={styles.centered}>
        <Text style={styles.noTable}>No table selected</Text>
        <Pressable
          style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.7 : 1 }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backBtnText}>Back to Tables</Text>
        </Pressable>
      </View>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'cart' as const, label: cartItems.length > 0 ? `Cart (${cartCount})` : 'Order' },
    { key: 'kot' as const, label: "KOT's" },
    ...(showBillTab ? [{ key: 'bill' as const, label: 'Bill' }] : []),
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable
            onPress={() => setSidebarOpen(true)}
            style={({ pressed }) => [styles.burgerBtn, { opacity: pressed ? 0.7 : 1 }]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Open menu"
          >
            <Text style={styles.burgerIcon}>☰</Text>
          </Pressable>
          <Pressable
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.backButton, { opacity: pressed ? 0.7 : 1 }]}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.backText}>← Switch table</Text>
          </Pressable>
        </View>
        <View style={styles.headerCenter}>
          <Text style={styles.tableName} numberOfLines={1}>{currentTable.name}</Text>
          {(currentTable.isMergedParent || (currentTable.mergedTableNames?.length ?? 0) > 0) ? (
            <View style={styles.mergedBadge}>
              <Text style={styles.mergedBadgeIcon}>🔗</Text>
              <Text style={styles.mergedBadgeText} numberOfLines={1}>
                Merged: {currentTable.mergedTableDisplay ?? currentTable.mergedTableNames?.join(', ') ?? '—'}
              </Text>
            </View>
          ) : null}
        </View>
        <Pressable
          style={({ pressed }) => [styles.tableActionsBtn, { opacity: pressed ? 0.7 : 1 }]}
          onPress={() => setTableActionsVisible(true)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.tableActionsBtnText}>Table actions</Text>
        </Pressable>
      </View>

      <Sidebar
        visible={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={() => {
          setSidebarOpen(false);
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        }}
      />

      <TableActionsModal
        visible={tableActionsVisible}
        onClose={() => setTableActionsVisible(false)}
        currentTable={currentTable}
        grouped={grouped}
        onSwitchTable={() => navigation.navigate('MainTabs')}
        onTransferOrMergeSuccess={() => {
          refetchKots();
          refetchTables();
          navigation.navigate('MainTabs');
        }}
      />

      <KotTransferModal
        visible={kotTransferVisible}
        onClose={() => setKotTransferVisible(false)}
        kots={kots}
        fromTableId={currentTable.id}
        tables={allTablesForTransfer}
        staffId={staffId}
        outletId={outletId}
        onSuccess={() => {
          refetchKots();
          refetchTables();
          navigation.navigate('MainTabs');
        }}
      />
      <KotDeleteModal
        visible={kotDeleteVisible}
        onClose={() => setKotDeleteVisible(false)}
        kots={kots}
        tableId={currentTable.id}
        outletId={outletId}
        staffId={staffId}
        onSuccess={async () => {
          await refetchKots();
        }}
      />

      <View style={styles.tabRow}>
        {tabs.map(({ key, label }) => (
          <Pressable
            key={key}
            style={({ pressed }) => [
              styles.tab,
              activeTab === key && styles.tabActive,
              key === 'kot' && styles.tabWithBadge,
              { opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={() => setActiveTab(key)}
          >
            <Text style={[styles.tabText, activeTab === key && styles.tabTextActive]}>{label}</Text>
            {key === 'kot' && kotCount > 0 && (
              <View style={styles.kotBadge}>
                <Text style={styles.kotBadgeText}>{kotCount}</Text>
              </View>
            )}
          </Pressable>
        ))}
      </View>

      {activeTab === 'cart' && (() => {
        const hasKot = kots.length > 0;
        const showItemPicker = !hasKot || showAddMoreItems;
        return (
          <>
            {showItemPicker ? (
              <View style={styles.cartTabContentWrapper}>
                {isEmptyTable && (
                  <View style={styles.emptyTableBanner}>
                    <Text style={styles.emptyTableBannerText}>Add items to place order</Text>
                  </View>
                )}
                {hasKot && (
                  <View style={styles.addMoreHeader}>
                    <Text style={styles.addMoreHeaderTitle}>Add more items</Text>
                    <Pressable
                      style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                      onPress={() => setShowAddMoreItems(false)}
                    >
                      <Text style={styles.addMoreHeaderDone}>Done</Text>
                    </Pressable>
                  </View>
                )}
                <View style={styles.cartTabContent}>
                  <View style={styles.categoryListWrap}>
                    <ScrollView style={styles.categoryList} showsVerticalScrollIndicator={false}>
                      <Pressable
                        style={({ pressed }) => [
                          styles.categoryChip,
                          !selectedCategoryId && styles.categoryChipActive,
                          { opacity: pressed ? 0.7 : 1 },
                        ]}
                        onPress={() => selectCategory(null)}
                      >
                        <Text style={[styles.categoryChipText, !selectedCategoryId && styles.categoryChipTextActive]} numberOfLines={1}>All</Text>
                      </Pressable>
                      {categories.map(cat => (
                        <Pressable
                          key={cat.id}
                          style={({ pressed }) => [
                            styles.categoryChip,
                            selectedCategoryId === cat.id && styles.categoryChipActive,
                            { opacity: pressed ? 0.7 : 1 },
                          ]}
                          onPress={() => selectCategory(cat.id)}
                        >
                          <Text style={[styles.categoryChipText, selectedCategoryId === cat.id && styles.categoryChipTextActive]} numberOfLines={2}>{cat.name}</Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                  <View style={styles.dishesWrap}>
                    <View style={styles.searchWrap}>
                      <SearchInput
                        value={itemSearchQuery}
                        onChange={setItemSearchQuery}
                        placeholder="Search dishes"
                        style={styles.searchInput}
                      />
                    </View>
                    {(isLoadingCategories || isLoadingItems) && filteredItems.length === 0 ? (
                      <View style={styles.dishesLoading}>
                        <ActivityIndicator size="large" color={colors.tertiary} />
                      </View>
                    ) : (
                      <FlatList
                        data={filteredItems}
                        keyExtractor={item => item.id}
                        contentContainerStyle={styles.itemList}
                        renderItem={({ item }) => (
                          <ItemCard
                            item={item}
                            quantityInCart={getQuantityForItem(item.id)}
                            onAdd={() => handleAddItem(item)}
                            onIncrement={() => handleIncrementItem(item)}
                            onDecrement={() => handleDecrementItem(item)}
                            fullWidth
                          />
                        )}
                      />
                    )}
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.cartTabContent}>
                <View style={styles.addMorePlaceholder}>
                  <Text style={styles.addMorePlaceholderText}>Order already placed. Add more items to this table.</Text>
                </View>
              </View>
            )}
            {cartItems.length > 0 && (
              <View style={styles.cartListSection}>
                <CartListSection
                  items={cartItems}
                  onUpdateQuantity={(cartId, delta) => currentTable && updateQuantity(currentTable.id, cartId, delta)}
                  onUpdateNotes={(cartId, notes) => currentTable && updateNotes(currentTable.id, cartId, notes)}
                  onDecrementRequest={handleCartDecrementRequest}
                  onRemove={(cartId) => currentTable && removeFromCart(currentTable.id, cartId)}
                />
              </View>
            )}
            {hasKot && !showAddMoreItems ? (
              <View style={styles.cartBar}>
                {cartItems.length > 0 && (
                  <Text style={styles.cartSummary}>
                    {cartCount} {cartCount === 1 ? 'item' : 'items'} · ₹{cartTotal.toFixed(0)}
                  </Text>
                )}
                {cartItems.length > 0 && (
                  <Pressable
                    style={({ pressed }) => [styles.placeOrderBtn, { opacity: pressed ? 0.7 : 1 }]}
                    onPress={() => navigation.navigate('LiveCart')}
                  >
                    <Text style={styles.placeOrderBtnText}>Show Cart</Text>
                  </Pressable>
                )}
                <Pressable
                  style={({ pressed }) => [styles.addMoreItemBtn, { opacity: pressed ? 0.7 : 1 }]}
                  onPress={() => setShowAddMoreItems(true)}
                >
                  <Text style={styles.addMoreItemBtnText}>Add more item</Text>
                </Pressable>
              </View>
            ) : cartItems.length > 0 ? (
              <View style={styles.cartBar}>
                <Text style={styles.cartSummary}>
                  {cartCount} {cartCount === 1 ? 'item' : 'items'} · ₹{cartTotal.toFixed(0)}
                </Text>
                <Pressable
                  style={({ pressed }) => [styles.placeOrderBtn, { opacity: pressed ? 0.7 : 1 }]}
                  onPress={() => navigation.navigate('LiveCart')}
                >
                  <Text style={styles.placeOrderBtnText}>Show Cart</Text>
                </Pressable>
              </View>
            ) : null}
          </>
        );
      })()}

      {activeTab === 'kot' && (
        <>
          <View style={styles.kotToolbar}>
            <Pressable
              style={({ pressed }) => [
                styles.kotToolbarBtn,
                kots.length === 0 && styles.kotToolbarBtnDisabled,
                { opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={() => setKotTransferVisible(true)}
              disabled={kots.length === 0}
            >
              <Text style={styles.kotToolbarBtnText}>Item transfer</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.kotToolbarBtn,
                kots.length === 0 && styles.kotToolbarBtnDisabled,
                { opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={() => setKotDeleteVisible(true)}
              disabled={kots.length === 0}
            >
              <Text style={styles.kotToolbarBtnText}>Delete items</Text>
            </Pressable>
          </View>
          <ScrollView style={styles.kotList} contentContainerStyle={kots.length > 0 ? styles.kotListWithAddMore : undefined}>
            {kotsLoading ? (
              <Text style={styles.kotLoading}>Loading KOTs…</Text>
            ) : kots.length === 0 ? (
              <Text style={styles.emptyKot}>No KOTs for this table</Text>
            ) : (
              kots.map(kot => (
                <KotCard
                  key={kot.id}
                  kot={kot}
                  onReprint={() => {
                    setReprintKotId(kot.id);
                    setReprintKotNumber(kot.kotInvoiceNumber);
                  }}
                />
              ))
            )}
          </ScrollView>
          {kotCount > 0 && (
            <View style={styles.kotTabFooter}>
              <Pressable
                style={({ pressed }) => [
                  styles.generateBillBtn,
                  isGeneratingBill && styles.btnDisabled,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
                onPress={async () => {
                  const data = await generateBill();
                  if (data) {
                    setGenBillWarningVisible(true);
                  }
                }}
                disabled={isGeneratingBill}
              >
                {isGeneratingBill ? (
                  <ActivityIndicator color={colors.background} size="small" />
                ) : (
                  <Text style={styles.generateBillBtnText}>Generate Bill</Text>
                )}
              </Pressable>
            </View>
          )}
        </>
      )}

      {activeTab === 'bill' && (
        <View style={styles.billTabContent}>
          {billRefreshing || previewLoading ? (
            <View style={styles.billLoading}>
              <ActivityIndicator color={colors.tertiary} size="large" />
              <Text style={styles.billLoadingText}>Loading bill…</Text>
            </View>
          ) : !billForTab ? (
             <View style={styles.billEmpty}>
               <Text style={styles.billEmptyText}>Generate the bill to see the bill summary and settle.</Text>
               <Pressable
                 style={({ pressed }) => [
                   styles.billNavBtn,
                   isGeneratingBill && styles.btnDisabled,
                   { opacity: pressed ? 0.7 : 1 }
                 ]}
                 onPress={async () => {
                   const data = await generateBill();
                   if (data) {
                     setGenBillWarningVisible(true);
                   }
                 }}
                 disabled={isGeneratingBill}
               >
                 {isGeneratingBill ? (
                   <ActivityIndicator color={colors.background} size="small" />
                 ) : (
                   <Text style={styles.billNavBtnText}>Generate Bill</Text>
                 )}
               </Pressable>
             </View>
          ) : (
            <ScrollView style={styles.billScroll} contentContainerStyle={styles.billScrollContent}>
              {!billForTab.id && (
                <View style={styles.previewBanner}>
                  <Text style={styles.previewBannerText}>Preview only — read only</Text>
                </View>
              )}
              {billForTab.items?.map(item => (
                <View key={item.id} style={styles.billLineRow}>
                  <Text style={styles.billLineName}>{item.itemName} × {item.quantity}</Text>
                  <Text style={styles.billLineAmount}>
                    ₹{((item.itemPrice * item.quantity) + (item.containerCharge ?? 0)).toFixed(0)}
                  </Text>
                </View>
              ))}
              <View style={styles.billPayableRow}>
                <Text style={styles.billPayableLabel}>Payable</Text>
                <Text style={styles.billPayableValue}>₹{billForTab.payable?.toFixed(0) ?? '0'}</Text>
              </View>
            </ScrollView>
          )}
          {billForTab && (
            <View style={styles.billTabFooter}>
              <Pressable
                style={({ pressed }) => [styles.billNavBtn, { opacity: pressed ? 0.7 : 1 }]}
                onPress={() => navigation.navigate('Bill')}
              >
                <Text style={styles.billNavBtnText}>Open Bill →</Text>
              </Pressable>
            </View>
          )}
        </View>
      )}

      <ItemCustomiseModal
        visible={Boolean(customiseItem)}
        item={customiseItem}
        onClose={() => setCustomiseItem(null)}
        onAdd={handleAddToCart}
      />

      <RepeatLastOrNewModal
        visible={Boolean(repeatItem)}
        itemName={repeatItem?.name ?? ''}
        onClose={() => setRepeatItem(null)}
        onRepeatLast={() => {
          if (!currentTable || !repeatItem) return;
          const similar = findSimilarItems(currentTable.id, repeatItem.id);
          const last = similar[similar.length - 1];
          if (last) {
            const config = cartLineToConfig(last);
            addToCart(currentTable.id, repeatItem, config, 1);
          }
          setRepeatItem(null);
        }}
        onAddNew={() => {
          if (repeatItem) setCustomiseItem(repeatItem);
          setRepeatItem(null);
        }}
      />

      <DecrementLineModal
        visible={Boolean(decrementContext)}
        itemName={decrementContext?.itemName ?? ''}
        lines={decrementContext?.lines ?? []}
        onClose={() => setDecrementContext(null)}
        onSelectLine={cartId => {
          if (currentTable) updateQuantity(currentTable.id, cartId, -1);
          setDecrementContext(null);
        }}
      />

      <CartModal
        visible={cartModalVisible}
        items={cartItems}
        onClose={() => setCartModalVisible(false)}
        onUpdateQuantity={(cartId, delta) => currentTable && updateQuantity(currentTable.id, cartId, delta)}
        onUpdateNotes={(cartId, notes) => currentTable && updateNotes(currentTable.id, cartId, notes)}
        onPlaceOrder={handlePlaceOrder}
        isPlacing={isPlacing}
        onDecrementRequest={handleCartDecrementRequest}
        onRemove={(cartId) => currentTable && removeFromCart(currentTable.id, cartId)}
      />

      <KotReprintConfirmModal
        visible={Boolean(reprintKotId)}
        kotNumber={reprintKotNumber ?? undefined}
        onClose={() => { setReprintKotId(null); setReprintKotNumber(null); }}
        onConfirm={handleReprintKot}
        isReprinting={isReprinting}
      />

      {addItemsModalVisible && (
        <Modal visible animationType="slide" transparent={false}>
          <View style={styles.addItemsModal}>
            <View style={styles.addItemsModalHeader}>
              <Text style={styles.addItemsModalTitle}>Add items</Text>
              <Pressable
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                onPress={() => setAddItemsModalVisible(false)}
              >
                <Text style={styles.addItemsModalClose}>Done</Text>
              </Pressable>
            </View>
            <ScrollView horizontal style={styles.categories} showsHorizontalScrollIndicator={false}>
              <Pressable
                style={({ pressed }) => [
                  styles.catChip,
                  !selectedCategoryId && styles.catChipActive,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
                onPress={() => selectCategory(null)}
              >
                <Text style={styles.catChipText}>All</Text>
              </Pressable>
              {categories.map(cat => (
                <Pressable
                  key={cat.id}
                  style={({ pressed }) => [
                    styles.catChip,
                    selectedCategoryId === cat.id && styles.catChipActive,
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                  onPress={() => selectCategory(cat.id)}
                >
                  <Text style={styles.catChipText}>{cat.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
            {(isLoadingCategories || isLoadingItems) && filteredItems.length === 0 ? (
              <View style={styles.loading}>
                <ActivityIndicator size="large" color={colors.tertiary} />
              </View>
            ) : (
              <FlatList
                data={filteredItems}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.itemList}
                renderItem={({ item }) => (
                  <ItemCard
                    item={item}
                    quantityInCart={getQuantityForItem(item.id)}
                    onAdd={() => handleAddItem(item)}
                    onIncrement={() => handleIncrementItem(item)}
                    onDecrement={() => handleDecrementItem(item)}
                    fullWidth
                  />
                )}
              />
            )}
          </View>
        </Modal>
      )}

      {addMoreFromKotVisible && (
        <Modal visible animationType="slide" transparent={false}>
          <View style={styles.addMoreKotModal}>
            <View style={styles.addMoreHeader}>
              <Text style={styles.addMoreHeaderTitle}>Add more items</Text>
              <Pressable
                style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
                onPress={() => setAddMoreFromKotVisible(false)}
              >
                <Text style={styles.addMoreHeaderDone}>Done</Text>
              </Pressable>
            </View>
            <View style={styles.cartTabContent}>
              <View style={styles.categoryListWrap}>
                <ScrollView style={styles.categoryList} showsVerticalScrollIndicator={false}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.categoryChip,
                      !selectedCategoryId && styles.categoryChipActive,
                      { opacity: pressed ? 0.7 : 1 },
                    ]}
                    onPress={() => selectCategory(null)}
                  >
                    <Text style={[styles.categoryChipText, !selectedCategoryId && styles.categoryChipTextActive]} numberOfLines={1}>All</Text>
                  </Pressable>
                  {categories.map(cat => (
                    <Pressable
                      key={cat.id}
                      style={({ pressed }) => [
                        styles.categoryChip,
                        selectedCategoryId === cat.id && styles.categoryChipActive,
                        { opacity: pressed ? 0.7 : 1 },
                      ]}
                      onPress={() => selectCategory(cat.id)}
                    >
                      <Text style={[styles.categoryChipText, selectedCategoryId === cat.id && styles.categoryChipTextActive]} numberOfLines={2}>{cat.name}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
              <View style={styles.dishesWrap}>
                <View style={styles.searchWrap}>
                  <SearchInput
                    value={itemSearchQuery}
                    onChange={setItemSearchQuery}
                    placeholder="Search dishes"
                    style={styles.searchInput}
                  />
                </View>
                {(isLoadingCategories || isLoadingItems) && filteredItems.length === 0 ? (
                  <View style={styles.dishesLoading}>
                    <ActivityIndicator size="large" color={colors.tertiary} />
                  </View>
                ) : (
                  <FlatList
                    data={filteredItems}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.itemList}
                    renderItem={({ item }) => (
                      <ItemCard
                        item={item}
                        quantityInCart={getQuantityForItem(item.id)}
                        onAdd={() => handleAddItem(item)}
                        onIncrement={() => handleIncrementItem(item)}
                        onDecrement={() => handleDecrementItem(item)}
                        fullWidth
                      />
                    )}
                  />
                )}
              </View>
            </View>
          </View>
        </Modal>
      )}

      {cartItems.length > 0 && (activeTab === 'kot') && (
        <Pressable
          style={({ pressed }) => [styles.globalCartBar, { opacity: pressed ? 0.8 : 1 }]}
          onPress={() => navigation.navigate('LiveCart')}
        >
          <Text style={styles.globalCartBarText}>
            Show cart · {cartCount} {cartCount === 1 ? 'item' : 'items'} · ₹{cartTotal.toFixed(0)}
          </Text>
        </Pressable>
      )}

      {postKotRefreshing && (
        <View style={styles.postKotOverlay}>
          <ActivityIndicator size="large" color={colors.tertiary} />
          <Text style={styles.postKotOverlayText}>Updating table…</Text>
        </View>
      )}

      <BillGeneratedWarningModal
        visible={genBillWarningVisible}
        onClose={() => {
          setGenBillWarningVisible(false);
          setActiveTab('bill');
        }}
        actionType="generate"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  noTable: { color: colors.mutedForeground, marginBottom: 16 },
  backBtn: { ...borderBrutal, backgroundColor: colors.base200, padding: 16 },
  backBtnText: { color: colors.foreground, fontWeight: '600' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 3,
    borderBottomColor: colors.brutalBorder,
    backgroundColor: colors.base100,
    zIndex: 10,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', marginHorizontal: 8 },
  mergedBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 4, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: colors.base200, borderRadius: 8, maxWidth: '100%' },
  mergedBadgeIcon: { fontSize: 12, marginRight: 4 },
  mergedBadgeText: { fontSize: 11, color: colors.mutedForeground, fontWeight: '600', flex: 1 },
  burgerBtn: {
    padding: 8,
    minWidth: 40,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  burgerIcon: { fontSize: 22, fontWeight: '700', color: colors.foreground },
  backButton: { paddingVertical: 4 },
  backText: { color: colors.tertiary, fontSize: 16 },
  tableName: { fontSize: 18, fontWeight: '700', color: colors.foreground, textAlign: 'center' },
  showCartBtn: { ...neoButtonTertiary, paddingVertical: 8, paddingHorizontal: 12, marginRight: 8 },
  showCartBtnText: { color: colors.background, fontWeight: '700', fontSize: 14, textTransform: 'uppercase' as const },
  tableActionsBtn: { paddingVertical: 8, paddingHorizontal: 12 },
  tableActionsBtnText: { color: colors.mutedForeground, fontWeight: '600', fontSize: 14 },
  tabRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, gap: 8 },
  tab: { ...borderBrutal, paddingVertical: 10, paddingHorizontal: 16, backgroundColor: colors.base200, borderRadius: 12 },
  tabWithBadge: { position: 'relative' as const },
  tabActive: { backgroundColor: colors.tertiary },
  tabText: { color: colors.mutedForeground, fontWeight: '600' },
  tabTextActive: { color: colors.background, fontWeight: '700' },
  kotBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#ff3b30',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  kotBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  categories: { maxHeight: 48, paddingVertical: 8, paddingLeft: 16 },
  catChip: { ...borderBrutal, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: colors.base200, marginRight: 8, borderRadius: 20 },
  catChipActive: { backgroundColor: colors.tertiary },
  catChipText: { color: colors.foreground, fontWeight: '600' },
  loading: { flex: 1, justifyContent: 'center' },
  itemGrid: { padding: 16, paddingBottom: 120 },
  itemList: { paddingBottom: 24 },
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
    backgroundColor: colors.base100,
    borderTopWidth: 3,
    borderTopColor: colors.brutalBorder,
    ...shadowBrutal,
    zIndex: 10,
  },
  cartTabContentWrapper: { flex: 1 },
  cartTabContent: { flex: 1, flexDirection: 'row', padding: 0 },
  emptyTableBanner: { paddingVertical: 10, paddingHorizontal: 16, backgroundColor: colors.base200, borderBottomWidth: 3, borderBottomColor: colors.brutalBorder },
  emptyTableBannerText: { fontSize: 14, color: colors.mutedForeground, textAlign: 'center' },
  addMoreHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 3, borderBottomColor: colors.brutalBorder, backgroundColor: colors.base100 },
  addMoreHeaderTitle: { fontSize: 16, fontWeight: '700', color: colors.foreground },
  addMoreHeaderDone: { color: colors.tertiary, fontWeight: '600', fontSize: 16 },
  addMorePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  addMorePlaceholderText: { color: colors.mutedForeground, textAlign: 'center', fontSize: 15 },
  addMoreItemBtn: { ...neoButtonTertiary, width: '100%', paddingVertical: 14, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center' },
  addMoreItemBtnText: { color: colors.background, fontWeight: '700', fontSize: 16, textTransform: 'uppercase' as const },
  categoryListWrap: { width: 100, borderRightWidth: 3, borderRightColor: colors.brutalBorder, paddingVertical: 8 },
  categoryList: { paddingHorizontal: 8 },
  categoryChip: { ...borderBrutal, paddingVertical: 12, paddingHorizontal: 10, backgroundColor: colors.base200, marginBottom: 6, borderRadius: 12 },
  categoryChipActive: { backgroundColor: colors.tertiary },
  categoryChipText: { color: colors.foreground, fontWeight: '600', fontSize: 13 },
  categoryChipTextActive: { color: colors.background },
  dishesWrap: { flex: 1, paddingHorizontal: 12, paddingTop: 8 },
  searchWrap: { marginBottom: 12 },
  searchInput: { marginBottom: 0 },
  dishesLoading: { flex: 1, justifyContent: 'center', minHeight: 120 },
  cartListSection: { paddingHorizontal: 16, paddingVertical: 8, borderTopWidth: 3, borderTopColor: colors.brutalBorder, backgroundColor: colors.base100, maxHeight: 200 },
  cartSummary: { fontSize: 16, fontWeight: '700', color: colors.tertiary },
  cartTotal: { fontSize: 20, fontWeight: '800', color: colors.tertiary },
  placeOrderBtn: { ...neoButtonTertiary, paddingVertical: 14, paddingHorizontal: 24 },
  placeOrderBtnDisabled: { opacity: 0.6 },
  placeOrderBtnText: { color: colors.background, fontWeight: '700', fontSize: 16, textTransform: 'uppercase' as const },
  kotToolbar: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: colors.base100, borderBottomWidth: 3, borderBottomColor: colors.brutalBorder },
  kotToolbarBtn: { ...borderBrutal, flex: 1, backgroundColor: colors.base200, paddingVertical: 12, alignItems: 'center' },
  kotToolbarBtnText: { color: colors.tertiary, fontWeight: '600', fontSize: 14, textTransform: 'uppercase' as const },
  kotToolbarBtnDisabled: { opacity: 0.5 },
  kotList: { flex: 1, padding: 16 },
  kotListWithAddMore: { paddingBottom: 80 },
  kotTabFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: colors.base100,
    borderTopWidth: 3,
    borderTopColor: colors.brutalBorder,
    ...shadowBrutal,
    zIndex: 10,
  },
  generateBillBtn: {
    ...neoButtonTertiary,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  generateBillBtnText: {
    color: colors.background,
    fontWeight: '800',
    fontSize: 16,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  addMoreKotModal: { flex: 1, backgroundColor: colors.background },
  globalCartBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: colors.base100,
    borderTopWidth: 3,
    borderTopColor: colors.brutalBorder,
    ...shadowBrutal,
    zIndex: 10,
  },
  globalCartBarText: { fontSize: 16, fontWeight: '700', color: colors.tertiary, textTransform: 'uppercase' as const },
  kotActions: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  kotActionBtn: { ...borderBrutal, flex: 1, backgroundColor: colors.base200, paddingVertical: 12, alignItems: 'center' },
  kotActionBtnText: { color: colors.tertiary, fontWeight: '600', fontSize: 14 },
  kotLoading: { marginTop: 24 },
  emptyKot: { color: colors.mutedForeground, textAlign: 'center', marginTop: 24 },
  addItemsModal: { flex: 1, backgroundColor: colors.background },
  addItemsModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 3, borderBottomColor: colors.brutalBorder },
  addItemsModalTitle: { fontSize: 18, fontWeight: '700', color: colors.foreground },
  addItemsModalClose: { color: colors.tertiary, fontWeight: '600', fontSize: 16 },
  billTabContent: { flex: 1 },
  billLoading: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  billLoadingText: { color: colors.mutedForeground, marginTop: 12 },
  billEmpty: { flex: 1, justifyContent: 'center', padding: 24 },
  billEmptyText: { color: colors.mutedForeground, textAlign: 'center', marginBottom: 20 },
  billScroll: { flex: 1 },
  billScrollContent: { padding: 16, paddingBottom: 80 },
  previewBanner: { ...borderBrutal, backgroundColor: colors.base200, padding: 12, marginBottom: 16 },
  previewBannerText: { color: colors.tertiary, fontWeight: '600', textAlign: 'center' },
  billLineRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  billLineName: { color: colors.foreground, fontSize: 14 },
  billLineAmount: { color: colors.tertiary, fontWeight: '600' },
  billPayableRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, paddingTop: 12, borderTopWidth: 3, borderTopColor: colors.brutalBorder },
  billPayableLabel: { fontSize: 18, fontWeight: '700', color: colors.foreground },
  billPayableValue: { fontSize: 20, fontWeight: '800', color: colors.tertiary },
  billTabFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: colors.base100, borderTopWidth: 3, borderTopColor: colors.brutalBorder },
  billNavBtn: { ...neoButtonTertiary, paddingVertical: 14, paddingHorizontal: 24, alignItems: 'center' },
  billNavBtnText: { color: colors.background, fontWeight: '700', textTransform: 'uppercase' as const },
  btnDisabled: { opacity: 0.6 },
  postKotOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(12, 10, 9, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  postKotOverlayText: { color: colors.foreground, marginTop: 12, fontSize: 14, fontWeight: '600' },
});

export default POSScreen;
