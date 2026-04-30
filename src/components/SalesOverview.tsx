import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { DollarSign, ShoppingBag, TrendingUp, Calendar } from 'lucide-react';

interface SalesData {
    total_orders: number;
    total_revenue: number;
    average_order_value: number;
    period: string;
}

const SalesOverview: React.FC = () => {
    const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
    const [data, setData] = useState<SalesData>({
        total_orders: 0,
        total_revenue: 0,
        average_order_value: 0,
        period: 'weekly'
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchSalesData();
    }, [period]);

    const fetchSalesData = async () => {
        try {
            setLoading(true);
            const { data: salesData, error } = await supabase
                .rpc('get_sales_overview', { period });

            if (error) throw error;

            if (salesData) {
                setData(salesData);
            }
        } catch (error) {
            console.error('Error fetching sales data:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 2
        }).format(amount);
    };

    return (
        <div className="bg-white rounded-xl shadow-md border border-navy-900/10 overflow-hidden">
            <div className="p-4 md:p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-lg font-bold text-navy-900 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-theme-accent" />
                    Sales Overview
                </h2>
                <div className="flex bg-gray-100 p-1 rounded-lg self-start sm:self-auto">
                    {(['daily', 'weekly', 'monthly'] as const).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all capitalize ${period === p
                                    ? 'bg-white text-theme-accent shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            </div>

            <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Total Revenue */}
                <div className="bg-gradient-to-br from-theme-accent/5 to-transparent p-4 rounded-lg border border-theme-accent/10">
                    <div className="flex items-start justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600">Total Revenue</span>
                        <div className="p-2 bg-theme-accent/10 rounded-full">
                            <DollarSign className="h-4 w-4 text-theme-accent" />
                        </div>
                    </div>
                    {loading ? (
                        <div className="h-8 w-24 bg-gray-200 animate-pulse rounded"></div>
                    ) : (
                        <div className="text-2xl font-bold text-navy-900">
                            {formatCurrency(data.total_revenue)}
                        </div>
                    )}
                    <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span className="capitalize">{period}</span> income
                    </div>
                </div>

                {/* Total Orders */}
                <div className="bg-gradient-to-br from-blue-50 to-transparent p-4 rounded-lg border border-blue-100">
                    <div className="flex items-start justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600">Total Orders</span>
                        <div className="p-2 bg-blue-100 rounded-full">
                            <ShoppingBag className="h-4 w-4 text-blue-600" />
                        </div>
                    </div>
                    {loading ? (
                        <div className="h-8 w-16 bg-gray-200 animate-pulse rounded"></div>
                    ) : (
                        <div className="text-2xl font-bold text-navy-900">
                            {data.total_orders}
                        </div>
                    )}
                    <div className="mt-2 text-xs text-gray-500">
                        Completed orders
                    </div>
                </div>

                {/* Average Order Value */}
                <div className="bg-gradient-to-br from-emerald-50 to-transparent p-4 rounded-lg border border-emerald-100">
                    <div className="flex items-start justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600">Avg. Order Value</span>
                        <div className="p-2 bg-emerald-100 rounded-full">
                            <TrendingUp className="h-4 w-4 text-emerald-600" />
                        </div>
                    </div>
                    {loading ? (
                        <div className="h-8 w-24 bg-gray-200 animate-pulse rounded"></div>
                    ) : (
                        <div className="text-2xl font-bold text-navy-900">
                            {formatCurrency(data.average_order_value)}
                        </div>
                    )}
                    <div className="mt-2 text-xs text-gray-500">
                        Per paid order
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalesOverview;
