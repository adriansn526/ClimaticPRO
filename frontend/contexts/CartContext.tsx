'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Adapted Product interface for ClimaticPro
export interface Product {
    id: string;
    databaseId?: number;
    name: string;
    slug: string;
    price?: string;
    regularPrice?: string;
    salePrice?: string;
    stockStatus: string;
    stockQuantity?: number;
    image?: {
        sourceUrl: string;
        altText?: string;
    };
}

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
    isLoaded: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load cart from localStorage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem('climaticpro_cart');
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
        if (!isLoaded) return;
        localStorage.setItem('climaticpro_cart', JSON.stringify(items));
    }, [items, isLoaded]);

    const cleanPrice = (priceStr: string | undefined): number => {
        if (!priceStr) return 0;
        let cleaned = priceStr
            .replace(/&nbsp;/g, '')
            .replace(/lei/gi, '')
            .replace(/RON/gi, '')
            .replace(/\s/g, '');

        // Handle different number formats
        if (cleaned.includes(',') && cleaned.includes('.')) {
            if (cleaned.indexOf(',') < cleaned.indexOf('.')) {
                // Format: 1,234.56
                cleaned = cleaned.replace(/,/g, '');
            } else {
                // Format: 1.234,56
                cleaned = cleaned.replace(/\./g, '').replace(',', '.');
            }
        } else if (cleaned.includes(',')) {
            const parts = cleaned.split(',');
            if (parts[1] && parts[1].length > 2) {
                // Format: 1,234 (thousands separator)
                cleaned = cleaned.replace(/,/g, '');
            } else {
                // Format: 12,34 (decimal separator)
                cleaned = cleaned.replace(',', '.');
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
        setItems((currentItems) => currentItems.filter((item) => item.product.id !== productId));
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
        // Prefer salePrice if available, otherwise regularPrice or price
        const rawPrice = item.product.salePrice || item.product.price || item.product.regularPrice;
        const price = cleanPrice(rawPrice);
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
                isLoaded,
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
