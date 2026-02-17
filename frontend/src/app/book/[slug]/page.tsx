import { fetchBookBySlug } from '@/lib/api';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

type Props = {
    params: { slug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    try {
        const book = await fetchBookBySlug(params.slug);
        return {
            title: `${book.bookName} | Semester Swap`,
            description: `Buy ${book.bookName} (${book.condition}) for ₹${book.price}.`,
        };
    } catch (error) {
        return {
            title: 'Book Not Found',
        };
    }
}

export default async function BookDetailPage({ params }: Props) {
    let book;
    try {
        book = await fetchBookBySlug(params.slug);
    } catch (error) {
        notFound();
    }

    return (
        <div className="max-w-3xl mx-auto px-4 py-8">
            <Link href="/" className="text-blue-600 hover:underline mb-6 inline-block">
                &larr; Back to Listings
            </Link>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Image Gallery (Main Image) */}
                <div className="space-y-4">
                    <div className="aspect-[3/4] relative bg-gray-100 rounded-2xl overflow-hidden border border-gray-100">
                        {book.images[0] ? (
                            <Image
                                src={book.images[0].replace('/upload/', '/upload/f_auto,q_auto,w_1200/')}
                                alt={book.bookName}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 100vw, 50vw"
                                priority
                            />
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">
                                No Image
                            </div>
                        )}
                    </div>
                    {/* Thumbnails if > 1 would go here */}
                </div>

                {/* Details */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2 leading-tight">
                        {book.bookName}
                    </h1>
                    <p className="text-lg text-gray-600 mb-4">{book.subject}</p>

                    <div className="inline-block bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full mb-6">
                        {book.condition} Condition
                    </div>

                    <div className="border-t border-b border-gray-100 py-4 mb-6">
                        <span className="block text-sm text-gray-500 mb-1">Price</span>
                        <span className="text-3xl font-bold text-gray-900">₹{book.price}</span>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                            <p className="text-sm text-blue-800 font-medium mb-1">Seller Contact</p>
                            {/* For MVP, we show it directly. Phase 2 could require login. */}
                            <p className="text-xl font-bold text-gray-900 select-all">
                                {book.sellerPhone}
                            </p>
                            <p className="text-xs text-blue-600 mt-2">
                                Mention "Semester Swap" when calling.
                            </p>
                        </div>

                        <p className="text-xs text-gray-400 text-center">
                            Posted on {new Date(book.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
