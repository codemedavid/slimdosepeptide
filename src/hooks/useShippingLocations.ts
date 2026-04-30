import { useMemo } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

export interface ShippingLocation {
  id: string;
  name: string;
  fee: number;
  is_active: boolean;
  order_index: number;
}

const defaultLocations: ShippingLocation[] = [
  { id: 'LUZON', name: 'Luzon (J&T)', fee: 150, is_active: true, order_index: 1 },
  { id: 'VISAYAS', name: 'Visayas (J&T)', fee: 120, is_active: true, order_index: 2 },
  { id: 'MINDANAO', name: 'Mindanao (J&T)', fee: 90, is_active: true, order_index: 3 },
  {
    id: 'MAXIM',
    name: 'Maxim Delivery (Booking fee paid by customer upon delivery)',
    fee: 0,
    is_active: true,
    order_index: 4,
  },
];

export const useShippingLocations = () => {
  const data = useQuery(api.shippingLocations.listActive);
  const loading = data === undefined;

  const locations = useMemo<ShippingLocation[]>(() => {
    if (!data || data.length === 0) return defaultLocations;
    return data as ShippingLocation[];
  }, [data]);

  const getShippingFee = (locationId: string): number => {
    const location = locations.find((loc) => loc.id === locationId);
    return location ? location.fee : 0;
  };

  return { locations, loading, error: null, getShippingFee, refetch: () => Promise.resolve() };
};

export const useShippingLocationsAdmin = () => {
  const data = useQuery(api.shippingLocations.listAll);
  const createMutation = useMutation(api.shippingLocations.create);
  const updateMutation = useMutation(api.shippingLocations.update);
  const removeMutation = useMutation(api.shippingLocations.remove);

  const locations = useMemo(() => (data ?? []) as ShippingLocation[], [data]);
  const loading = data === undefined;

  const updateLocation = async (id: string, updates: Partial<ShippingLocation>) => {
    await updateMutation({
      id,
      name: updates.name,
      fee: updates.fee,
      is_active: updates.is_active,
      order_index: updates.order_index,
    });
  };

  const addLocation = async (
    location: Omit<ShippingLocation, 'order_index'> & { order_index?: number },
  ) => {
    await createMutation({
      id: location.id,
      name: location.name,
      fee: location.fee,
      is_active: location.is_active,
      order_index: location.order_index ?? locations.length + 1,
    });
  };

  const deleteLocation = async (id: string) => {
    await removeMutation({ id });
  };

  return {
    locations,
    loading,
    error: null,
    updateLocation,
    addLocation,
    deleteLocation,
    refetch: () => Promise.resolve(),
  };
};
