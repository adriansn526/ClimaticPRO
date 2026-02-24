'use client';

import { useState, useEffect } from 'react';

export interface CompareItem {
    id: string;
    name: string;
    slug: string;
    price: string;
    image: string;
    category?: string;
    attributes?: {
        name: string;
        options: string[];
    }[];
}

const COMPARE_KEY = 'climaticpro_compare';
const MAX_COMPARE_ITEMS = 4;

export function useCompare() {
    const [compareList, setCompareList] = useState<CompareItem[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        const loadCompare = () => {
            const stored = localStorage.getItem(COMPARE_KEY);
            if (stored) {
                try {
                    const parsed = JSON.parse(stored);
                    setCompareList(parsed);
                } catch (error) {
                    console.error('Error loading compare list:', error);
                    setCompareList([]);
                }
            }
        };

        loadCompare();
        setIsLoaded(true);

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === COMPARE_KEY) {
                loadCompare();
            }
        };

        const handleCompareUpdate = () => {
            loadCompare();
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('compareUpdated', handleCompareUpdate);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('compareUpdated', handleCompareUpdate);
        };
    }, []);

    // Save to localStorage whenever it changes
    useEffect(() => {
        if (isLoaded) {
            const currentStored = localStorage.getItem(COMPARE_KEY);
            const newValue = JSON.stringify(compareList);

            if (currentStored !== newValue) {
                localStorage.setItem(COMPARE_KEY, newValue);
                window.dispatchEvent(new Event('compareUpdated'));
            }
        }
    }, [compareList, isLoaded]);

    const addToCompare = (item: CompareItem) => {
        if (compareList.length >= MAX_COMPARE_ITEMS) {
            alert(`Puteți compara maxim ${MAX_COMPARE_ITEMS} produse simultan.`);
            return;
        }
        setCompareList((prev) => {
            if (prev.some((i) => i.id === item.id)) {
                return prev;
            }
            return [...prev, item];
        });
    };

    const removeFromCompare = (productId: string) => {
        setCompareList((prev) => prev.filter((item) => item.id !== productId));
    };

    const isInCompare = (productId: string) => {
        return compareList.some((item) => item.id === productId);
    };

    const toggleCompare = (item: CompareItem) => {
        if (isInCompare(item.id)) {
            removeFromCompare(item.id);
        } else {
            addToCompare(item);
        }
    };

    const clearCompare = () => {
        setCompareList([]);
    };

    return {
        compareList,
        addToCompare,
        removeFromCompare,
        isInCompare,
        toggleCompare,
        clearCompare,
        count: compareList.length,
        isLoaded,
    };
}
