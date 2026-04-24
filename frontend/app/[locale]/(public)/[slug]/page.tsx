import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getPostBySlug, getRecentPosts } from '@/lib/wordpress';
import * as cheerio from 'cheerio';
import { Clock, Calendar, User, Share2, ChevronRight, Facebook, Linkedin, Twitter } from 'lucide-react';
import ArticleCard from '@/components/blog/ArticleCard';

// ... (Metadata function remains similar)
// Define params type for Next.js 13+ App Router
interface SinglePostPageProps {
    params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: SinglePostPageProps): Promise<Metadata> {
    const { slug } = await params;
    const post = await getPostBySlug(slug);
    if (!post) {
        return { title: 'Pagina nu a fost găsită' };
    }

    return {
        title: `${post.title} | ClimaticPro`,
        description: post.excerpt ? post.excerpt.replace(/<[^>]*>/g, '').slice(0, 160) : '',
        openGraph: {
            images: post.featuredImage ? [post.featuredImage.node.sourceUrl] : [],
        }
    };
}

function calculateReadingTime(content: string): number {
    const wordsPerMinute = 200;
    const noOfWords = content.split(/\s/g).length;
    const minutes = noOfWords / wordsPerMinute;
    return Math.ceil(minutes);
}

function parseContent(html: string) {
    const $ = cheerio.load(html);

    // Remove Elementor junk
    $('.elementor-section, .elementor-column, .elementor-widget-wrap').each((_, el) => {
        $(el).removeAttr('class');
        $(el).removeAttr('style');
    });

    // Replace old domain with new CMS domain in images and links
    $('img').each((_, el) => {
        const src = $(el).attr('src');
        if (src && src.includes('https://climaticpro.ro/wp-content/')) {
            $(el).attr('src', src.replace('https://climaticpro.ro/wp-content/', 'https://cms.climaticpro.ro/wp-content/'));
        }
        // Also fix srcset if present
        const srcset = $(el).attr('srcset');
        if (srcset && srcset.includes('https://climaticpro.ro/wp-content/')) {
            $(el).attr('srcset', srcset.replaceAll('https://climaticpro.ro/wp-content/', 'https://cms.climaticpro.ro/wp-content/'));
        }
    });

    $('a').each((_, el) => {
        const href = $(el).attr('href');
        if (href && href.includes('https://climaticpro.ro/wp-content/')) {
            $(el).attr('href', href.replace('https://climaticpro.ro/wp-content/', 'https://cms.climaticpro.ro/wp-content/'));
        }
    });

    // Remove empty paragraphs often left by Elementor
    $('p').each((_, el) => {
        if ($(el).text().trim() === '') {
            $(el).remove();
        }
    });

    // Extract Headings for TOC
    const toc: { id: string; text: string; level: number }[] = [];
    $('h2, h3').each((i, el) => {
        const text = $(el).text();
        // Create a slug-friendly ID
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || `heading-${i}`;
        $(el).attr('id', id);
        toc.push({
            id,
            text,
            level: parseInt(el.tagName.replace('h', ''))
        });
    });

    return {
        cleanedContent: $('body').html() || '',
        toc
    };
}

