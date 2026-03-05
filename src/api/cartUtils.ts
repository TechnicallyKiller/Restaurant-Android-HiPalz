import type {
  CartItem,
  CartConfig,
  PlaceOrderPayload,
  PlaceOrderCartLine,
  PlaceOrderCartLineAddon,
  PlaceOrderCartLineAddonChoice,
  PlaceOrderCartLineVariant,
} from './types';

/** Build CartConfig from a cart line for "repeat last" (same variant, addons, notes). */
export function cartLineToConfig(line: CartItem): CartConfig {
  const addonQtyPerUnit = line.quantity > 0 ? line.quantity : 1;
  return {
    variantId: line.variantId ?? undefined,
    variantName: line.variantName ?? undefined,
    addons: line.addons.map(a => ({
      addonChoiceId: a.addonChoiceId,
      quantity: Math.max(1, Math.round(a.quantity / addonQtyPerUnit)),
    })),
    notes: line.notes || undefined,
  };
}

/** Format: itemId_variantIdOrNovariant_sortedAddonIds ("noaddons" when no addons, for backward compatibility). */
export function buildCartId(
  itemId: string,
  variantId: string | null,
  addonChoiceIds: string[],
): string {
  const sorted = [...addonChoiceIds].sort();
  const addonPart = sorted.length ? sorted.join('_') : 'noaddons';
  return `${itemId}_${variantId ?? 'novariant'}_${addonPart}`;
}

/** Alias for buildCartId (same format). */
export const generateCartId = buildCartId;

export interface ParsedCartId {
  itemId: string;
  variantId: string | null;
  addonChoiceIds: string[];
}

/** Parse cartId to infer itemId, variant, and addon choice ids. Handles legacy "noaddons" segment. */
export function parseCartId(cartId: string): ParsedCartId {
  const parts = cartId.split('_');
  if (parts.length < 3) {
    return { itemId: parts[0] ?? '', variantId: parts[1] ?? null, addonChoiceIds: [] };
  }
  const itemId = parts[0];
  const variantId = parts[1] === 'novariant' ? null : parts[1];
  const addonPart = parts.slice(2).join('_');
  const addonChoiceIds =
    addonPart && addonPart !== 'noaddons' ? addonPart.split('_').filter(Boolean) : [];
  return { itemId, variantId, addonChoiceIds };
}

/** True if the cart line has a portion/variant (second segment !== "novariant"). */
export function cartIdHasPortion(cartId: string): boolean {
  return parseCartId(cartId).variantId != null;
}

/** True if the cart line has addons (third segment non-empty). */
export function cartIdHasAddons(cartId: string): boolean {
  return parseCartId(cartId).addonChoiceIds.length > 0;
}

export function buildPlaceOrderPayload(
  cartItems: CartItem[],
  outletId: string,
  tableId: string,
  captainId: string,
): PlaceOrderPayload {
  const cart: PlaceOrderCartLine[] = cartItems.map(item => {
    const variant: PlaceOrderCartLineVariant | null = item.variantId
      ? {
          itemVariantId: item.variantId,
          itemVariantName: item.variantName ?? '',
          price: item.basePrice,
        }
      : null;

    const itemAddons: PlaceOrderCartLineAddon[] = [];
    const addonGroups = new Map<string, PlaceOrderCartLineAddonChoice[]>();
    for (const a of item.addons) {
      const addon = item.itemAddons?.find(ia =>
        ia.itemAddonChoices.some(c => c.id === a.addonChoiceId),
      );
      const addonId = addon?.id ?? a.addonChoiceId;
      const choices = addonGroups.get(addonId) ?? [];
      const unitPrice = a.quantity > 0 ? a.price / a.quantity : 0;
      choices.push({
        itemAddonChoiceId: a.addonChoiceId,
        itemAddonChoiceName: a.addonName,
        quantity: a.quantity,
        price: unitPrice,
      });
      addonGroups.set(addonId, choices);
    }
    addonGroups.forEach((choices, addonId) => {
      const addon = item.itemAddons?.find(ia => ia.id === addonId);
      itemAddons.push({
        itemAddonId: addonId,
        itemAddonName: addon?.name ?? choices[0]?.itemAddonChoiceName ?? '',
        itemAddonChoices: choices,
      });
    });

    return {
      itemId: item.areaItemId,
      name: item.name,
      quantity: item.quantity,
      price: item.basePrice,
      containerCharge: item.containerCharge,
      variant,
      itemAddons,
      notes: item.notes || undefined,
    };
  });

  return { outletId, tableId, captainId, cart };
}
