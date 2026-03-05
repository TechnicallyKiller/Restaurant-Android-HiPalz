import type {
  CartItem,
  PlaceOrderPayload,
  PlaceOrderCartLine,
  PlaceOrderCartLineAddon,
  PlaceOrderCartLineAddonChoice,
  PlaceOrderCartLineVariant,
} from './types';

export function buildCartId(
  itemId: string,
  variantId: string | null,
  addonChoiceIds: string[],
): string {
  const sorted = [...addonChoiceIds].sort();
  const addonPart = sorted.length ? sorted.join('_') : 'noaddons';
  return `${itemId}_${variantId ?? 'novariant'}_${addonPart}`;
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
