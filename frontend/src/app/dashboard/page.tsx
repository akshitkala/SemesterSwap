
'use client';

import { useState, useEffect } from 'react';
import { Book, fetchSellerBooks, deleteBook } from '@/lib/api';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function Dashboard() {
    const { user, loading: authLoading, signInWithGoogle, logout } = useAuth();
    const router = useRouter();
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true); // Start loading true to fetch on mount
    const [error, setError] = useState('');

    useEffect(() => {
        // Fetch books if user is logged in
        if (user) {
            setLoading(true);
            user.getIdToken().then(token => {
                fetchSellerBooks(token)
                    .then(data => {
                        setBooks(data);
                    })
                    .catch(err => {
                        setError(err.message);
                    })
                    .finally(() => {
                        setLoading(false);
                    });
            });
        }
    }, [user]);

    // Handle delete
    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this listing? This cannot be undone.')) return;
        if (!user) return;

        try {
            const token = await user.getIdToken();
            await deleteBook(id, token);
            setBooks(books.filter(b => b._id !== id));
        } catch (err: any) {
            toast.error(err.message || 'Failed to delete listing');
        }
    };

    if (authLoading) return <div className="text-center py-20">Loading...</div>;

    if (!user) {
        return (
            <div className="max-w-md mx-auto px-4 py-20 text-center">
                <h2 className="text-2xl font-bold mb-4">Login Required</h2>
                <p className="text-gray-600 mb-6">You need to sign in to view your dashboard.</p>
                <button
                    onClick={() => signInWithGoogle()}
                    className="bg-emerald-600 text-white px-6 py-3 rounded-full font-bold hover:bg-emerald-700 transition-colors"
                >
                    Sign In with Google
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Dashboard Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Manage your books and track their status.
                    </p>
                </div>
                <Link
                    href="/sell"
                    className="inline-flex items-center justify-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-emerald-700 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                >
                    <span className="text-lg">+</span> Sell a Book
                </Link>
            </div>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-40 bg-gray-100 rounded-xl animate-pulse"></div>
                    ))}
                </div>
            ) : books.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
                    <div className="text-4xl mb-4">📚</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No listings yet</h3>
                    <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                        You haven't listed any books for sale. Start turning your old books into cash!
                    </p>
                    <Link
                        href="/sell"
                        className="text-emerald-600 font-medium hover:text-emerald-700 hover:underline underline-offset-4"
                    >
                        Create your first listing &rarr;
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {books.map((book) => (
                        <div key={book._id} className="group bg-white p-4 rounded-xl border border-gray-100 flex items-start sm:items-center gap-4 hover:shadow-md hover:border-emerald-100 transition-all duration-200">
                            {/* Image */}
                            <div className="h-24 w-20 bg-gray-50 rounded-lg flex-shrink-0 overflow-hidden relative border border-gray-100">
                                {book.images[0] ? (
                                    <img
                                        src={book.images[0]}
                                        alt={book.bookName}
                                        className="object-cover h-full w-full group-hover:scale-105 transition-transform duration-500"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-2xl">📚</div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0 py-1">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                                    <h3 className="font-semibold text-gray-900 truncate text-lg">{book.bookName}</h3>
                                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold w-fit ${book.status === 'approved' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100' :
                                        book.status === 'rejected' ? 'bg-red-50 text-red-700 ring-1 ring-red-100' :
                                            'bg-yellow-50 text-yellow-700 ring-1 ring-yellow-100'
                                        }`}>
                                        {book.status?.toUpperCase() || 'PENDING'}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 mb-3 line-clamp-1">{book.subject}</p>

                                <div className="flex items-center justify-between mt-2">
                                    <div className="flex items-center gap-3 text-sm">
                                        <span className="font-bold text-gray-900">₹{book.price}</span>
                                        <span className="text-gray-300">|</span>
                                        <span className="text-gray-500 capitalize">{book.condition}</span>
                                    </div>

                                    {/* Actions (Desktop) */}
                                    <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                        <Link
                                            href={`/dashboard/edit/${book._id}`}
                                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                            title="Edit"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(book._id)}
                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Delete"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Disclaimer Footer */}
            {!loading && books.length > 0 && (
                <p className="text-center text-xs text-gray-400 mt-8">
                    Listings are automatically removed 30 days after approval if not marked as sold.
                </p>
            )}
        </div>
    );
}
