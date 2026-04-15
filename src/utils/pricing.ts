import type { GlobalDiscount, Product, ProductVariation } from '../types';

interface DiscountedPriceResult {
  price: number;
  hasDiscount: boolean;
  hasGlobalDiscount: boolean;
  hasIndividualDiscount: boolean;
  originalPrice: number;
}

const getDateBoundary = (value: string | undefined, boundary: 'start' | 'end') => {
  if (!value) return null;

  const datePart = value.slice(0, 10);
  const timePart = boundary === 'start' ? 'T00:00:00.000' : 'T23:59:59.999';
  const parsed = new Date(`${datePart}${timePart}`);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const isGlobalDiscountActive = (globalDiscount?: GlobalDiscount | null) => {
  if (!globalDiscount?.active) return false;

  const now = new Date();
  const startDate = getDateBoundary(globalDiscount.start_date, 'start');
  const endDate = getDateBoundary(globalDiscount.end_date, 'end');

  if (startDate && startDate > now) return false;
  if (endDate && endDate < now) return false;

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
