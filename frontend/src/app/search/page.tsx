import { searchBooks, SearchFilters as FilterTypes } from '@/lib/api';
import BookCard from '@/components/BookCard';
import SearchBar from '@/components/SearchBar';
import SearchFilters from '@/components/SearchFilters';
import Link from 'next/link';
import Pagination from '@/components/Pagination';

export const dynamic = 'force-dynamic';

export default async function SearchPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
    const params = await searchParams;

    // Parse filters from URL searchParams
    const filters: FilterTypes = {
        q: params.q,
        condition: params.condition as any,
        subject: params.subject,
        sort: params.sort as any,
        minPrice: params.minPrice ? Number(params.minPrice) : undefined,
        maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
        page: params.page ? Number(params.page) : 1,
    };

    const response = await searchBooks(filters);
    // response shape: { success: true, count: number, data: Book[], pagination: {...} }
    // But api.ts `searchBooks` returns `SearchResult` which maps response json directly.
    // However, if backend returns wrapper `data: books` inside the `data` prop...
    // Wait, backend returns `{ success: true, count, data: [...], pagination }`.
    // API api.ts returns `res.json()`.
    // So `response.data` is the array of books.

    const books = response?.data || [];
    const pagination = response?.pagination;

    return (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="space-y-6">
                {/* Header & Search */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <Link href="/" className="text-emerald-600 hover:text-emerald-700 hover:underline font-medium text-sm">
                        &larr; Back to Home
                    </Link>
                    <div className="w-full md:w-2/3 lg:w-1/2">
                        <SearchBar />
                    </div>
                </div>

                {/* Content Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar Filters */}
                    <div className="lg:col-span-1">
                        <SearchFilters />
                    </div>

                    {/* Results Grid */}
                    <div className="lg:col-span-3 space-y-6">
                        <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <h1 className="font-semibold text-gray-900">
                                {filters.q ? `Results for "${filters.q}"` : 'All Books'}
                            </h1>
                            <span className="text-sm text-gray-500 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                                {pagination?.total || 0} result{pagination?.total !== 1 ? 's' : ''}
                            </span>
                        </div>

                        {books.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                                {books.map((book) => (
                                    <BookCard key={book._id} book={book} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-dashed border-gray-200">
                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                                    🔍
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-1">No books found</h3>
                                <p className="text-gray-500 max-w-sm mx-auto">
                                    Try adjusting your filters or search for a different keyword.
                                </p>
                            </div>
                        )}

                        {/* Pagination Controls */}
                        {pagination && (
                            <Pagination
                                page={pagination.page}
                                totalPages={pagination.pages}
                            />
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}

