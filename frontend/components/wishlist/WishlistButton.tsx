'use client';

import { useWishlist } from '@/lib/hooks/useWishlist';

// Define minimal product interface needed for wishlist
interface Product {
    id: string;
    name: string;
    slug: string;
    price?: string;
    regularPrice?: string;
    image?: {
        sourceUrl: string;
    } | null; // Allow null to match WooCommerceProduct
}

interface WishlistButtonProps {
    product: Product;
    variant?: 'icon' | 'button';
    className?: string;
}

export default function WishlistButton({
    product,
    variant = 'icon',
    className = ''
}: WishlistButtonProps) {
    const { isInWishlist, toggleWishlist, isLoaded } = useWishlist();

    const inWishlist = isInWishlist(product.id);

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        toggleWishlist({
            id: product.id,
            name: product.name,
            slug: product.slug,
            price: product.price || product.regularPrice,
            image: product.image?.sourceUrl,
        });
    };

    if (!isLoaded) {
        return null; // Prevent hydration mismatch
    }

    if (variant === 'button') {
        return (
            <button
                onClick={handleClick}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${inWishlist
                        ? 'bg-red-50 text-red-600 border-2 border-red-600'
                        : 'bg-white text-gray-600 border-2 border-gray-300 hover:border-red-600 hover:text-red-600'
                    } ${className}`}
                title={inWishlist ? 'Elimină din favorite' : 'Adaugă la favorite'}
            >
                <svg
                    className={`w-5 h-5 transition-all ${inWishlist ? 'fill-current' : 'fill-none'}`}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                </svg>
                {inWishlist ? 'În favorite' : 'Adaugă la favorite'}
            </button>
        );
    }

    return (
        <button
            onClick={handleClick}
            className={`relative p-2 rounded-full transition-all ${inWishlist
                    ? 'bg-red-50 text-red-600'
                    : 'bg-white/90 text-gray-600 hover:bg-red-50 hover:text-red-600'
                } shadow-md hover:shadow-lg ${className}`}
            title={inWishlist ? 'Elimină din favorite' : 'Adaugă la favorite'}
        >
            <svg
                className={`w-6 h-6 transition-all ${inWishlist ? 'fill-current scale-110' : 'fill-none'}`}
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
            </svg>
            {inWishlist && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                </span>
            )}
        </button>
    );
}
