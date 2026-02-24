'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { getBrandImage } from '@/lib/brandImages';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

interface BrandFilterBarProps {
    brands: { slug: string; name: string; count: number }[];
    selectedBrand?: string;
}

export default function BrandFilterBar({ brands, selectedBrand }: BrandFilterBarProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Filter out brands provided (which come from products) to only those we have images for, OR just show text if no image?
    // User said "show images". 
    // Let's prioritizing ones with images, but maybe show all?
    // "afisam pe orizontala imaginile brandurilor". 
    // If a brand doesn't have an image, maybe skip it or show text?
    // Let's show all, but styled nicely.

    // Sort brands: Selected first, then by count
    const sortedBrands = [...brands].sort((a, b) => {
        const isSelectedA = selectedBrand === a.slug;
        const isSelectedB = selectedBrand === b.slug;
        if (isSelectedA && !isSelectedB) return -1;
        if (!isSelectedA && isSelectedB) return 1;
        return b.count - a.count;
    });

    const handleBrandClick = (slug: string) => {
        const params = new URLSearchParams(searchParams.toString());

        if (selectedBrand === slug) {
            params.delete('brand');
        } else {
            params.set('brand', slug);
        }

        // Reset page
        params.delete('after');

        router.push(`/produse?${params.toString()}`);
    };

    if (sortedBrands.length === 0) return null;

    return (
        <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Filtrează după Brand</h3>
                {selectedBrand && (
                    <button
                        onClick={() => handleBrandClick(selectedBrand)}
                        className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                    >
                        <X className="w-3 h-3" /> Șterge filtrul
                    </button>
                )}
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
                {sortedBrands.map((brand) => {
                    const imageInfo = getBrandImage(brand.slug);
                    const isSelected = selectedBrand === brand.slug;

                    return (
                        <button
                            key={brand.slug}
                            onClick={() => handleBrandClick(brand.slug)}
                            className={cn(
                                "flex-shrink-0 relative group transition-all duration-200 rounded-xl border-2 overflow-hidden",
                                "w-32 h-20 sm:w-40 sm:h-24",
                                isSelected
                                    ? "border-cyan-500 ring-2 ring-cyan-100 bg-cyan-50"
                                    : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-md"
                            )}
                        >
                            {imageInfo?.imageUrl && !imageInfo.imageUrl.includes('placehold') ? (
                                <div className="relative w-full h-full p-2">
                                    <Image
                                        src={imageInfo.imageUrl}
                                        alt={brand.name}
                                        fill
                                        className="object-contain p-2"
                                        sizes="160px"
                                    />
                                </div>
                            ) : (
                                <div className="flex items-center justify-center w-full h-full p-2">
                                    <span className={cn(
                                        "font-bold text-center",
                                        isSelected ? "text-cyan-700" : "text-gray-600"
                                    )}>
                                        {brand.name}
                                    </span>
                                </div>
                            )}

                            {/* Count Badge */}
                            <div className={cn(
                                "absolute top-1 right-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                                isSelected ? "bg-cyan-500 text-white" : "bg-gray-100 text-gray-500 group-hover:bg-gray-200"
                            )}>
                                {brand.count}
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
