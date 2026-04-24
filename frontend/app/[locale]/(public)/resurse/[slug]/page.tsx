import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getPostBySlug, getRecentPosts } from '@/lib/wordpress';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';

// Define params type for Next.js 13+ App Router
interface SinglePostPageProps {
    params: { slug: string };
}

export async function generateMetadata({ params }: SinglePostPageProps): Promise<Metadata> {
    const post = await getPostBySlug(params.slug);
    if (!post) return { title: 'Articolul nu a fost găsit' };

    return {
        title: `${post.title} | ClimaticPro`,
        description: post.excerpt ? post.excerpt.replace(/<[^>]*>/g, '').slice(0, 160) : '',
        openGraph: {
            images: post.featuredImage ? [post.featuredImage.node.sourceUrl] : [],
        }
    };
}

export default async function SinglePostPage({ params }: SinglePostPageProps) {
    const post = await getPostBySlug(params.slug);
    const recentPosts = await getRecentPosts(5);

    if (!post) {
        notFound();
    }

    // Filter out current post from related/recent
    const sidebarPosts = recentPosts.filter(p => p.id !== post.id).slice(0, 4);

    return (
        <div className="bg-gray-50 min-h-screen py-10">
            <div className="container mx-auto px-4">

                {/* Breadcrumb / Back */}
                <div className="mb-8">
                    <Link href="/resurse" className="inline-flex items-center text-gray-500 hover:text-primary-600 transition-colors bg-white px-4 py-2 rounded-lg shadow-sm">
                        <span>&larr; Înapoi la Resurse</span>
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Main Content */}
                    <article className="lg:col-span-8 bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                        {post.featuredImage?.node?.sourceUrl && (
                            <div className="relative w-full h-64 md:h-96">
                                <Image
                                    src={post.featuredImage.node.sourceUrl}
                                    alt={post.featuredImage.node.altText || post.title}
                                    fill
                                    className="object-cover"
                                    priority
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 70vw, 800px"
                                />
                            </div>
                        )}

                        <div className="p-6 md:p-10">
                            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
                                {post.title}
                            </h1>

                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-8 pb-8 border-b border-gray-100">
                                <div className="flex items-center">
                                    <span className="font-medium text-gray-900 mr-1">Publicat:</span>
                                    {new Date(post.date).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </div>
                                {post.categories?.nodes[0] && (
                                    <div className="flex items-center text-primary-600 bg-primary-50 px-3 py-1 rounded-full font-medium">
                                        {post.categories.nodes[0].name}
                                    </div>
                                )}
                            </div>

                            <div
                                className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-primary-600 prose-img:rounded-lg"
                                dangerouslySetInnerHTML={{ __html: post.content }}
                            />
                        </div>
                    </article>

                    {/* Sidebar */}
                    <aside className="lg:col-span-4 space-y-8">
                        {/* Recent/Usage Posts */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-24">
                            <h3 className="text-xl font-bold text-gray-900 mb-6 pb-2 border-b">
                                Alte articole recente
                            </h3>
                            <div className="space-y-6">
                                {sidebarPosts.map(sidebarPost => (
                                    <Link key={sidebarPost.id} href={`/resurse/${sidebarPost.slug}`} className="flex group items-start">
                                        <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                                            {sidebarPost.featuredImage?.node?.sourceUrl ? (
                                                <Image
                                                    src={sidebarPost.featuredImage.node.sourceUrl}
                                                    alt={sidebarPost.title}
                                                    fill
                                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                    sizes="80px"
                                                />
                                            ) : (
                                                <div className="absolute inset-0 bg-gray-200"></div>
                                            )}
                                        </div>
                                        <div className="ml-4 flex-grow">
                                            <span className="text-xs text-gray-500 block mb-1">
                                                {new Date(sidebarPost.date).toLocaleDateString('ro-RO', { month: 'short', day: 'numeric' })}
                                            </span>
                                            <h4 className="text-sm font-semibold text-gray-900 group-hover:text-primary-600 line-clamp-2 leading-snug">
                                                {sidebarPost.title}
                                            </h4>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        {/* CTA - Ask for Offer */}
                        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl shadow-lg p-8 text-white text-center">
                            <h3 className="text-xl font-bold mb-3">Ai nevoie de sfat?</h3>
                            <p className="text-blue-100 mb-6 text-sm">
                                Echipa noastră de experți te poate ajuta să alegi aparatul de aer condiționat perfect.
                            </p>
                            <Link
                                href="/contact"
                                className="inline-block bg-white text-blue-700 font-bold py-3 px-6 rounded-lg shadow-md hover:bg-gray-50 transition-colors w-full"
                            >
                                Contactează-ne
                            </Link>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}
