
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
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold">My Listings</h1>
                    <p className="text-sm text-gray-500">Welcome, {user.displayName || user.email}</p>
                </div>
                <button
                    onClick={() => { logout(); router.push('/'); }}
                    className="text-sm text-red-500 hover:text-red-700 border border-red-100 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors"
                >
                    Logout
                </button>
            </div>

            {loading ? (
                <div className="text-center py-20 text-gray-400">Loading listings...</div>
            ) : books.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-2xl">
                    <p className="text-gray-500 mb-4">You haven't listed any books yet.</p>
                    <Link href="/sell" className="inline-block bg-emerald-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-emerald-700 hover:shadow-md transition-all">
                        List a Book
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {books.map((book) => (
                        <div key={book._id} className="bg-white p-4 rounded-xl border border-gray-100 flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
                            <div className="h-20 w-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden relative">
                                {book.images[0] ? (
                                    <img src={book.images[0]} alt={book.bookName} className="object-cover h-full w-full" />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-2xl">📚</div>
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-semibold text-gray-900 truncate">{book.bookName}</h3>
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${book.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                                        book.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                            'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {book.status?.toUpperCase() || 'PENDING'}
                                    </span>
                                </div>
                                <div className="flex items-center text-sm text-gray-500 gap-3">
                                    <span>₹{book.price}</span>
                                    <span>• {book.condition}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Link
                                    href={`/dashboard/edit/${book._id}`}
                                    className="text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition-all"
                                    title="Edit Listing"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                </Link>
                                <button
                                    onClick={() => handleDelete(book._id)}
                                    className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-all"
                                    title="Delete Listing"
                                >
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
