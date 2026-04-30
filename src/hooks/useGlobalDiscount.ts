import { useMemo } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { GlobalDiscount } from '../types';
import { getGlobalDiscountedPrice } from '../utils/pricing';

export function useGlobalDiscount() {
  const data = useQuery(api.globalDiscounts.listActive);
  const loading = data === undefined;

  const globalDiscount = useMemo<GlobalDiscount | null>(() => {
    if (!data) return null;
    const now = new Date();
    const active = (data as GlobalDiscount[]).find((discount) => {
      if (discount.start_date && new Date(discount.start_date) > now) return false;
      if (discount.end_date && new Date(discount.end_date) < now) return false;
      return true;
    });
    return active ?? null;
  }, [data]);

  const getDiscountedPrice = (
    originalPrice: number,
    productId: string,
  ): { price: number; hasGlobalDiscount: boolean } => {
    return getGlobalDiscountedPrice(originalPrice, productId, globalDiscount);
  };

  return {
    globalDiscount,
    loading,
    getDiscountedPrice,
    refreshGlobalDiscount: () => Promise.resolve(),
  };
}

export function useGlobalDiscountAdmin() {
  const data = useQuery(api.globalDiscounts.listAll);
  const createMutation = useMutation(api.globalDiscounts.create);
  const updateMutation = useMutation(api.globalDiscounts.update);
  const removeMutation = useMutation(api.globalDiscounts.remove);
  const setActiveMutation = useMutation(api.globalDiscounts.setActive);

  const discounts = useMemo(() => (data ?? []) as GlobalDiscount[], [data]);
  const loading = data === undefined;

  const saveDiscount = async (discount: Partial<GlobalDiscount>) => {
    try {
      if (discount.id) {
        await updateMutation({
          id: discount.id,
          name: discount.name,
          discount_type: discount.discount_type,
          discount_value: discount.discount_value,
          active: discount.active,
          start_date: discount.start_date ?? null,
          end_date: discount.end_date ?? null,
          excluded_product_ids: discount.excluded_product_ids,
        });
      } else {
        await createMutation({
          name: discount.name ?? '',
          discount_type: discount.discount_type ?? 'percentage',
          discount_value: discount.discount_value ?? 0,
          active: discount.active,
          start_date: discount.start_date ?? null,
          end_date: discount.end_date ?? null,
          excluded_product_ids: discount.excluded_product_ids ?? [],
        });
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message ?? 'Failed to save discount' };
    }
  };

  const deleteDiscount = async (id: string) => {
    try {
      await removeMutation({ id });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message ?? 'Failed to delete discount' };
    }
  };

  const toggleActive = async (id: string, active: boolean) => {
    try {
      await setActiveMutation({ id, active });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message ?? 'Failed to toggle discount' };
    }
  };

  return {
    discounts,
    loading,
    saveDiscount,
    deleteDiscount,
    toggleActive,
    refresh: () => Promise.resolve(),
  };
}
