import { useMemo } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

export interface PaymentMethod {
  id: string;
  name: string;
  account_number: string;
  account_name: string;
  qr_code_url: string;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export const usePaymentMethods = () => {
  const data = useQuery(api.paymentMethods.listAll);
  const createMutation = useMutation(api.paymentMethods.create);
  const updateMutation = useMutation(api.paymentMethods.update);
  const removeMutation = useMutation(api.paymentMethods.remove);
  const reorderMutation = useMutation(api.paymentMethods.reorder);

  const paymentMethods = useMemo(() => (data ?? []) as PaymentMethod[], [data]);
  const loading = data === undefined;

  const addPaymentMethod = async (method: Omit<PaymentMethod, 'created_at' | 'updated_at'>) => {
    return createMutation({
      id: method.id,
      name: method.name,
      account_number: method.account_number,
      account_name: method.account_name,
      qr_code_url: method.qr_code_url,
      active: method.active,
      sort_order: method.sort_order,
    });
  };

  const updatePaymentMethod = async (id: string, updates: Partial<PaymentMethod>) => {
    return updateMutation({
      id,
      name: updates.name,
      account_number: updates.account_number,
      account_name: updates.account_name,
      qr_code_url: 'qr_code_url' in updates ? updates.qr_code_url : undefined,
      active: updates.active,
      sort_order: updates.sort_order,
    });
  };

  const deletePaymentMethod = async (id: string) => {
    await removeMutation({ id });
  };

  const reorderPaymentMethods = async (reorderedMethods: PaymentMethod[]) => {
    await reorderMutation({
      items: reorderedMethods.map((method, index) => ({
        id: method.id,
        sort_order: index + 1,
      })),
    });
  };

  return {
    paymentMethods,
    loading,
    error: null,
    addPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    reorderPaymentMethods,
    refetch: () => Promise.resolve(),
    refetchAll: () => Promise.resolve(),
  };
};
