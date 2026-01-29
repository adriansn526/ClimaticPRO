'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { WooCommerceProduct } from '@/lib/woocommerce';
import ProductCard from '@/components/products/ProductCard';

interface BestSellersProps {
    products: WooCommerceProduct[];
}

export default function BestSellers({ products }: BestSellersProps) {
    if (products.length === 0) return null;

    return (
        <section className="py-16 bg-white">
            <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row justify-between items-end mb-10">
                    <div>
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                            Cele mai vândute
                        </h2>
                        <p className="text-gray-600 text-lg max-w-2xl">
                            Descoperă preferatele clienților noștri. Aceste modele combină performanța excelentă cu cel mai bun raport calitate-preț.
                        </p>
                    </div>
                    <Link
                        href="/produse?sort=popularity"
                        className="hidden md:flex items-center text-primary-600 font-semibold hover:text-primary-700 transition-colors mt-4 md:mt-0"
                    >
                        Vezi toate
                        <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    {products.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>

                <div className="mt-8 text-center md:hidden">
                    <Link
                        href="/produse?sort=popularity"
                        className="inline-flex items-center text-primary-600 font-semibold hover:text-primary-700 transition-colors"
                    >
                        Vezi toate
                        <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                </div>
            </div>
        </section>
    );
}
