import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { GlobalDiscount } from '../types';

export function useGlobalDiscount() {
  const [globalDiscount, setGlobalDiscount] = useState<GlobalDiscount | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGlobalDiscount();

    const channel = supabase
      .channel('global-discounts-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'global_discounts' },
        () => fetchGlobalDiscount()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchGlobalDiscount = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('global_discounts')
        .select('*')
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      // Check if within date range
      if (data) {
        const now = new Date();
        if (data.start_date && new Date(data.start_date) > now) {
          setGlobalDiscount(null);
        } else if (data.end_date && new Date(data.end_date) < now) {
          setGlobalDiscount(null);
        } else {
          setGlobalDiscount(data as GlobalDiscount);
        }
      } else {
        setGlobalDiscount(null);
      }
    } catch (err) {
      console.error('Error fetching global discount:', err);
      setGlobalDiscount(null);
    } finally {
      setLoading(false);
    }
  };

  const getDiscountedPrice = (originalPrice: number, productId: string): { price: number; hasGlobalDiscount: boolean } => {
    if (!globalDiscount || !globalDiscount.active) {
      return { price: originalPrice, hasGlobalDiscount: false };
    }

    // Check if product is excluded
    if (globalDiscount.excluded_product_ids?.includes(productId)) {
      return { price: originalPrice, hasGlobalDiscount: false };
    }

    let discountedPrice: number;
    if (globalDiscount.discount_type === 'percentage') {
      discountedPrice = originalPrice * (1 - globalDiscount.discount_value / 100);
    } else {
      discountedPrice = Math.max(0, originalPrice - globalDiscount.discount_value);
    }

    return { price: Math.round(discountedPrice), hasGlobalDiscount: true };
  };

  return {
    globalDiscount,
    loading,
    getDiscountedPrice,
    refreshGlobalDiscount: fetchGlobalDiscount,
  };
}

export function useGlobalDiscountAdmin() {
  const [discounts, setDiscounts] = useState<GlobalDiscount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('global_discounts')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setDiscounts(data as GlobalDiscount[]);
    }
    setLoading(false);
  };

  const saveDiscount = async (discount: Partial<GlobalDiscount>) => {
    try {
      const payload = {
        ...discount,
        updated_at: new Date().toISOString(),
      };

      if (discount.id) {
        const { error } = await supabase
          .from('global_discounts')
          .update(payload)
          .eq('id', discount.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('global_discounts')
          .insert([payload]);
        if (error) throw error;
      }

      await fetchAll();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const deleteDiscount = async (id: string) => {
    try {
      const { error } = await supabase
        .from('global_discounts')
        .delete()
        .eq('id', id);
      if (error) throw error;
      await fetchAll();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const toggleActive = async (id: string, active: boolean) => {
    try {
      const { error } = await supabase
        .from('global_discounts')
        .update({ active, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      await fetchAll();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  return {
    discounts,
    loading,
    saveDiscount,
    deleteDiscount,
    toggleActive,
    refresh: fetchAll,
  };
}
