import { useMemo } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

export interface Category {
  id: string;
  name: string;
  icon: string;
  sort_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export const useCategories = () => {
  const data = useQuery(api.categories.listActive);
  const createMutation = useMutation(api.categories.create);
  const updateMutation = useMutation(api.categories.update);
  const removeMutation = useMutation(api.categories.remove);
  const reorderMutation = useMutation(api.categories.reorder);

  const categories = useMemo(() => (data ?? []) as Category[], [data]);
  const loading = data === undefined;

  const addCategory = async (category: Omit<Category, 'created_at' | 'updated_at'>) => {
    return createMutation({
      id: category.id,
      name: category.name,
      icon: category.icon,
      sort_order: category.sort_order,
      active: category.active,
    });
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    await updateMutation({
      id,
      name: updates.name,
      icon: updates.icon,
      sort_order: updates.sort_order,
      active: updates.active,
    });
  };

  const deleteCategory = async (id: string) => {
    await removeMutation({ id });
  };

  const reorderCategories = async (reorderedCategories: Category[]) => {
    await reorderMutation({
      items: reorderedCategories.map((cat, index) => ({
        id: cat.id,
        sort_order: index + 1,
      })),
    });
  };

  return {
    categories,
    loading,
    error: null,
    addCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
    refetch: () => Promise.resolve(),
  };
};
