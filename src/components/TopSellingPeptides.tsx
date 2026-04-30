import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Trophy, TrendingUp, Package } from 'lucide-react';

interface TopProduct {
    product_name: string;
    total_sold: number;
    total_revenue: number;
}

const TopSellingPeptides: React.FC = () => {
    const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
    const [products, setProducts] = useState<TopProduct[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchTopProducts();
    }, [period]);

    const fetchTopProducts = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .rpc('get_top_products', { period, limit_count: 5 });

            if (error) throw error;

            if (data) {
                setProducts(data);
            }
        } catch (error) {
            console.error('Error fetching top products:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-md border border-navy-900/10 overflow-hidden h-full">
            <div className="p-4 md:p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg font-bold text-navy-900 flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-gold-500" />
                    Top Selling Peptides
                </h2>
                <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value as any)}
                    className="bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium px-2 py-1 outline-none focus:ring-1 focus:ring-theme-accent"
                >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                </select>
            </div>

            <div className="p-4 overflow-y-auto max-h-[300px]">
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center gap-3 animate-pulse">
                                <div className="w-8 h-8 bg-gray-200 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                                    <div className="h-2 bg-gray-200 rounded w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <Package className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">No sales data for this period</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {products.map((product, index) => {
                            const maxSold = products[0]?.total_sold || 1;
                            const percentage = (product.total_sold / maxSold) * 100;

                            let rankIcon;
                            if (index === 0) rankIcon = <span className="text-2xl">🥇</span>;
                            else if (index === 1) rankIcon = <span className="text-2xl">🥈</span>;
                            else if (index === 2) rankIcon = <span className="text-2xl">🥉</span>;
                            else rankIcon = <span className="text-gray-500 font-bold w-6 text-center text-sm">#{index + 1}</span>;

                            return (
                                <div key={index} className="relative group">
                                    <div className="flex items-center gap-3 mb-1">
                                        <div className="w-8 flex-shrink-0 flex justify-center">
                                            {rankIcon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center mb-0.5">
                                                <span className="font-semibold text-gray-800 text-sm truncate pr-2" title={product.product_name}>
                                                    {product.product_name}
                                                </span>
                                                <span className="text-xs font-bold text-theme-accent bg-theme-accent/5 px-1.5 py-0.5 rounded">
                                                    {product.total_sold} sold
                                                </span>
                                            </div>

                                            {/* Progress Bar */}
                                            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-theme-accent to-purple-400 rounded-full transition-all duration-1000 ease-out"
                                                    style={{ width: `${percentage}%`, animation: 'growWidth 1s ease-out' }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            <style>{`
        @keyframes growWidth {
          from { width: 0; }
        }
      `}</style>
        </div>
    );
};

export default TopSellingPeptides;
