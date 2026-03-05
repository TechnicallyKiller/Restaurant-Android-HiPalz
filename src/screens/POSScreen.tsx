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
  Modal,
  TextInput,
} from 'react-native';
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
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import type { Item } from '../api/types';
import type { CartConfig, CartItem } from '../api/types';

type Props = NativeStackScreenProps<RootStackParamList, 'POS'>;

type Tab = 'cart' | 'kot' | 'bill';

const POSScreen = ({ navigation }: Props) => {
  const currentTable = useTableStore(s => s.currentTable);
  const hasBillForTable = useBillStore(s => s.hasBillForTable);
  const getBillEntry = useBillStore(s => s.getBillEntry);
  const getBillForTable = useBillStore(s => s.getBillForTable);
  const setBillForTable = useBillStore(s => s.setBillForTable);
  const { fetchPreview, isLoading: previewLoading } = useBillPreview();
  const { refresh: refetchBill, isRefreshing: billRefreshing } = useBillByTable(currentTable?.id);
  const { generate: generateBill, isGenerating: isGeneratingBill } = useBillGenerate();
  const {
    getItemsForTable,
    addToCart,
    updateQuantity,
    updateNotes,
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

  const { grouped } = useAreasAndTables();
  const allTablesForTransfer = React.useMemo(
    () => (currentTable ? grouped.flatMap(g => g.tables).filter(t => t.id !== currentTable.id) : []),
    [grouped, currentTable?.id],
  );

  const cartItems = currentTable ? getItemsForTable(currentTable.id) : [];
  const cartTotal = cartItems.reduce((s, c) => s + c.totalPrice, 0);
  const cartCount = cartItems.reduce((s, c) => s + c.quantity, 0);

  const isEmptyTable = kots.length === 0 && cartItems.length === 0;
  const showCartTab = true;
  const showBillTab = Boolean(
    currentTable && (cartItems.length > 0 || hasBillForTable(currentTable.id) || kots.length > 0)
  );
  const billEntry = currentTable ? getBillEntry(currentTable.id) : null;
  const billSplit = billEntry?.bill?.isSplit ?? false;

  useEffect(() => {
    refetchKots();
  }, [currentTable?.id, refetchKots]);


  useEffect(() => {
    if (activeTab === 'bill' && !showBillTab) setActiveTab(showCartTab ? 'cart' : 'kot');
  }, [activeTab, showBillTab, showCartTab, setActiveTab]);

  useEffect(() => {
    if (activeTab === 'bill' && currentTable) {
      if (hasBillForTable(currentTable.id)) refetchBill();
      else fetchPreview();
    }
  }, [activeTab, currentTable?.id, hasBillForTable, refetchBill, fetchPreview]);

  const billForTab = currentTable ? getBillForTable(currentTable.id) : null;

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
    const last = similar[similar.length - 1];
    const config = cartLineToConfig(last);
    addToCart(currentTable.id, item, config, 1);
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
      setCartModalVisible(false);
      setActiveTab('kot');
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
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Back to Tables</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'cart' as const, label: cartItems.length > 0 ? `Cart (${cartCount})` : 'Order' },
    { key: 'kot' as const, label: 'KOTs' },
    ...(showBillTab ? [{ key: 'bill' as const, label: 'Bill' }] : []),
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
                    <TouchableOpacity onPress={() => setShowAddMoreItems(false)}>
                      <Text style={styles.addMoreHeaderDone}>Done</Text>
                    </TouchableOpacity>
                  </View>
                )}
                <View style={styles.cartTabContent}>
                <View style={styles.categoryListWrap}>
                  <ScrollView style={styles.categoryList} showsVerticalScrollIndicator={false}>
                    <TouchableOpacity
                      style={[styles.categoryChip, !selectedCategoryId && styles.categoryChipActive]}
                      onPress={() => selectCategory(null)}
                    >
                      <Text style={[styles.categoryChipText, !selectedCategoryId && styles.categoryChipTextActive]} numberOfLines={1}>All</Text>
                    </TouchableOpacity>
                    {categories.map(cat => (
                      <TouchableOpacity
                        key={cat.id}
                        style={[styles.categoryChip, selectedCategoryId === cat.id && styles.categoryChipActive]}
                        onPress={() => selectCategory(cat.id)}
                      >
                        <Text style={[styles.categoryChipText, selectedCategoryId === cat.id && styles.categoryChipTextActive]} numberOfLines={2}>{cat.name}</Text>
                      </TouchableOpacity>
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
                      <ActivityIndicator size="large" color="#FFD700" />
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
                {cartItems.length > 0 && !billSplit && canPlaceKot() && (
                  <TouchableOpacity
                    style={[styles.placeOrderBtn, (isPlacing || cartCount === 0) && styles.placeOrderBtnDisabled]}
                    onPress={handlePlaceOrder}
                    disabled={isPlacing || cartCount === 0}
                  >
                    {isPlacing ? (
                      <ActivityIndicator color="#0F172A" size="small" />
                    ) : (
                      <Text style={styles.placeOrderBtnText}>Place order</Text>
                    )}
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.addMoreItemBtn} onPress={() => setShowAddMoreItems(true)}>
                  <Text style={styles.addMoreItemBtnText}>Add more item</Text>
                </TouchableOpacity>
              </View>
            ) : cartItems.length > 0 ? (
              <View style={styles.cartBar}>
                <Text style={styles.cartSummary}>
                  {cartCount} {cartCount === 1 ? 'item' : 'items'} · ₹{cartTotal.toFixed(0)}
                </Text>
                {!billSplit && canPlaceKot() && (
                  <TouchableOpacity
                    style={[styles.placeOrderBtn, (isPlacing || cartCount === 0) && styles.placeOrderBtnDisabled]}
                    onPress={handlePlaceOrder}
                    disabled={isPlacing || cartCount === 0}
                  >
                    {isPlacing ? (
                      <ActivityIndicator color="#0F172A" size="small" />
                    ) : (
                      <Text style={styles.placeOrderBtnText}>Place order</Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            ) : null}
          </>
        );
      })()}

      {activeTab === 'kot' && (
        <>
          <View style={styles.kotToolbar}>
            <TouchableOpacity
              style={[styles.kotToolbarBtn, kots.length === 0 && styles.kotToolbarBtnDisabled]}
              onPress={() => setKotTransferVisible(true)}
              disabled={kots.length === 0}
            >
              <Text style={styles.kotToolbarBtnText}>Item transfer</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.kotToolbarBtn, kots.length === 0 && styles.kotToolbarBtnDisabled]}
              onPress={() => setKotDeleteVisible(true)}
              disabled={kots.length === 0}
            >
              <Text style={styles.kotToolbarBtnText}>Delete items</Text>
            </TouchableOpacity>
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
            {kots.length > 0 && (
              <TouchableOpacity
                style={styles.kotAddMoreItemBtn}
                onPress={() => setAddMoreFromKotVisible(true)}
              >
                <Text style={styles.kotAddMoreItemBtnText}>Add more item</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </>
      )}

      {activeTab === 'bill' && (
        <View style={styles.billTabContent}>
          {billRefreshing || previewLoading ? (
            <View style={styles.billLoading}>
              <ActivityIndicator color="#FFD700" size="large" />
              <Text style={styles.billLoadingText}>Loading bill…</Text>
            </View>
          ) : !billForTab ? (
            <View style={styles.billEmpty}>
              <Text style={styles.billEmptyText}>Generate the bill to see the bill summary and settle.</Text>
              <TouchableOpacity
                style={styles.billNavBtn}
                onPress={() => navigation.navigate('Bill')}
              >
                <Text style={styles.billNavBtnText}>Open Bill</Text>
              </TouchableOpacity>
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
              <TouchableOpacity
                style={styles.billNavBtn}
                onPress={() => navigation.navigate('Bill')}
              >
                <Text style={styles.billNavBtnText}>Open Bill →</Text>
              </TouchableOpacity>
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
              <TouchableOpacity onPress={() => setAddItemsModalVisible(false)}>
                <Text style={styles.addItemsModalClose}>Done</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal style={styles.categories} showsHorizontalScrollIndicator={false}>
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
              <TouchableOpacity onPress={() => setAddMoreFromKotVisible(false)}>
                <Text style={styles.addMoreHeaderDone}>Done</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.cartTabContent}>
              <View style={styles.categoryListWrap}>
                <ScrollView style={styles.categoryList} showsVerticalScrollIndicator={false}>
                  <TouchableOpacity
                    style={[styles.categoryChip, !selectedCategoryId && styles.categoryChipActive]}
                    onPress={() => selectCategory(null)}
                  >
                    <Text style={[styles.categoryChipText, !selectedCategoryId && styles.categoryChipTextActive]} numberOfLines={1}>All</Text>
                  </TouchableOpacity>
                  {categories.map(cat => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.categoryChip, selectedCategoryId === cat.id && styles.categoryChipActive]}
                      onPress={() => selectCategory(cat.id)}
                    >
                      <Text style={[styles.categoryChipText, selectedCategoryId === cat.id && styles.categoryChipTextActive]} numberOfLines={2}>{cat.name}</Text>
                    </TouchableOpacity>
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
                    <ActivityIndicator size="large" color="#FFD700" />
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

      {cartItems.length > 0 && (activeTab === 'kot' || activeTab === 'bill') && (
        <TouchableOpacity
          style={styles.globalCartBar}
          onPress={() => setActiveTab('cart')}
          activeOpacity={0.8}
        >
          <Text style={styles.globalCartBarText}>
            View cart · {cartCount} {cartCount === 1 ? 'item' : 'items'} · ₹{cartTotal.toFixed(0)}
          </Text>
        </TouchableOpacity>
      )}
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
    backgroundColor: '#1E293B',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    elevation: 8,
    zIndex: 10,
  },
  cartTabContentWrapper: { flex: 1 },
  cartTabContent: { flex: 1, flexDirection: 'row', padding: 0 },
  emptyTableBanner: { paddingVertical: 10, paddingHorizontal: 16, backgroundColor: '#1E293B', borderBottomWidth: 1, borderBottomColor: '#334155' },
  emptyTableBannerText: { fontSize: 14, color: '#94A3B8', textAlign: 'center' },
  addMoreHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#334155', backgroundColor: '#1E293B' },
  addMoreHeaderTitle: { fontSize: 16, fontWeight: '700', color: '#F8FAFC' },
  addMoreHeaderDone: { color: '#FFD700', fontWeight: '600', fontSize: 16 },
  addMorePlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  addMorePlaceholderText: { color: '#94A3B8', textAlign: 'center', fontSize: 15 },
  addMoreItemBtn: { backgroundColor: '#FFD700', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  addMoreItemBtnText: { color: '#0F172A', fontWeight: '700', fontSize: 16 },
  categoryListWrap: { width: 100, borderRightWidth: 1, borderRightColor: '#334155', paddingVertical: 8 },
  categoryList: { paddingHorizontal: 8 },
  categoryChip: { paddingVertical: 12, paddingHorizontal: 10, borderRadius: 10, backgroundColor: '#1E293B', marginBottom: 6 },
  categoryChipActive: { backgroundColor: '#FFD700' },
  categoryChipText: { color: '#F8FAFC', fontWeight: '600', fontSize: 13 },
  categoryChipTextActive: { color: '#0F172A' },
  dishesWrap: { flex: 1, paddingHorizontal: 12, paddingTop: 8 },
  searchWrap: { marginBottom: 12 },
  searchInput: { marginBottom: 0 },
  dishesLoading: { flex: 1, justifyContent: 'center', minHeight: 120 },
  cartListSection: { paddingHorizontal: 16, paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#334155', backgroundColor: '#1E293B', maxHeight: 200 },
  cartSummary: { fontSize: 16, fontWeight: '700', color: '#FFD700' },
  cartTotal: { fontSize: 20, fontWeight: '800', color: '#FFD700' },
  placeOrderBtn: { backgroundColor: '#FFD700', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12 },
  placeOrderBtnDisabled: { opacity: 0.6 },
  placeOrderBtnText: { color: '#0F172A', fontWeight: '700', fontSize: 16 },
  kotToolbar: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#1E293B', borderBottomWidth: 1, borderBottomColor: '#334155' },
  kotToolbarBtn: { flex: 1, backgroundColor: '#334155', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  kotToolbarBtnText: { color: '#FFD700', fontWeight: '600', fontSize: 14 },
  kotToolbarBtnDisabled: { opacity: 0.5 },
  kotList: { flex: 1, padding: 16 },
  kotListWithAddMore: { paddingBottom: 24 },
  kotAddMoreItemBtn: { backgroundColor: '#FFD700', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, alignItems: 'center', marginHorizontal: 16, marginTop: 8 },
  kotAddMoreItemBtnText: { color: '#0F172A', fontWeight: '700', fontSize: 16 },
  addMoreKotModal: { flex: 1, backgroundColor: '#0F172A' },
  globalCartBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#1E293B',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    elevation: 8,
    zIndex: 10,
  },
  globalCartBarText: { fontSize: 16, fontWeight: '700', color: '#FFD700' },
  kotActions: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  kotActionBtn: { flex: 1, backgroundColor: '#1E293B', paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  kotActionBtnText: { color: '#FFD700', fontWeight: '600', fontSize: 14 },
  kotLoading: { marginTop: 24 },
  emptyKot: { color: '#64748B', textAlign: 'center', marginTop: 24 },
  addItemsModal: { flex: 1, backgroundColor: '#0F172A' },
  addItemsModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#334155' },
  addItemsModalTitle: { fontSize: 18, fontWeight: '700', color: '#F8FAFC' },
  addItemsModalClose: { color: '#FFD700', fontWeight: '600', fontSize: 16 },
  billTabContent: { flex: 1 },
  billLoading: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  billLoadingText: { color: '#94A3B8', marginTop: 12 },
  billEmpty: { flex: 1, justifyContent: 'center', padding: 24 },
  billEmptyText: { color: '#94A3B8', textAlign: 'center', marginBottom: 20 },
  billScroll: { flex: 1 },
  billScrollContent: { padding: 16, paddingBottom: 80 },
  previewBanner: { backgroundColor: '#334155', padding: 12, borderRadius: 8, marginBottom: 16 },
  previewBannerText: { color: '#FBBF24', fontWeight: '600', textAlign: 'center' },
  billLineRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  billLineName: { color: '#F8FAFC', fontSize: 14 },
  billLineAmount: { color: '#FFD700', fontWeight: '600' },
  billPayableRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#334155' },
  billPayableLabel: { fontSize: 18, fontWeight: '700', color: '#F8FAFC' },
  billPayableValue: { fontSize: 20, fontWeight: '800', color: '#FFD700' },
  billTabFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: '#1E293B', borderTopWidth: 1, borderTopColor: '#334155' },
  billNavBtn: { backgroundColor: '#FFD700', paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12, alignItems: 'center' },
  billNavBtnText: { color: '#0F172A', fontWeight: '700' },
});

export default POSScreen;
