import BookCard from '@/components/BookCard';
import SearchBar from '@/components/SearchBar';
import { fetchBooks } from '@/lib/api';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const books = await fetchBooks();

  return (
    <>
      {/* Hero Section */}
      <section className="bg-emerald-600 text-white py-20 px-6 text-center shadow-lg rounded-3xl mb-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 leading-tight drop-shadow-sm">
            Find Used Books at <span className="text-emerald-100">LPU</span>
          </h1>
          <p className="text-lg md:text-xl text-emerald-50 max-w-2xl mx-auto mb-10 font-medium leading-relaxed">
            Direct student-to-student exchange. Zero fees.
            The smartest way to swap your semester books.
          </p>
          <SearchBar />
        </div>
      </section>

      {/* Content Section */}
      <div className="space-y-8">
        {books.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {books.map((book) => (
              <BookCard key={book._id} book={book} />
            ))}
          </div>
        ) : (
          /* Refined Empty State */
          <div className="text-center py-20 flex flex-col items-center bg-white rounded-3xl shadow-sm border border-gray-100 mx-auto max-w-2xl">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center shadow-sm mb-6 text-3xl border border-emerald-100">
              📚
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No books listed yet</h3>
            <p className="text-gray-500 mb-8 max-w-md px-4">
              Be the first to list a book! Help your juniors and earn some extra cash by selling your old semester books.
            </p>
            <Link
              href="/sell"
              className="inline-flex items-center justify-center px-8 py-3.5 border border-transparent text-base font-semibold rounded-full text-white bg-emerald-600 hover:bg-emerald-700 hover:shadow-lg transition-all transform hover:-translate-y-0.5 focus:ring-4 focus:ring-emerald-100"
            >
              Start Selling
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
