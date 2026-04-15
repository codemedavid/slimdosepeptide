import type { GlobalDiscount, Product, ProductVariation } from '../types';

interface DiscountedPriceResult {
  price: number;
  hasDiscount: boolean;
  hasGlobalDiscount: boolean;
  hasIndividualDiscount: boolean;
  originalPrice: number;
}

const isGlobalDiscountActive = (globalDiscount?: GlobalDiscount | null) => {
  if (!globalDiscount?.active) return false;

  const now = new Date();
  if (globalDiscount.start_date && new Date(globalDiscount.start_date) > now) return false;
  if (globalDiscount.end_date && new Date(globalDiscount.end_date) < now) return false;

  return true;
};

export const getGlobalDiscountedPrice = (
  originalPrice: number,
  productId: string,
  globalDiscount?: GlobalDiscount | null
): { price: number; hasGlobalDiscount: boolean } => {
  if (!isGlobalDiscountActive(globalDiscount)) {
    return { price: originalPrice, hasGlobalDiscount: false };
  }

  if (globalDiscount.excluded_product_ids?.includes(productId)) {
    return { price: originalPrice, hasGlobalDiscount: false };
  }

  const discountedPrice = globalDiscount.discount_type === 'percentage'
    ? originalPrice * (1 - globalDiscount.discount_value / 100)
    : Math.max(0, originalPrice - globalDiscount.discount_value);

  return { price: Math.round(discountedPrice), hasGlobalDiscount: discountedPrice < originalPrice };
};

export const resolveProductPricing = (
  product: Product,
  variation?: ProductVariation,
  globalDiscount?: GlobalDiscount | null
): DiscountedPriceResult => {
  const originalPrice = variation?.price ?? product.base_price;
  const individualPrice = variation
    ? (variation.discount_active && variation.discount_price !== null ? variation.discount_price : variation.price)
    : (product.discount_active && product.discount_price !== null ? product.discount_price : product.base_price);

  const hasIndividualDiscount = individualPrice < originalPrice;
  const globalResult = getGlobalDiscountedPrice(originalPrice, product.id, globalDiscount);

  if (globalResult.hasGlobalDiscount && (!hasIndividualDiscount || globalResult.price < individualPrice)) {
    return {
      price: globalResult.price,
      hasDiscount: true,
      hasGlobalDiscount: true,
      hasIndividualDiscount,
      originalPrice,
    };
  }

  return {
    price: individualPrice,
    hasDiscount: hasIndividualDiscount,
    hasGlobalDiscount: false,
    hasIndividualDiscount,
    originalPrice,
  };
};
