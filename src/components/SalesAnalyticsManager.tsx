import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
    ChevronLeft,
    RefreshCw,
    TrendingUp,
    TrendingDown,
    DollarSign,
    ShoppingBag,
    Package,
    Activity,
    Trophy,
    Medal,
    Flame,
    Clock,
    Box
} from 'lucide-react';

interface SalesAnalyticsManagerProps {
    onBack?: () => void;
}

interface DashboardMetrics {
    total_orders: number;
    total_revenue: number;
    total_units: number;
    average_order_value: number;
}

interface ProductRanking {
    product_name: string;
    units_sold: number;
    revenue: number;
}

interface RecentSale {
    id: string;
    customer_name: string;
    total_price: number;
    created_at: string;
    order_items: any[];
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(amount);
};

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

const SalesAnalyticsManager: React.FC<SalesAnalyticsManagerProps> = ({ onBack }) => {
    const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly' | 'all'>('all');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [metrics, setMetrics] = useState<{ current: DashboardMetrics; previous: DashboardMetrics | null }>({
        current: { total_orders: 0, total_revenue: 0, total_units: 0, average_order_value: 0 },
        previous: null
    });
    const [rankings, setRankings] = useState<ProductRanking[]>([]);
    const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
    const [sortBy, setSortBy] = useState<'units' | 'revenue'>('units');

    const fetchData = async (showRefresh = false) => {
        if (showRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const now = new Date();
            let startDate = new Date();
            let previousStartDate = new Date();
            let previousEndDate = new Date();

            if (timeframe === 'all') {
                // All time - use a very old date as start
                startDate = new Date('2020-01-01');
                previousStartDate = new Date('2019-01-01');
                previousEndDate = new Date('2019-12-31');
            } else if (timeframe === 'daily') {
                startDate.setHours(0, 0, 0, 0);
                previousStartDate.setDate(previousStartDate.getDate() - 1);
                previousStartDate.setHours(0, 0, 0, 0);
                previousEndDate.setDate(previousEndDate.getDate() - 1);
                previousEndDate.setHours(23, 59, 59, 999);
            } else if (timeframe === 'weekly') {
                const day = startDate.getDay();
                const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
                startDate.setDate(diff);
                startDate.setHours(0, 0, 0, 0);
                previousStartDate = new Date(startDate);
                previousStartDate.setDate(previousStartDate.getDate() - 7);
                previousEndDate = new Date(startDate);
                previousEndDate.setDate(previousEndDate.getDate() - 1);
                previousEndDate.setHours(23, 59, 59, 999);
            } else {
                startDate.setDate(1);
                startDate.setHours(0, 0, 0, 0);
                previousStartDate = new Date(startDate);
                previousStartDate.setMonth(previousStartDate.getMonth() - 1);
                previousEndDate = new Date(startDate);
                previousEndDate.setDate(0);
                previousEndDate.setHours(23, 59, 59, 999);
            }

            const [currentRes, prevRes, rankingsRes, salesRes] = await Promise.all([
                supabase.rpc('get_dashboard_metrics', { date_start: startDate.toISOString(), date_end: now.toISOString() }),
                supabase.rpc('get_dashboard_metrics', { date_start: previousStartDate.toISOString(), date_end: previousEndDate.toISOString() }),
                supabase.rpc('get_product_rankings', { date_start: startDate.toISOString(), date_end: now.toISOString(), limit_count: 10 }),
                supabase.from('orders').select('id, customer_name, total_price, created_at, order_items').order('created_at', { ascending: false }).limit(5)
            ]);

            setMetrics({
                current: currentRes.data || { total_orders: 0, total_revenue: 0, total_units: 0, average_order_value: 0 },
                previous: prevRes.data
            });
            setRankings(rankingsRes.data || []);
            setRecentSales(salesRes.data || []);

        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
        const channel = supabase
            .channel('analytics-updates')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, () => setTimeout(() => fetchData(true), 1000))
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [timeframe]);

    const calculateTrend = (current: number, previous: number) => {
        if (!previous || previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
    };

    const sortedRankings = [...rankings].sort((a, b) => sortBy === 'units' ? b.units_sold - a.units_sold : b.revenue - a.revenue);

    const getItemSummary = (items: any[]) => {
        if (!items || items.length === 0) return 'No items';
        const first = items[0];
        const name = first.product_name || 'Product';
        const variation = first.variation_name ? ` (${first.variation_name})` : '';
        return items.length > 1 ? `${name}${variation} +${items.length - 1} more` : `${name}${variation}`;
    };

    const MetricCard = ({ title, value, trend, icon: Icon, gradient }: { title: string; value: string | number; trend?: number; icon: any; gradient: string }) => {
        const isPositive = trend !== undefined && trend >= 0;
        return (
            <div className={`relative overflow-hidden rounded-2xl p-5 ${gradient} text-white shadow-lg hover:shadow-xl transition-shadow`}>
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8"></div>
                <div className="relative">
                    <div className="flex items-center gap-2 mb-3 opacity-90">
                        <Icon className="w-5 h-5" />
                        <span className="text-sm font-medium">{title}</span>
                    </div>
                    <div className="text-3xl font-bold tracking-tight mb-1">{value}</div>
                    {trend !== undefined && (
                        <div className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${isPositive ? 'bg-white/20' : 'bg-red-500/30'}`}>
                            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {Math.abs(trend).toFixed(1)}% vs prev
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const getRankIcon = (index: number) => {
        switch (index) {
            case 0: return <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center shadow-md"><Trophy className="w-4 h-4 text-white" /></div>;
            case 1: return <div className="w-8 h-8 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center shadow-md"><Medal className="w-4 h-4 text-white" /></div>;
            case 2: return <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center shadow-md"><Medal className="w-4 h-4 text-white" /></div>;
            default: return <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm font-bold text-gray-500">{index + 1}</div>;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-navy-900 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
            <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200">
                    <div>
                        {onBack && (
                            <button onClick={onBack} className="text-gray-500 hover:text-navy-900 flex items-center gap-1 text-sm font-medium mb-1 transition-colors group">
                                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
                            </button>
                        )}
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">Sales Analytics</h1>
                        <p className="text-gray-500 text-sm">Real-time insights and performance metrics</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => fetchData(true)} disabled={refreshing} className="p-2 bg-white rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50">
                            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        </button>
                        <div className="flex bg-white rounded-xl p-1 border border-gray-200 shadow-sm">
                            {(['all', 'daily', 'weekly', 'monthly'] as const).map((t) => (
                                <button key={t} onClick={() => setTimeframe(t)} className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${timeframe === t ? 'bg-navy-900 text-white shadow-md' : 'text-gray-600 hover:bg-gray-50'}`}>
                                    {t === 'all' ? 'All Time' : t.charAt(0).toUpperCase() + t.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Metric Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <MetricCard title="Total Revenue" value={formatCurrency(metrics.current.total_revenue)} trend={metrics.previous ? calculateTrend(metrics.current.total_revenue, metrics.previous.total_revenue) : undefined} icon={DollarSign} gradient="bg-gradient-to-br from-emerald-500 to-teal-600" />
                    <MetricCard title="Total Orders" value={metrics.current.total_orders} trend={metrics.previous ? calculateTrend(metrics.current.total_orders, metrics.previous.total_orders) : undefined} icon={ShoppingBag} gradient="bg-gradient-to-br from-blue-500 to-indigo-600" />
                    <MetricCard title="Units Sold" value={metrics.current.total_units} trend={metrics.previous ? calculateTrend(metrics.current.total_units, metrics.previous.total_units) : undefined} icon={Package} gradient="bg-gradient-to-br from-violet-500 to-purple-600" />
                    <MetricCard title="Avg. Order Value" value={formatCurrency(metrics.current.average_order_value)} trend={metrics.previous ? calculateTrend(metrics.current.average_order_value, metrics.previous.average_order_value) : undefined} icon={Activity} gradient="bg-gradient-to-br from-amber-500 to-orange-600" />
                </div>

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Top Selling Products */}
                    <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
                        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-50 to-white">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-xl shadow-md">
                                    <Trophy className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-navy-900">Top Selling Products</h2>
                                    <p className="text-xs text-gray-500">Best performers {timeframe === 'all' ? 'of all time' : timeframe === 'daily' ? 'today' : timeframe === 'weekly' ? 'this week' : 'this month'}</p>
                                </div>
                            </div>
                            <div className="flex bg-gray-100 rounded-lg p-1">
                                <button onClick={() => setSortBy('units')} className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${sortBy === 'units' ? 'bg-white shadow text-navy-900' : 'text-gray-500'}`}>By Units</button>
                                <button onClick={() => setSortBy('revenue')} className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${sortBy === 'revenue' ? 'bg-white shadow text-navy-900' : 'text-gray-500'}`}>By Revenue</button>
                            </div>
                        </div>
                        <div className="p-4 space-y-2 max-h-[400px] overflow-y-auto">
                            {sortedRankings.length === 0 ? (
                                <div className="text-center py-12 text-gray-400">
                                    <Package className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                    <p>No sales data yet</p>
                                </div>
                            ) : (
                                sortedRankings.map((product, index) => (
                                    <div key={product.product_name} className={`flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors ${index < 3 ? 'bg-gradient-to-r from-slate-50/50 to-transparent' : ''}`}>
                                        {getRankIcon(index)}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-semibold text-gray-900 truncate">{product.product_name}</h4>
                                                {index === 0 && <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-orange-400 to-red-500 text-white text-[10px] font-bold rounded-full"><Flame className="w-2.5 h-2.5" />HOT</span>}
                                            </div>
                                            <p className="text-xs text-gray-500">{product.units_sold} units • {formatCurrency(product.revenue)}</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-bold text-navy-900">{sortBy === 'units' ? product.units_sold : formatCurrency(product.revenue)}</div>
                                            <div className="text-[10px] text-gray-400 uppercase font-medium">{sortBy === 'units' ? 'units' : 'revenue'}</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Recent Sales */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
                        <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-white">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gradient-to-br from-green-400 to-emerald-500 rounded-xl shadow-md">
                                        <ShoppingBag className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-navy-900">Recent Sales</h2>
                                        <p className="text-xs text-gray-500">Latest transactions</p>
                                    </div>
                                </div>
                                <div className="relative flex h-2.5 w-2.5">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
                            {recentSales.length === 0 ? (
                                <div className="text-center py-12 text-gray-400">
                                    <ShoppingBag className="w-12 h-12 mx-auto mb-2 opacity-30" />
                                    <p>No recent sales</p>
                                </div>
                            ) : (
                                recentSales.map((sale) => (
                                    <div key={sale.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                                        <div className="p-2 bg-green-100 rounded-full shrink-0">
                                            <Box className="w-4 h-4 text-green-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">{getItemSummary(sale.order_items)}</p>
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatTimeAgo(sale.created_at)}</span>
                                                <span>•</span>
                                                <span className="truncate">{sale.customer_name}</span>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-sm font-bold text-emerald-600">{formatCurrency(sale.total_price)}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalesAnalyticsManager;
