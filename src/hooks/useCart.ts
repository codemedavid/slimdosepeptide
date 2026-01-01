import { useState, useEffect, useRef } from 'react';
import type { CartItem, Product, ProductVariation } from '../types';

// Helper function to load cart from localStorage synchronously
const loadCartFromStorage = (): CartItem[] => {
  try {
    const savedCart = localStorage.getItem('peptide_cart');
    if (savedCart) {
      return JSON.parse(savedCart);
    }
  } catch (error) {
    console.error('Error loading cart from localStorage:', error);
  }
  return [];
};

export function useCart() {
  // Initialize state directly from localStorage to avoid race conditions
  const [cartItems, setCartItems] = useState<CartItem[]>(loadCartFromStorage);
  const isInitialMountRef = useRef(true);

  // Save cart to localStorage whenever it changes (skip first render since we just loaded)
  useEffect(() => {
    // Skip the first render - we just loaded from localStorage
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }
    localStorage.setItem('peptide_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // Listen for addToCart events from other components (like ArticleDetail)
  useEffect(() => {
    const handleAddToCartEvent = (e: CustomEvent) => {
      const { product, variation, quantity = 1, price } = e.detail;

      // Create a simplified product object with required fields matching Product type
      const productData = {
        ...product,
        stock_quantity: product.stock_quantity ?? 999, // Default to high stock if not provided
        purity_percentage: product.purity_percentage ?? 0,
        category: product.category ?? '',
        description: product.description ?? '',
        available: product.available ?? true,
        featured: product.featured ?? false,
        storage_conditions: product.storage_conditions ?? '',
        molecular_weight: product.molecular_weight ?? null,
        cas_number: product.cas_number ?? null,
        sequence: product.sequence ?? null,
        inclusions: product.inclusions ?? null,
        safety_sheet_url: product.safety_sheet_url ?? null,
        discount_start_date: product.discount_start_date ?? null,
        discount_end_date: product.discount_end_date ?? null,
        created_at: product.created_at ?? new Date().toISOString(),
        updated_at: product.updated_at ?? new Date().toISOString(),
      };

      const variationData = variation ? {
        ...variation,
        stock_quantity: variation.stock_quantity ?? 999
      } : undefined;

      // Directly add to cart state
      setCartItems(prev => {
        const existingIndex = prev.findIndex(
          item => item.product.id === productData.id &&
            (variationData ? item.variation?.id === variationData.id : !item.variation)
        );

        if (existingIndex > -1) {
          const updated = [...prev];
          updated[existingIndex].quantity += quantity;
          return updated;
        }

        return [...prev, {
          product: productData,
          variation: variationData,
          quantity,
          price
        }];
      });
    };

    window.addEventListener('addToCart', handleAddToCartEvent as EventListener);
    return () => window.removeEventListener('addToCart', handleAddToCartEvent as EventListener);
  }, []);

  const addToCart = (product: Product, variation?: ProductVariation, quantity: number = 1) => {
    // Check stock availability
    const availableStock = variation ? variation.stock_quantity : product.stock_quantity;

    if (availableStock === 0) {
      alert(`Sorry, ${product.name}${variation ? ` ${variation.name}` : ''} is out of stock.`);
      return;
    }

    // Calculate price considering discounts for both variations and products
    const price = variation
      ? (variation.discount_active && variation.discount_price ? variation.discount_price : variation.price)
      : (product.discount_active && product.discount_price ? product.discount_price : product.base_price);

    const existingItemIndex = cartItems.findIndex(
      item => item.product.id === product.id &&
        (variation ? item.variation?.id === variation.id : !item.variation)
    );

    if (existingItemIndex > -1) {
      // Update existing item - check if new total exceeds stock
      const currentQuantity = cartItems[existingItemIndex].quantity;
      const newQuantity = currentQuantity + quantity;

      if (newQuantity > availableStock) {
        const remainingStock = availableStock - currentQuantity;
        if (remainingStock > 0) {
          alert(`Only ${remainingStock} item(s) available in stock. Added ${remainingStock} to your cart.`);
          quantity = remainingStock;
        } else {
          alert(`Sorry, you already have the maximum available quantity (${currentQuantity}) in your cart.`);
          return;
        }
      }

      const updatedItems = [...cartItems];
      updatedItems[existingItemIndex].quantity += quantity;
      setCartItems(updatedItems);
    } else {
      // Add new item - check if quantity exceeds stock
      if (quantity > availableStock) {
        alert(`Only ${availableStock} item(s) available in stock. Added ${availableStock} to your cart.`);
        quantity = availableStock;
      }

      const newItem: CartItem = {
        product,
        variation,
        quantity,
        price
      };
      setCartItems([...cartItems, newItem]);
    }
  };

  const updateQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(index);
      return;
    }

    // Check stock availability
    const item = cartItems[index];
    const availableStock = item.variation ? item.variation.stock_quantity : item.product.stock_quantity;

    if (quantity > availableStock) {
      alert(`Only ${availableStock} item(s) available in stock.`);
      quantity = availableStock;
    }

    const updatedItems = [...cartItems];
    updatedItems[index].quantity = quantity;
    setCartItems(updatedItems);
  };

  const removeFromCart = (index: number) => {
    const updatedItems = cartItems.filter((_, i) => i !== index);
    setCartItems(updatedItems);
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('peptide_cart');
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  return {
    cartItems,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getTotalPrice,
    getTotalItems
  };
}
