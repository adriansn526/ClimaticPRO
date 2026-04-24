import React from 'react';
import Link from 'next/link';
import { getPosts, getCategories } from '@/lib/wordpress';
import ArticleCard from '@/components/blog/ArticleCard';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Resurse și Ghiduri | ClimaticPro',
    description: 'Articole utile, ghiduri de cumpărare și noutăți din lumea climatizării.',
};

export default async function ResourcesPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const sp = await searchParams;
    const categorySlug = typeof sp.category === 'string' ? sp.category : undefined;

    const { posts } = await getPosts(12, undefined, categorySlug);
    const categories = await getCategories();

    // Sort categories by count desc
    const sortedCategories = [...categories].sort((a, b) => b.count - a.count);

    return (
        <div className="bg-gray-50 min-h-screen pb-20">
            {/* Header */}
            <div className="bg-blue-900 text-white py-16">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Resurse & Ghiduri</h1>
                    <p className="text-blue-100 text-lg max-w-2xl mx-auto">
                        Descoperă tot ce trebuie să știi despre alegerea, instalarea și întreținerea aparatului tău de aer condiționat.
                    </p>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                {/* Categories Tabs */}
                <div className="flex flex-wrap justify-center mb-12 gap-2">
                    <Link
                        href="/resurse"
                        className={`px-6 py-2 rounded-full border transition-colors ${!categorySlug ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-700 border-gray-200 hover:border-primary-600 hover:text-primary-600'}`}
                    >
                        Toate
                    </Link>
                    {sortedCategories.map((cat) => (
                        <Link
                            key={cat.id}
                            href={`/resurse?category=${cat.slug}`}
                            className={`px-6 py-2 rounded-full border transition-colors ${categorySlug === cat.slug ? 'bg-primary-600 text-white border-primary-600' : 'bg-white text-gray-700 border-gray-200 hover:border-primary-600 hover:text-primary-600'}`}
                        >
                            {cat.name} <span className="text-xs opacity-70 ml-1">({cat.count})</span>
                        </Link>
                    ))}
                </div>

                {/* Posts Grid */}
                {posts && posts.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {posts.map((post) => (
                            <div key={post.id} className="h-full">
                                <ArticleCard post={post} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-lg shadow-sm">
                        <p className="text-gray-500 text-lg mb-4">Nu există articole în această categorie momentan.</p>
                        <Link href="/resurse" className="text-primary-600 font-medium hover:underline">
                            Vezi toate articolele
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
