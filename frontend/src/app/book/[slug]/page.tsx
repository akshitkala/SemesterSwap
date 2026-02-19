
import { fetchBookBySlug } from '@/lib/api';
import BookGallery from '@/components/BookGallery';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

type Props = {
    params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    try {
        const { slug } = await params;
        const book = await fetchBookBySlug(slug);
        return {
            title: `${book.bookName} | Semester Swap`,
            description: `Buy ${book.bookName} (${book.condition}) for ₹${book.price}.`,
        };
    } catch (error) {
        return {
            title: 'Book Not Found | Semester Swap',
        };
    }
}

export default async function BookDetailPage({ params }: Props) {
    let book;
    try {
        const { slug } = await params;
        book = await fetchBookBySlug(slug);
    } catch (error) {
        notFound();
    }

    if (!book) notFound();

    // Condition Badge Colors
    const conditionColors = {
        new: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        good: 'bg-blue-100 text-blue-800 border-blue-200',
        used: 'bg-amber-100 text-amber-800 border-amber-200',
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Back Link */}
                <Link
                    href="/"
                    className="inline-flex items-center text-emerald-600 hover:text-emerald-700 font-medium mb-8 transition-colors group"
                >
                    <svg className="w-5 h-5 mr-1 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                    Back to Listings
                </Link>

                <div className="grid lg:grid-cols-2 gap-12 items-start">
                    {/* Left Column: Image Gallery */}
                    <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 sticky top-24">
                        {book.images && book.images.length > 0 ? (
                            <BookGallery images={book.images} title={book.bookName} />
                        ) : (
                            <div className="aspect-[3/4] bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
                                <span className="text-lg font-medium">No Image Available</span>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Book Details */}
                    <div className="space-y-8">
                        <div>
                            <div className="flex flex-col gap-2 mb-4">
                                <div className="flex items-center gap-3">
                                    <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${conditionColors[book.condition] || 'bg-gray-100 text-gray-800'}`}>
                                        {book.condition} Condition
                                    </span>
                                    <span className="text-sm text-gray-400">
                                        • Posted {new Date(book.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                {book.conditionDescription && (
                                    <p className="text-sm text-gray-600 italic bg-gray-50 p-3 rounded-lg border border-gray-100">
                                        "{book.conditionDescription}"
                                    </p>
                                )}
                            </div>

                            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-4">
                                {book.bookName}
                            </h1>
                            <p className="text-xl text-gray-600 font-medium border-b border-gray-100 pb-6">
                                {book.subject}
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <p className="text-sm text-gray-500 font-medium uppercase tracking-wide mb-1">Price</p>
                                <p className="text-5xl font-bold text-emerald-600 tracking-tight">
                                    ₹{book.price}
                                </p>
                            </div>

                            {/* Call to Action Card */}
                            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500">Seller Contact</p>
                                        <p className="text-lg font-bold text-gray-900">+91 {book.sellerPhone.replace(/(\d{5})(\d{5})/, '$1 $2')}</p>
                                    </div>
                                    <div className="h-10 w-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                    </div>
                                </div>

                                <a
                                    href={`https://wa.me/91${book.sellerPhone}?text=Hi, I'm interested in buying "${book.bookName}" listed on Semester Swap.`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block w-full bg-emerald-600 hover:bg-emerald-700 text-white text-center font-bold py-4 rounded-xl transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                                >
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.964 9.964 0 0 0 1.333 4.993L2 22l5.233-1.237a9.994 9.994 0 0 0 14.779-10.779C21.99 4.485 17.514 2 12.012 2zm0 18.586a8.558 8.558 0 0 1-4.287-1.144l-.305-.18-3.136.732.836-3.036-.197-.318a8.577 8.577 0 0 1 12.636-8.577 8.577 8.577 0 0 1-5.547 12.523zm4.722-6.422c-.258-.129-1.527-.753-1.763-.838-.237-.086-.408-.129-.58.129-.172.258-.666.838-.817 1.01-.15.172-.3.193-.558.064-.258-.129-1.088-.401-2.072-1.279-.766-.682-1.284-1.525-1.434-1.783-.15-.258-.016-.398.113-.527.118-.117.258-.3.387-.451.129-.15.172-.258.258-.43.086-.172.043-.322-.022-.451-.064-.129-.58-1.397-.795-1.913-.21-.505-.422-.436-.58-.444-.15-.008-.322-.008-.494-.008-.172 0-.451.064-.688.322-.236.258-.902.881-.902 2.149 0 1.268.924 2.493 1.053 2.665.129.172 1.816 2.772 4.4 3.889 2.584 1.117 2.584.745 3.057.699.473-.046 1.527-.623 1.741-1.225.215-.602.215-1.118.15-1.225-.064-.108-.236-.172-.494-.301z" /></svg>
                                    Chat on WhatsApp
                                </a>
                                <p className="text-xs text-center text-gray-500">
                                    Directly message the seller to negotiate and meet up.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
