import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { ShoppingBag, Box, Clock } from 'lucide-react';
import { RealtimePostgresInsertPayload } from '@supabase/supabase-js';

interface RecentSale {
    id: string;
    customer_name: string;
    total_price: number;
    created_at: string;
    order_items: any[];
}

interface RecentSalesFeedProps {
    limit?: number;
}

const RecentSalesFeed: React.FC<RecentSalesFeedProps> = ({ limit = 5 }) => {
    const [sales, setSales] = useState<RecentSale[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchSales = async () => {
        try {
            const { data, error } = await supabase
                .from('orders')
                .select('id, customer_name, total_price, created_at, order_items')
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            setSales(data || []);
        } catch (error) {
            console.error('Error fetching recent sales:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSales();

        // Subscribe to new orders
        const channel = supabase
            .channel('recent-sales-feed')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'orders' },
                (payload: RealtimePostgresInsertPayload<RecentSale>) => {
                    // Verify it's a valid order payload
                    const newOrder = payload.new as RecentSale;
                    if (newOrder) {
                        setSales((prev) => [newOrder, ...prev].slice(0, limit));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [limit]);

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (seconds < 60) return 'Just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        return `${Math.floor(hours / 24)}d ago`;
    };

    const getItemSummary = (items: any[]) => {
        if (!items || items.length === 0) return 'No items';
        const firstItem = items[0];
        const count = items.length;
        const name = firstItem.product_name || 'Product';
        const variation = firstItem.variation_name ? `(${firstItem.variation_name})` : '';

        if (count > 1) {
            return `${name} ${variation} +${count - 1} more`;
        }
        return `${name} ${variation}`;
    };

    if (loading) {
        return (
            <div className="animate-pulse space-y-3">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-16 bg-gray-100 rounded-lg"></div>
                ))}
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-soft p-4 border border-gray-100 h-full">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-theme-text flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-theme-primary" />
                    Live Sales
                </h3>
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
            </div>

            <div className="space-y-3">
                {sales.length === 0 ? (
                    <div className="text-center py-6 text-gray-500 text-sm">
                        No recent sales
                    </div>
                ) : (
                    sales.map((sale) => (
                        <div
                            key={sale.id}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                        >
                            <div className="p-2 bg-green-50 rounded-full shrink-0">
                                <Box className="w-4 h-4 text-green-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                    {getItemSummary(sale.order_items)}
                                </p>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {formatTimeAgo(sale.created_at)}
                                    </span>
                                    <span>•</span>
                                    <span>{sale.customer_name}</span>
                                </div>
                            </div>
                            <div className="text-right shrink-0">
                                <p className="text-sm font-bold text-theme-primary">
                                    ₱{sale.total_price.toLocaleString()}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default RecentSalesFeed;
