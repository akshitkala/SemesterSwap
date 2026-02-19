import { searchBooks } from '@/lib/api';
import BookCard from '@/components/BookCard';
import SearchBar from '@/components/SearchBar';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function SearchPage({
    searchParams,
}: {
    searchParams: Promise<{ q: string }>;
}) {
    const { q } = await searchParams;
    const query = q || '';
    const response = query ? await searchBooks({ q: query }) : null;
    const books = response?.data || [];

    return (
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="min-h-screen space-y-8">
                <Link href="/" className="text-emerald-600 hover:text-emerald-700 hover:underline inline-block font-medium">
                    &larr; Back to Home
                </Link>

                <div className="mb-8">
                    <SearchBar />
                </div>

                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">
                        {query ? `Results for "${query}"` : 'Search Books'}
                    </h1>
                    {query && (
                        <p className="text-gray-500 mt-1">
                            Found {books.length} result{books.length !== 1 ? 's' : ''}
                        </p>
                    )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
                    {books.map((book) => (
                        <BookCard key={book._id} book={book} />
                    ))}
                </div>

                {query && books.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100 max-w-2xl mx-auto">
                        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center shadow-sm mb-6 text-3xl border border-emerald-100 mx-auto">
                            🔍
                        </div>
                        <p className="text-gray-900 font-bold text-xl mb-2">No matches found for "{query}"</p>
                        <p className="text-gray-500">Try a different keyword or check spelling.</p>
                    </div>
                )}
            </div>
        </main>
    );
}
