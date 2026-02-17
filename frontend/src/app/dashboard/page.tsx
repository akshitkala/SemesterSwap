'use client';

import { useState } from 'react';
import { Book, fetchSellerBooks, deleteBook } from '@/lib/api';
import Link from 'next/link';

export default function Dashboard() {
    const [phone, setPhone] = useState('');
    const [isVerified, setIsVerified] = useState(false);
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const data = await fetchSellerBooks(phone);
            setBooks(data);
            setIsVerified(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this listing? This cannot be undone.')) return;

        try {
            await deleteBook(id, phone);
            setBooks(books.filter(b => b._id !== id));
        } catch (err: any) {
            alert(err.message);
        }
    };

    if (!isVerified) {
        return (
            <div className="max-w-md mx-auto px-4 py-12">
                <h1 className="text-2xl font-bold mb-6 text-center">Seller Dashboard</h1>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-gray-600 mb-4 text-center text-sm">
                        Enter the phone number you used to list your books to manage them.
                    </p>
                    <form onSubmit={handleVerify} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Phone Number
                            </label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="e.g. 9876543210"
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                            {loading ? 'Verifying...' : 'View My Listings'}
                        </button>
                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-bold">My Listings</h1>
                <button
                    onClick={() => { setIsVerified(false); setPhone(''); }}
                    className="text-sm text-gray-500 hover:text-gray-900"
                >
                    Logout
                </button>
            </div>

            {books.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-2xl">
                    <p className="text-gray-500 mb-4">No listings found for {phone}</p>
                    <Link href="/sell" className="inline-block bg-black text-white px-6 py-2 rounded-lg font-medium">
                        List a Book
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {books.map((book) => (
                        <div key={book._id} className="bg-white p-4 rounded-xl border border-gray-100 flex items-center gap-4">
                            <div className="h-20 w-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden relative">
                                {/* Reuse image logic or simple placeholder */}
                                {book.images[0] && (
                                    <img src={book.images[0]} alt={book.bookName} className="object-cover h-full w-full" />
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-medium text-gray-900 truncate">{book.bookName}</h3>
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${book.status === 'approved' ? 'bg-green-100 text-green-800' :
                                            book.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                                'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {book.status?.toUpperCase() || 'PENDING'}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500">₹{book.price}</p>
                            </div>

                            <button
                                onClick={() => handleDelete(book._id)}
                                className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                title="Delete Listing"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