export default async function SingleSlugPage({ params }: SinglePostPageProps) {
    const { slug } = await params;
    const post = await getPostBySlug(slug);

    if (!post) notFound();

    const { cleanedContent, toc } = parseContent(post.content);
    const readingTime = calculateReadingTime(post.content);
    const relatedPosts = (await getRecentPosts(4)).filter(p => p.id !== post.id).slice(0, 3);

    return (
        <div className="bg-white min-h-screen">
            {/* Hero Section */}
            <div className="relative h-[50vh] min-h-[400px] w-full bg-slate-900 text-white overflow-hidden">
                {post.featuredImage?.node?.sourceUrl && (
                    <>
                        <Image
                            src={post.featuredImage.node.sourceUrl}
                            alt={post.featuredImage.node.altText || post.title}
                            fill
                            className="object-cover opacity-30"
                            priority
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent" />
                    </>
                )}
                <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 lg:p-20 container mx-auto relative z-10">
                    <div className="max-w-4xl mx-auto lg:mx-0">
                        <div className="mb-6">
                            <Link href="/resurse" className="inline-flex items-center text-slate-300 hover:text-primary-400 transition-colors mb-4">
                                <ChevronRight className="rotate-180 mr-1" size={16} />
                                Înapoi la Resurse
                            </Link>
                            {post.categories?.nodes[0] && (
                                <div className="block mt-2">
                                    <span className="inline-block px-3 py-1 bg-primary-600/90 backdrop-blur text-white text-xs font-bold uppercase tracking-wider rounded">
                                        {post.categories.nodes[0].name}
                                    </span>
                                </div>
                            )}
                        </div>

                        <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight text-white">
                            {post.title}
                        </h1>

                        <div className="flex flex-wrap items-center gap-6 text-slate-300 text-sm md:text-base font-medium border-t border-white/10 pt-6">
                            <div className="flex items-center">
                                <User size={18} className="mr-2 text-primary-400" />
                                <span className="text-white">{post.author?.node?.name || 'ClimaticPro'}</span>
                            </div>
                            <div className="flex items-center">
                                <Calendar size={18} className="mr-2 text-primary-400" />
                                <span className="text-white">
                                    {new Date(post.date).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </span>
                            </div>
                            <div className="flex items-center">
                                <Clock size={18} className="mr-2 text-primary-400" />
                                <span className="text-white">{readingTime} min citire</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-12 lg:py-16 flex flex-col lg:flex-row gap-12">

                {/* Main Content */}
                <main className="lg:w-3/4 order-1 lg:order-1">
                    <article
                        className="prose prose-lg md:prose-xl max-w-none 
                        prose-headings:font-bold prose-headings:text-gray-900 
                        prose-p:text-gray-700 prose-p:leading-relaxed
                        prose-a:text-primary-600 hover:prose-a:text-primary-700 
                        prose-img:rounded-2xl prose-img:shadow-lg prose-img:my-8
                        prose-blockquote:border-l-4 prose-blockquote:border-primary-500 prose-blockquote:bg-gray-50 prose-blockquote:py-4 prose-blockquote:px-6 prose-blockquote:rounded-r-lg prose-blockquote:font-medium prose-blockquote:text-gray-700 prose-blockquote:not-italic
                        prose-li:text-gray-700
                        [&>*:first-child]:mt-0"
                        dangerouslySetInnerHTML={{ __html: cleanedContent }}
                    />

                    {/* Tags / Share Bottom Mobile */}
                    <div className="mt-12 pt-8 border-t border-gray-100 lg:hidden">
                        <h3 className="font-bold text-gray-900 mb-4 text-center">Distribuie acest articol</h3>
                        <div className="flex justify-center gap-4">
                            <button className="p-3 bg-blue-600 text-white rounded-full hover:opacity-90 shadow-sm"><Facebook size={20} /></button>
                            <button className="p-3 bg-sky-500 text-white rounded-full hover:opacity-90 shadow-sm"><Twitter size={20} /></button>
                            <button className="p-3 bg-blue-700 text-white rounded-full hover:opacity-90 shadow-sm"><Linkedin size={20} /></button>
                        </div>
                    </div>
                </main>

                {/* Sidebar / TOC */}
                <aside className="lg:w-1/4 order-2 lg:order-2">
                    <div className="sticky top-24 space-y-8">
                        {toc.length > 0 && (
                            <div className="bg-gray-50/80 backdrop-blur rounded-xl p-6 border border-gray-200 shadow-sm">
                                <h3 className="font-bold text-gray-900 mb-4 uppercase text-xs tracking-wider flex items-center">
                                    <span className="w-1 h-4 bg-primary-600 rounded-full mr-2"></span>
                                    Cuprins
                                </h3>
                                <nav className="space-y-1 max-h-[70vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300">
                                    {toc.map(item => (
                                        <a
                                            key={item.id}
                                            href={`#${item.id}`}
                                            className={`block text-sm py-1.5 border-l-2 pl-3 transition-colors hover:text-primary-600 hover:border-primary-600 ${item.level === 3
                                                ? 'border-transparent text-gray-500 ml-2'
                                                : 'border-transparent text-gray-700 font-medium'
                                                }`}
                                        >
                                            {item.text}
                                        </a>
                                    ))}
                                </nav>
                            </div>
                        )}

                        {/* Share Desktop */}
                        <div className="hidden lg:block">
                            <h3 className="font-bold text-gray-900 mb-4 uppercase text-xs tracking-wider text-center">Distribuie</h3>
                            <div className="flex justify-center gap-2">
                                <button className="p-2 bg-blue-600 text-white rounded hover:opacity-90 hover:-translate-y-1 transition-all"><Facebook size={20} /></button>
                                <button className="p-2 bg-sky-500 text-white rounded hover:opacity-90 hover:-translate-y-1 transition-all"><Twitter size={20} /></button>
                                <button className="p-2 bg-blue-700 text-white rounded hover:opacity-90 hover:-translate-y-1 transition-all"><Linkedin size={20} /></button>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>

            {/* Related Posts */}
            {relatedPosts.length > 0 && (
                <div className="bg-gray-50 py-20 border-t border-gray-200">
                    <div className="container mx-auto px-4">
                        <div className="flex justify-between items-end mb-10">
                            <div>
                                <h2 className="text-3xl font-bold text-gray-900 mb-2">Articole Similare</h2>
                                <p className="text-gray-500">Alte resurse care te-ar putea interesa</p>
                            </div>
                            <Link href="/resurse" className="hidden md:flex items-center font-bold text-primary-600 hover:text-primary-700 transition-colors">
                                Vezi toate articolele <ChevronRight size={20} />
                            </Link>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {relatedPosts.map(relatedPost => (
                                <div key={relatedPost.id} className="h-full">
                                    <ArticleCard post={relatedPost} />
                                </div>
                            ))}
                        </div>
                        <div className="mt-8 text-center md:hidden">
                            <Link href="/resurse" className="inline-flex items-center font-bold text-primary-600">
                                Vezi toate articolele <ChevronRight size={20} />
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
