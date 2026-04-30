import { useMemo } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Product, ProductVariation } from '../types';

export function useMenu() {
  const data = useQuery(api.products.listAvailableWithVariations);
  const createProduct = useMutation(api.products.create);
  const updateProductMutation = useMutation(api.products.update);
  const removeProduct = useMutation(api.products.remove);
  const createVariation = useMutation(api.productVariations.create);
  const updateVariationMutation = useMutation(api.productVariations.update);
  const removeVariation = useMutation(api.productVariations.remove);

  const products = useMemo(() => (data ?? []) as Product[], [data]);
  const loading = data === undefined;

  const addProduct = async (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const created = await createProduct({
        name: product.name,
        description: product.description,
        category: product.category,
        base_price: product.base_price,
        discount_price: product.discount_price ?? null,
        discount_start_date: product.discount_start_date ?? null,
        discount_end_date: product.discount_end_date ?? null,
        discount_active: product.discount_active,
        purity_percentage: product.purity_percentage,
        molecular_weight: product.molecular_weight ?? null,
        cas_number: product.cas_number ?? null,
        sequence: product.sequence ?? null,
        storage_conditions: product.storage_conditions,
        inclusions: product.inclusions ?? null,
        stock_quantity: product.stock_quantity,
        available: product.available,
        featured: product.featured,
        image_url: product.image_url ?? null,
        safety_sheet_url: product.safety_sheet_url ?? null,
      });
      return { success: true, data: created };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to add product',
      };
    }
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      // Normalize image_url so empty strings become null (matches old Supabase code).
      let imageUrl: string | null | undefined = undefined;
      if ('image_url' in updates) {
        const raw = updates.image_url;
        if (raw === null || raw === undefined) {
          imageUrl = null;
        } else {
          const trimmed = String(raw).trim();
          imageUrl = trimmed === '' ? null : trimmed;
        }
      }

      const data = await updateProductMutation({
        id,
        name: updates.name,
        description: updates.description,
        category: updates.category,
        base_price: updates.base_price,
        discount_price:
          'discount_price' in updates ? (updates.discount_price ?? null) : undefined,
        discount_start_date:
          'discount_start_date' in updates ? (updates.discount_start_date ?? null) : undefined,
        discount_end_date:
          'discount_end_date' in updates ? (updates.discount_end_date ?? null) : undefined,
        discount_active: updates.discount_active,
        purity_percentage: updates.purity_percentage,
        molecular_weight:
          'molecular_weight' in updates ? (updates.molecular_weight ?? null) : undefined,
        cas_number: 'cas_number' in updates ? (updates.cas_number ?? null) : undefined,
        sequence: 'sequence' in updates ? (updates.sequence ?? null) : undefined,
        storage_conditions: updates.storage_conditions,
        inclusions: 'inclusions' in updates ? (updates.inclusions ?? null) : undefined,
        stock_quantity: updates.stock_quantity,
        available: updates.available,
        featured: updates.featured,
        image_url: imageUrl,
        safety_sheet_url:
          'safety_sheet_url' in updates ? (updates.safety_sheet_url ?? null) : undefined,
      });
      return { success: true, data };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to update product',
      };
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await removeProduct({ id });
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to delete product',
      };
    }
  };

  const addVariation = async (variation: Omit<ProductVariation, 'id' | 'created_at'>) => {
    try {
      const data = await createVariation({
        product_id: variation.product_id,
        name: variation.name,
        quantity_mg: variation.quantity_mg,
        price: variation.price,
        discount_price: variation.discount_price ?? null,
        discount_active: variation.discount_active,
        stock_quantity: variation.stock_quantity,
      });
      return { success: true, data };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to add variation',
      };
    }
  };

  const updateVariation = async (id: string, updates: Partial<ProductVariation>) => {
    try {
      const data = await updateVariationMutation({
        id,
        name: updates.name,
        quantity_mg: updates.quantity_mg,
        price: updates.price,
        discount_price:
          'discount_price' in updates ? (updates.discount_price ?? null) : undefined,
        discount_active: updates.discount_active,
        stock_quantity: updates.stock_quantity,
      });
      return { success: true, data };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to update variation',
      };
    }
  };

  const deleteVariation = async (id: string) => {
    try {
      await removeVariation({ id });
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to delete variation',
      };
    }
  };

  return {
    menuItems: products,
    products,
    loading,
    error: null,
    refreshProducts: () => Promise.resolve(),
    addProduct,
    updateProduct,
    deleteProduct,
    addVariation,
    updateVariation,
    deleteVariation,
  };
}
