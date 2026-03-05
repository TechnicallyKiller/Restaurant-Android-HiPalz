import { create } from 'zustand';
import type { CartItem, CartConfig, Item, CartTab } from '../api/types';
import { buildCartId } from '../api/cartUtils';

function buildCartItem(item: Item, config: CartConfig, quantity: number): CartItem {
  const variant = config.variantId
    ? item.itemVariants?.find(v => v.id === config.variantId)
    : null;
  const basePrice = variant
    ? (variant.price ?? (item.price + (variant.priceModifier ?? 0)))
    : item.price;

  const addons: CartItem['addons'] = [];
  for (const { addonChoiceId, quantity: addonQty } of config.addons) {
    if (addonQty <= 0) continue;
    for (const addon of item.itemAddons ?? []) {
      const choice = addon.itemAddonChoices.find(c => c.id === addonChoiceId);
      if (choice) {
        const totalQty = addonQty * quantity;
        addons.push({
          addonChoiceId: choice.id,
          addonName: choice.name,
          quantity: totalQty,
          price: choice.price * totalQty,
        });
        break;
      }
    }
  }
  const addonTotal = addons.reduce((s, a) => s + a.price, 0);
  const lineTotal = basePrice * quantity + addonTotal;
  const addonChoiceIds = config.addons.filter(a => a.quantity > 0).map(a => a.addonChoiceId);
  const cartId = buildCartId(item.id, config.variantId ?? null, addonChoiceIds);

  return {
    cartId,
    areaItemId: item.id,
    name: item.name,
    attribute: item.attribute ?? null,
    variantId: config.variantId ?? null,
    variantName: config.variantName ?? null,
    quantity,
    basePrice,
    totalPrice: lineTotal,
    containerCharge: 0,
    addons,
    notes: config.notes ?? '',
    itemVariants: item.itemVariants,
    itemAddons: item.itemAddons,
  };
}

interface CartState {
  cartsByTableId: Record<string, CartItem[]>;
  activeTab: CartTab;
  addToCart: (tableId: string, item: Item, config: CartConfig, quantity?: number) => void;
  updateQuantity: (tableId: string, cartId: string, delta: number) => void;
  updateNotes: (tableId: string, cartId: string, notes: string) => void;
  removeFromCart: (tableId: string, cartId: string) => void;
  updateCartItemForEdit: (
    tableId: string,
    oldCartId: string,
    item: Item,
    newConfig: CartConfig,
  ) => void;
  clearCart: (tableId: string) => void;
  findSimilarItems: (tableId: string, itemId: string) => CartItem[];
  getItemsForTable: (tableId: string) => CartItem[];
  setActiveTab: (tab: CartTab) => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  cartsByTableId: {},
  activeTab: 'cart',

  addToCart: (tableId, item, config, qty = 1) => {
    const cart = get().cartsByTableId[tableId] ?? [];
    const newLine = buildCartItem(item, config, qty);
    const existing = cart.find(c => c.cartId === newLine.cartId);
    let next: CartItem[];
    if (existing) {
      const q = existing.quantity + qty;
      const addonSum = existing.addons.reduce((s, a) => s + a.price, 0);
      const unitAddon = existing.quantity > 0 ? addonSum / existing.quantity : 0;
      next = cart.map(c =>
        c.cartId === newLine.cartId
          ? { ...c, quantity: q, totalPrice: (c.basePrice + unitAddon) * q }
          : c,
      );
    } else {
      next = [...cart, newLine];
    }
    set({
      cartsByTableId: { ...get().cartsByTableId, [tableId]: next },
      activeTab: 'cart',
    });
  },

  updateQuantity: (tableId, cartId, delta) => {
    const cart = get().cartsByTableId[tableId] ?? [];
    const line = cart.find(c => c.cartId === cartId);
    if (!line) return;
    const q = line.quantity + delta;
    if (q < 1) {
      set({
        cartsByTableId: {
          ...get().cartsByTableId,
          [tableId]: cart.filter(c => c.cartId !== cartId),
        },
      });
      return;
    }
    const addonTotal = line.addons.reduce((s, a) => s + a.price, 0);
    const unitAddon = line.quantity > 0 ? addonTotal / line.quantity : 0;
    set({
      cartsByTableId: {
        ...get().cartsByTableId,
        [tableId]: cart.map(c =>
          c.cartId === cartId
            ? { ...c, quantity: q, totalPrice: (c.basePrice + unitAddon) * q }
            : c,
        ),
      },
    });
  },

  updateNotes: (tableId, cartId, notes) => {
    const cart = get().cartsByTableId[tableId] ?? [];
    set({
      cartsByTableId: {
        ...get().cartsByTableId,
        [tableId]: cart.map(c => (c.cartId === cartId ? { ...c, notes } : c)),
      },
    });
  },

  removeFromCart: (tableId, cartId) => {
    const cart = get().cartsByTableId[tableId] ?? [];
    set({
      cartsByTableId: {
        ...get().cartsByTableId,
        [tableId]: cart.filter(c => c.cartId !== cartId),
      },
    });
  },

  updateCartItemForEdit: (tableId, oldCartId, item, newConfig) => {
    const cart = get().cartsByTableId[tableId] ?? [];
    const oldLine = cart.find(c => c.cartId === oldCartId);
    if (!oldLine) return;
    const newLine = buildCartItem(item, newConfig, oldLine.quantity);
    const rest = cart.filter(c => c.cartId !== oldCartId);
    const existing = rest.find(c => c.cartId === newLine.cartId);
    const next = existing
      ? rest.map(c =>
          c.cartId === newLine.cartId
            ? {
                ...c,
                quantity: c.quantity + newLine.quantity,
                totalPrice: c.totalPrice + newLine.totalPrice,
              }
            : c,
        )
      : [...rest, newLine];
    set({ cartsByTableId: { ...get().cartsByTableId, [tableId]: next } });
  },

  clearCart: tableId => {
    const next = { ...get().cartsByTableId };
    delete next[tableId];
    set({ cartsByTableId: next });
  },

  findSimilarItems: (tableId, itemId) => {
    const cart = get().cartsByTableId[tableId] ?? [];
    return cart.filter(c => c.areaItemId === itemId);
  },

  getItemsForTable: tableId => get().cartsByTableId[tableId] ?? [],

  setActiveTab: activeTab => set({ activeTab }),
}));
