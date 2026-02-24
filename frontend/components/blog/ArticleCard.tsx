import Link from 'next/link';
import Image from 'next/image';
import { BlogPost } from '@/lib/wordpress';

interface ArticleCardProps {
    post: BlogPost;
}

export default function ArticleCard({ post }: ArticleCardProps) {
    return (
        <Link href={`/${post.slug}`} className="group flex flex-col bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100 h-full">
            <div className="relative aspect-video w-full overflow-hidden bg-gray-100">
                {post.featuredImage?.node?.sourceUrl ? (
                    <Image
                        src={post.featuredImage.node.sourceUrl}
                        alt={post.featuredImage.node.altText || post.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                        <span>No Image</span>
                    </div>
                )}
            </div>
            <div className="p-5 flex flex-col flex-grow">
                <div className="flex items-center text-xs text-gray-500 mb-2 space-x-2">
                    <span>{new Date(post.date).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    {post.categories?.nodes[0] && (
                        <>
                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                            <span className="text-primary-600 font-medium">{post.categories.nodes[0].name}</span>
                        </>
                    )}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
                    {post.title}
                </h3>
                <div
                    className="text-gray-600 text-sm line-clamp-3 mb-4 flex-grow"
                    dangerouslySetInnerHTML={{ __html: post.excerpt || '' }}
                />
                <div className="flex items-center mt-auto">
                    {post.author?.node?.avatar && (
                        <div className="relative w-6 h-6 rounded-full overflow-hidden mr-2">
                            <Image src={post.author.node.avatar.url} alt={post.author.node.name} fill sizes="24px" />
                        </div>
                    )}
                    <span className="text-xs font-medium text-gray-700">
                        Citește mai mult &rarr;
                    </span>
                </div>
            </div>
        </Link>
    );
}
