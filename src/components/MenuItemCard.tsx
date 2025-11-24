import React, { useState } from 'react';
import { Plus, Minus, ShoppingCart, Award, FlaskConical, Package } from 'lucide-react';
import type { Product, ProductVariation } from '../types';

interface MenuItemCardProps {
  product: Product;
  onAddToCart: (product: Product, variation?: ProductVariation, quantity?: number) => void;
  cartQuantity?: number;
  onUpdateQuantity?: (index: number, quantity: number) => void;
  onProductClick?: (product: Product) => void;
}

const MenuItemCard: React.FC<MenuItemCardProps> = ({ 
  product, 
  onAddToCart, 
  cartQuantity = 0,
  onProductClick,
}) => {
  const [selectedVariation, setSelectedVariation] = useState<ProductVariation | undefined>(
    product.variations && product.variations.length > 0 ? product.variations[0] : undefined
  );
  const [quantity, setQuantity] = useState(1);

  const currentPrice = selectedVariation 
    ? selectedVariation.price 
    : (product.discount_active && product.discount_price) 
      ? product.discount_price 
      : product.base_price;

  const hasDiscount = !selectedVariation && product.discount_active && product.discount_price;

  const handleAddToCart = () => {
    onAddToCart(product, selectedVariation, quantity);
    setQuantity(1);
  };

  const incrementQuantity = () => setQuantity(prev => prev + 1);
  const decrementQuantity = () => setQuantity(prev => prev > 1 ? prev - 1 : 1);

  return (
    <div className="card card-hover overflow-hidden animate-fadeIn relative group flex flex-col h-full">
      {/* Click overlay for product details */}
      <div 
        onClick={() => onProductClick?.(product)}
        className="absolute inset-0 z-10 cursor-pointer"
        title="Tap for full details"
      >
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-all duration-200 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg transform scale-95 group-hover:scale-100 transition-transform border border-gold-300">
            <p className="text-sm font-bold text-black flex items-center gap-2">
              👁️ Tap for full details
            </p>
          </div>
        </div>
      </div>

      {/* Product Image */}
      <div className="relative h-28 sm:h-36 md:h-48 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden border-b border-gray-200">
        {product.image_url ? (
          <img 
            src={product.image_url} 
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FlaskConical className="w-10 h-10 sm:w-14 sm:h-14 md:w-20 md:h-20 text-gray-400" />
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-1 left-1 sm:top-1.5 sm:left-1.5 md:top-3 md:left-3 flex flex-col gap-0.5 sm:gap-1 md:gap-2">
          {product.featured && (
            <span className="inline-flex items-center px-1 py-0.5 sm:px-1.5 sm:py-0.5 md:px-2.5 md:py-1 rounded-full text-[9px] sm:text-[10px] md:text-xs font-medium bg-gold-100 text-gold-900 shadow-sm sm:shadow-md border border-gold-300">
              <Award className="w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 mr-0.5 md:mr-1" />
              <span className="hidden sm:inline">Featured</span>
              <span className="sm:hidden">★</span>
            </span>
          )}
          {hasDiscount && (
            <span className="inline-flex items-center px-1 py-0.5 sm:px-1.5 sm:py-0.5 md:px-2.5 md:py-1 rounded-full text-[9px] sm:text-[10px] md:text-xs font-medium bg-red-500 text-white shadow-sm sm:shadow-md">
              {Math.round((1 - currentPrice / product.base_price) * 100)}% OFF
            </span>
          )}
        </div>

        {/* Purity Badge */}
        <div className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 md:top-3 md:right-3">
          <span className="inline-flex items-center px-1 py-0.5 sm:px-1.5 sm:py-0.5 md:px-2.5 md:py-1 rounded-full text-[9px] sm:text-[10px] md:text-xs font-semibold bg-green-100 text-green-700 shadow-sm sm:shadow-md">
            {product.purity_percentage}%
          </span>
        </div>

        {/* Tap for Details Badge - Elegant floating design */}
        <div className="absolute bottom-1 sm:bottom-1.5 md:bottom-2 left-1/2 transform -translate-x-1/2 pointer-events-none">
          <div className="bg-white/95 backdrop-blur-md px-2 py-1 sm:px-2.5 sm:py-1 md:px-3 md:py-1.5 rounded-full shadow-md sm:shadow-lg border border-gold-300 animate-pulse-subtle">
            <p className="text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs font-semibold text-black flex items-center gap-0.5 sm:gap-1 whitespace-nowrap">
              <span className="text-[10px] sm:text-xs">👆</span> 
              <span className="hidden xs:inline">Tap for details</span>
              <span className="xs:hidden">Tap</span>
            </p>
          </div>
        </div>

        {/* Stock Status */}
        {product.stock_quantity === 0 && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="bg-red-500 text-white px-2 py-1 sm:px-3 sm:py-1.5 md:px-4 md:py-2 rounded sm:rounded-md md:rounded-lg font-semibold text-[10px] sm:text-xs md:text-sm">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="p-2 sm:p-3 md:p-4 lg:p-5 flex-1 flex flex-col">
        <h3 className="text-xs sm:text-sm md:text-base lg:text-lg font-bold text-gray-900 mb-0.5 sm:mb-1 md:mb-2 leading-tight line-clamp-2 min-h-[2rem] sm:min-h-[2.5rem] md:min-h-[3rem]">{product.name}</h3>
        <p className="text-[10px] sm:text-[11px] md:text-xs lg:text-sm text-gray-600 mb-1.5 sm:mb-2 md:mb-3 line-clamp-2 min-h-[2rem] sm:min-h-[2.5rem]">{product.description}</p>

        {/* Compact Info Badge - Fixed Height */}
        <div className="mb-1.5 sm:mb-2 md:mb-3 min-h-[20px] sm:min-h-[24px] md:min-h-[28px] flex items-start">
          {product.inclusions && product.inclusions.length > 0 && (
            <span className="inline-flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 bg-gradient-to-r from-gold-100 to-gold-200 text-gold-900 rounded-full text-[9px] sm:text-[10px] md:text-xs font-bold border border-gold-300">
              📦 Set ({product.inclusions.length})
            </span>
          )}
        </div>

        {/* Variations (Sizes) - Fixed Height */}
        <div className="mb-1.5 sm:mb-2 md:mb-3 lg:mb-4 min-h-[65px] sm:min-h-[75px] md:min-h-[90px]">
          {product.variations && product.variations.length > 0 && (
            <>
              <label className="block text-[10px] sm:text-[11px] md:text-sm font-medium text-gray-700 mb-1 sm:mb-1.5 md:mb-2">
                <Package className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 inline mr-0.5" />
                Size:
              </label>
              <div className="grid grid-cols-3 gap-1 md:gap-2 max-h-[60px] overflow-y-auto scrollbar-thin">
              {product.variations.slice(0, 3).map((variation) => (
                <button
                  key={variation.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedVariation(variation);
                  }}
                  disabled={variation.stock_quantity === 0}
                  className={`
                    px-1 py-0.5 sm:px-1.5 sm:py-1 md:px-2 md:py-1.5 rounded md:rounded-lg text-[9px] sm:text-[10px] md:text-xs font-medium transition-all relative z-20
                    ${selectedVariation?.id === variation.id
                      ? 'bg-black text-white shadow-md border border-gold-500/30'
                      : variation.stock_quantity === 0
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-black border border-gray-300'
                    }
                  `}
                >
                  <div className="truncate">{variation.name}</div>
                  <div className="text-[8px] sm:text-[9px] md:text-[10px] mt-0.5">
                    ₱{variation.price.toLocaleString('en-PH', { minimumFractionDigits: 0 })}
                  </div>
                </button>
              ))}
              </div>
              {product.variations.length > 3 && (
                <p className="text-[8px] sm:text-[9px] md:text-[10px] text-gold-600 mt-0.5 sm:mt-1 font-medium">
                  +{product.variations.length - 3} more
                </p>
              )}
            </>
          )}
        </div>

        {/* Spacer to push price and buttons to bottom */}
        <div className="flex-1"></div>

        {/* Price - Fixed at bottom */}
        <div className="flex items-baseline mb-1.5 sm:mb-2 md:mb-3">
          <span className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-black">
            ₱{currentPrice.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </span>
          {hasDiscount && (
            <span className="ml-1 md:ml-2 text-xs sm:text-sm md:text-base lg:text-lg text-gray-400 line-through">
              ₱{product.base_price.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </span>
          )}
        </div>

        {/* Quantity Controls - Sticky at bottom */}
        <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 lg:gap-3 relative z-20">
          <div className="flex items-center border border-gray-200 sm:border-2 rounded sm:rounded-md md:rounded-lg">
            <button
              onClick={(e) => {
                e.stopPropagation();
                decrementQuantity();
              }}
              className="p-0.5 sm:p-1 md:p-1.5 lg:p-2 hover:bg-gray-100 transition-colors"
            >
              <Minus className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 text-gray-600" />
            </button>
            <span className="px-1.5 sm:px-2 md:px-3 lg:px-4 py-0.5 sm:py-1 md:py-1.5 lg:py-2 font-semibold text-gray-800 min-w-[20px] sm:min-w-[24px] md:min-w-[36px] text-center text-[10px] sm:text-xs md:text-sm lg:text-base">
              {quantity}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                incrementQuantity();
              }}
              className="p-0.5 sm:p-1 md:p-1.5 lg:p-2 hover:bg-gray-100 transition-colors"
            >
              <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 text-gray-600" />
            </button>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleAddToCart();
            }}
            disabled={!product.available || product.stock_quantity === 0}
            className="flex-1 bg-gradient-to-r from-black to-gray-900 hover:from-gray-900 hover:to-black text-white px-1.5 py-1 sm:px-2 sm:py-1.5 md:px-4 md:py-2 lg:px-6 lg:py-3 rounded sm:rounded-md md:rounded-lg font-semibold transition-all duration-200 active:scale-95 shadow-md hover:shadow-gold-glow disabled:opacity-50 disabled:cursor-not-allowed text-[10px] sm:text-[11px] md:text-sm lg:text-base border border-gold-500/20"
          >
            <ShoppingCart className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 lg:w-5 lg:h-5 inline mr-0.5 sm:mr-1 md:mr-2" />
            <span className="hidden sm:inline">Add to Cart</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>

        {/* Cart Status - Fixed Height */}
        <div className="text-center text-[9px] sm:text-[10px] md:text-xs lg:text-sm text-green-600 font-medium min-h-[12px] sm:min-h-[14px] md:min-h-[16px] mt-0.5 sm:mt-1">
          {cartQuantity > 0 && (
            <span>{cartQuantity} in cart</span>
          )}
        </div>

        {/* Stock Warning */}
        {product.stock_quantity > 0 && product.stock_quantity < 10 && (
          <div className="text-center text-[8px] sm:text-[9px] md:text-[10px] lg:text-xs text-orange-600 mt-0.5">
            Only {product.stock_quantity} left
          </div>
        )}
      </div>
    </div>
  );
};

export default MenuItemCard;
