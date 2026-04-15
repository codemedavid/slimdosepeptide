import React, { useState } from 'react';
import { Plus, Minus, ShoppingCart, Package } from 'lucide-react';
import type { Product, ProductVariation, GlobalDiscount } from '../types';
import { resolveProductPricing } from '../utils/pricing';

interface MenuItemCardProps {
  product: Product;
  onAddToCart: (product: Product, variation?: ProductVariation, quantity?: number, priceOverride?: number) => void;
  cartQuantity?: number;
  onUpdateQuantity?: (index: number, quantity: number) => void;
  onProductClick?: (product: Product) => void;
  globalDiscount?: GlobalDiscount | null;
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({
  product,
  onAddToCart,
  cartQuantity = 0,
  onProductClick,
  globalDiscount,
}) => {
  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | undefined>(
    product.variations && product.variations.length > 0 ? product.variations[0] : undefined
  );
  const [quantity, setQuantity] = useState(1);

  const pricing = resolveProductPricing(product, selectedVariation, globalDiscount);
  const currentPrice = pricing.price;
  const hasDiscount = pricing.hasDiscount;
  const originalPrice = pricing.originalPrice;

  const handleAddToCart = () => {
    const priceToUse = pricing.hasGlobalDiscount ? currentPrice : undefined;
    onAddToCart(product, selectedVariation, quantity, priceToUse);
    setQuantity(1);
  };

  const availableStock = selectedVariation ? selectedVariation.stock_quantity : product.stock_quantity;

  // Check if product has any available stock (either in variations or product itself)
  const hasAnyStock = product.variations && product.variations.length > 0
    ? product.variations.some(v => v.stock_quantity > 0)
    : product.stock_quantity > 0;

  const incrementQuantity = () => {
    setQuantity(prev => {
      if (prev >= availableStock) {
        alert(`Only ${availableStock} item(s) available in stock.`);
        return prev;
      }
      return prev + 1;
    });
  };

  const decrementQuantity = () => setQuantity(prev => prev > 1 ? prev - 1 : 1);

  return (
    <div className="bg-white h-full flex flex-col group relative border-2 border-navy-900 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
      {/* Click overlay for product details */}
      <div
        onClick={() => onProductClick?.(product)}
        className="absolute inset-x-0 top-0 h-48 z-10 cursor-pointer"
        title="View details"
      />

      {/* Product Image */}
      <div className="relative h-48 bg-gray-50 overflow-hidden rounded-t-xl">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <Package className="w-12 h-12" />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 pointer-events-none">
          {product.featured && (
            <span className="badge badge-accent">
              Featured
            </span>
          )}
          {hasDiscount && (
            <span className="badge bg-theme-secondary text-white">
              {Math.round((1 - currentPrice / originalPrice) * 100)}% OFF
            </span>
          )}
        </div>

        {/* Stock Status Overlay */}
        {(!product.available || !hasAnyStock) && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
            <span className="bg-gray-900 text-white px-3 py-1 text-xs font-semibold rounded">
              {!product.available ? 'Unavailable' : 'Out of Stock'}
            </span>
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-semibold text-theme-text mb-1 line-clamp-2">{product.name}</h3>
        <p className="text-sm text-gray-500 mb-3 line-clamp-2 min-h-[2.5rem]">{product.description}</p>

        {/* Variations (Sizes) */}
        <div className="mb-4 min-h-[4rem]">
          {product.variations && product.variations.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.variations.slice(0, 3).map((variation) => {
                const isOutOfStock = variation.stock_quantity === 0;
                return (
                  <button
                    key={variation.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isOutOfStock) {
                        setSelectedVariation(variation);
                      }
                    }}
                    disabled={isOutOfStock}
                    className={`
                      px-2 py-1 text-xs rounded border transition-colors relative z-20
                      ${selectedVariation?.id === variation.id && !isOutOfStock
                        ? 'bg-navy-900 text-white border-navy-900'
                        : isOutOfStock
                          ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-navy-900'
                      }
                    `}
                  >
                    {variation.name}
                  </button>
                );
              })}
              {product.variations.length > 3 && (
                <span className="text-xs text-gray-400 self-center">
                  +{product.variations.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex-1" />

        {/* Price and Cart Actions */}
        <div className="flex flex-col gap-3 mt-2">
          {hasDiscount ? (
            <div className="flex flex-col gap-1">
              {/* Original Price - Strikethrough */}
              <div className="flex items-center gap-2">
                <span className="text-base text-gray-400 line-through font-medium">
                  ₱{originalPrice.toLocaleString('en-PH', { minimumFractionDigits: 0 })}
                </span>
                <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">
                  {Math.round((1 - currentPrice / originalPrice) * 100)}% OFF
                </span>
              </div>
              {/* Sale Price - Prominent */}
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-bold text-green-600">
                  ₱{currentPrice.toLocaleString('en-PH', { minimumFractionDigits: 0 })}
                </span>
                <span className="text-xs text-gray-500">Sale Price</span>
              </div>
            </div>
          ) : (
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-theme-text">
                ₱{currentPrice.toLocaleString('en-PH', { minimumFractionDigits: 0 })}
              </span>
            </div>
          )}

          <div className="flex items-center gap-1.5 sm:gap-2 relative z-20">
            {/* Quantity Controls */}
            <div className="flex items-center border border-gray-200 rounded-md flex-shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  decrementQuantity();
                }}
                className="p-1 sm:p-1.5 hover:bg-gray-50 transition-colors"
                disabled={!hasAnyStock || !product.available}
              >
                <Minus className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
              </button>
              <span className="w-6 sm:w-8 text-center text-xs sm:text-sm font-medium text-theme-text">
                {quantity}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  incrementQuantity();
                }}
                className="p-1 sm:p-1.5 hover:bg-gray-50 transition-colors"
                disabled={quantity >= availableStock || !hasAnyStock || !product.available}
              >
                <Plus className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
              </button>
            </div>

            {/* Add to Cart Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (quantity > availableStock) {
                  alert(`Only ${availableStock} item(s) available in stock.`);
                  setQuantity(availableStock);
                  return;
                }
                handleAddToCart();
              }}
              disabled={!hasAnyStock || availableStock === 0 || !product.available}
              className="flex-1 min-w-0 bg-navy-900 text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium hover:bg-navy-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 sm:gap-2"
            >
              <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span>Add</span>
            </button>
          </div>

          {/* Cart Status */}
          {cartQuantity > 0 && (
            <div className="text-center text-xs text-theme-accent font-medium">
              {cartQuantity} in cart
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MenuItemCard;
