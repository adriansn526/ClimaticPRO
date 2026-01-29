'use client';

import { useState, useEffect } from 'react';

export interface WishlistItem {
    id: string;
    name: string;
    slug: string;
    price?: string;
    image?: string;
    addedAt: number;
}

const WISHLIST_KEY = 'climaticpro_wishlist';

export function useWishlist() {
    const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load wishlist from localStorage on mount
    useEffect(() => {
        const loadWishlist = () => {
            const stored = localStorage.getItem(WISHLIST_KEY);
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    setWishlist(parsed);
                } catch (error) {
                    console.error('Error loading wishlist:', error);
                    setWishlist([]);
                }
            }
        };

        loadWishlist();
        setIsLoaded(true);

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === WISHLIST_KEY) {
                loadWishlist();
            }
        };

        const handleWishlistUpdate = () => {
            loadWishlist();
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('wishlistUpdated', handleWishlistUpdate);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('wishlistUpdated', handleWishlistUpdate);
        };
    }, []);

    // Save wishlist to localStorage whenever it changes
    useEffect(() => {
        if (isLoaded) {
            const currentStored = localStorage.getItem(WISHLIST_KEY);
            const newValue = JSON.stringify(wishlist);

            if (currentStored !== newValue) {
                localStorage.setItem(WISHLIST_KEY, newValue);
                window.dispatchEvent(new Event('wishlistUpdated'));
            }
        }
    }, [wishlist, isLoaded]);

    const addToWishlist = (item: Omit<WishlistItem, 'addedAt'>) => {
        setWishlist((prev) => {
            if (prev.some((i) => i.id === item.id)) {
                return prev;
            }
            return [...prev, { ...item, addedAt: Date.now() }];
        });
    };

    const removeFromWishlist = (productId: string) => {
        setWishlist((prev) => prev.filter((item) => item.id !== productId));
    };

    const isInWishlist = (productId: string) => {
        return wishlist.some((item) => item.id === productId);
    };

    const toggleWishlist = (item: Omit<WishlistItem, 'addedAt'>) => {
        if (isInWishlist(item.id)) {
            removeFromWishlist(item.id);
        } else {
            addToWishlist(item);
        }
    };

    const clearWishlist = () => {
        setWishlist([]);
    };

    return {
        wishlist,
        addToWishlist,
        removeFromWishlist,
        isInWishlist,
        toggleWishlist,
        clearWishlist,
        count: wishlist.length,
        isLoaded,
    };
}
