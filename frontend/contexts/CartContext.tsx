'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { WooCommerceProduct } from '@/lib/woocommerce';
import posthog from 'posthog-js';

// Alias Product to WooCommerceProduct to minimize code changes
type Product = WooCommerceProduct;

export interface CartItem {
    product: Product;
    quantity: number;
}

interface CartContextType {
    items: CartItem[];
    addItem: (product: Product, quantity: number) => void;
    removeItem: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    totalItems: number;
    totalPrice: number;
    isCartOpen: boolean;
    setIsCartOpen: (isOpen: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);

    // Load cart from localStorage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            try {
                setItems(JSON.parse(savedCart));
            } catch (error) {
                console.error('Error loading cart:', error);
            }
        }
        setIsLoaded(true);
    }, []);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('cart', JSON.stringify(items));
        }
    }, [items, isLoaded]);

    const cleanPrice = (priceStr: string) => {
        if (!priceStr) return 0;
        let cleaned = priceStr
            .replace(/&nbsp;/g, '')
            .replace(/lei/gi, '')
            .replace(/\s/g, '');

        // Handle ClimaticPRO price formats (e.g. "3.500,00" or "3,500.00")
        if (cleaned.includes(',') && cleaned.includes('.')) {
            if (cleaned.indexOf(',') < cleaned.indexOf('.')) {
                cleaned = cleaned.replace(/,/g, '');
            } else {
                cleaned = cleaned.replace(/\./g, '').replace(',', '.');
            }
        } else if (cleaned.includes(',')) {
            const parts = cleaned.split(',');
            if (parts[1] && parts[1].length > 2) {
                cleaned = cleaned.replace(/,/g, '');
            } else {
                cleaned = cleaned.replace(',', '.');
            }
        } else if (cleaned.includes('.')) {
            // handle dots as thousands separator if no commas ??
            // Actually commonly 3.500 means 3500.
            // If there is only one dot and it's 3 decimal places from end, it's likely thousand sep
            const parts = cleaned.split('.');
            if (parts.length > 1 && parts[parts.length - 1].length === 3) {
                cleaned = cleaned.replace(/\./g, '');
            }
        }

        return parseFloat(cleaned) || 0;
    };

    const addItem = (product: Product, quantity: number) => {
        setItems((currentItems) => {
            const existingItem = currentItems.find((item) => item.product.id === product.id);

            if (existingItem) {
                return currentItems.map((item) =>
                    item.product.id === product.id
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            }

            return [...currentItems, { product, quantity }];
        });
    };

    const removeItem = (productId: string) => {
        setItems((currentItems) => {
            const removedItem = currentItems.find((item) => item.product.id === productId);
            if (removedItem) {
                posthog.capture('product_removed_from_cart', {
                    product_id: removedItem.product.id,
                    product_name: removedItem.product.name,
                    product_sku: removedItem.product.sku,
                    quantity: removedItem.quantity,
                    currency: 'RON',
                });
            }
            return currentItems.filter((item) => item.product.id !== productId);
        });
    };

    const updateQuantity = (productId: string, quantity: number) => {
        if (quantity <= 0) {
            removeItem(productId);
            return;
        }

        setItems((currentItems) =>
            currentItems.map((item) =>
                item.product.id === productId ? { ...item, quantity } : item
            )
        );
    };

    const clearCart = () => {
        setItems([]);
    };

    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

    const totalPrice = items.reduce((sum, item) => {
        const price = cleanPrice(item.product.price || item.product.regularPrice || '0');
        return sum + price * item.quantity;
    }, 0);

    return (
        <CartContext.Provider
            value={{
                items,
                addItem,
                removeItem,
                updateQuantity,
                clearCart,
                totalItems,
                totalPrice,
                isCartOpen,
                setIsCartOpen,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
