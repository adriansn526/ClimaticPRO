import React, { createContext, useState, useContext, useEffect } from 'react';
import { Platform } from 'react-native';
import { fetchWithAuth } from '../utils/api';

export type B2BProduct = {
    id: string;
    name: string;
    capacity: string;
    priceB2B: number;
    priceRetail: number;
    stock: number;
    image: string;
};

// Mock fallback data while API isn't ready
const MOCK_B2B_PRODUCTS: B2BProduct[] = [
    {
        id: '1',
        name: 'Aparat de aer condiționat Daikin Sensira',
        capacity: '12000 BTU',
        priceB2B: 1850,
        priceRetail: 2200,
        stock: 12,
        image: 'https://via.placeholder.com/150/E5E7EB/4B5563?text=AC+Unit'
    },
    {
        id: '2',
        name: 'Teavă de cupru izolată (Colac 50m)',
        capacity: '1/4" - 3/8"',
        priceB2B: 450,
        priceRetail: 600,
        stock: 5,
        image: 'https://via.placeholder.com/150/E5E7EB/4B5563?text=Teava'
    },
    {
        id: '3',
        name: 'Suport aer condiționat',
        capacity: 'Rabatabil 400mm',
        priceB2B: 35,
        priceRetail: 55,
        stock: 40,
        image: 'https://via.placeholder.com/150/E5E7EB/4B5563?text=Suport'
    },
    {
        id: '4',
        name: 'Pompă de condens',
        capacity: 'Mini Lime',
        priceB2B: 280,
        priceRetail: 350,
        stock: 8,
        image: 'https://via.placeholder.com/150/E5E7EB/4B5563?text=Pompa'
    }
];

type ShopContextType = {
    products: B2BProduct[];
    cartCount: number;
    isLoading: boolean;
    addToCart: (product: B2BProduct) => void;
    fetchProducts: () => Promise<void>;
};

export const ShopContext = createContext<ShopContextType | null>(null);

export const ShopProvider = ({ children }: { children: React.ReactNode }) => {
    const [products, setProducts] = useState<B2BProduct[]>([]); // Changed initial state to empty array
    const [cartCount, setCartCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const fetchProducts = async () => {
        setIsLoading(true);
        try {
            // Replaced fetch block with fetchWithAuth
            const data = await fetchWithAuth('/mobile/b2b-products');
            setProducts(data);
        } catch (error) {
            console.error('Error fetching B2B products:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const addToCart = (product: B2BProduct) => {
        setCartCount(prev => prev + 1);
        if (Platform.OS === 'web') {
            console.log(`Added ${product.name} to cart.`);
        }
    };

    // Initial fetch
    useEffect(() => {
        fetchProducts();
    }, []);

    return (
        <ShopContext.Provider value={{ products, cartCount, isLoading, addToCart, fetchProducts }}>
            {children}
        </ShopContext.Provider>
    );
};

export const useShop = () => {
    const context = useContext(ShopContext);
    if (!context) throw new Error("useShop must be used within a ShopProvider");
    return context;
};
