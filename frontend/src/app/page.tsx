import BookCard from '@/components/BookCard';
import SearchBar from '@/components/SearchBar';
import { fetchBooks } from '@/lib/api';
import Link from 'next/link';

// ISR: serve from cache, revalidate at most once per minute
export const revalidate = 60;

export default async function Home() {
  const books = await fetchBooks();

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero Section - Full Width */}
      <section className="w-full bg-emerald-600 text-white py-24 px-4 text-center shadow-md mb-12">
        <div className="max-w-4xl mx-auto space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight drop-shadow-sm">
            Find Used Books at <span className="text-emerald-100">LPU</span>
          </h1>
          <p className="text-lg md:text-xl text-emerald-50 max-w-2xl mx-auto font-medium leading-relaxed">
            Direct student-to-student exchange. Zero fees.
            The smartest way to swap your semester books.
          </p>
          <div className="pt-4 max-w-xl mx-auto">
            <SearchBar />
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900">How Semester Swap Works</h2>
            <p className="text-gray-500 mt-2">Simple, fast, and free for everyone at LPU.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center text-3xl mb-4">
                📸
              </div>
              <h3 className="font-semibold text-lg text-gray-900 mb-2">1. List Your Book</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Upload photos and add details. It takes less than 60 seconds to post a listing.
              </p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-3xl mb-4">
                💬
              </div>
              <h3 className="font-semibold text-lg text-gray-900 mb-2">2. Chat & Connect</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Buyers contact you directly via WhatsApp or Email. No middlemen involved.
              </p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center text-3xl mb-4">
                🤝
              </div>
              <h3 className="font-semibold text-lg text-gray-900 mb-2">3. Meet & Swap</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                Meet on campus (e.g., at Block 34 or the Library) to exchange the book and cash.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Content Section - Constrained */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 space-y-8">
        {books.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
            {books.map((book, index) => (
              <BookCard key={book._id} book={book} priority={index < 4} />
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
    </main>
  );
}
