'use client';

import { useEffect, useState } from 'react';
import { Book } from '@/lib/api';
import { getPendingBooks, approveBook, rejectBook } from '@/lib/api/admin';
import toast from 'react-hot-toast';

export default function AdminPendingsPage() {
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    const fetchBooks = async () => {
        try {
            const data = await getPendingBooks();
            setBooks(data);
        } catch (err) {
            setError('Failed to fetch pending books');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBooks();
    }, []);

    const handleApprove = async (id: string) => {
        if (!confirm('Are you sure you want to approve this book?')) return;
        try {
            await approveBook(id);
            setBooks(books.filter(b => b._id !== id));
            toast.success('Book approved successfully');
        } catch (err: any) {
            toast.error(err.message || 'Failed to approve book');
            console.error(err);
        }
    };

    const handleReject = async (id: string) => {
        if (!confirm('Are you sure you want to REJECT this book? This cannot be undone.')) return;
        try {
            await rejectBook(id);
            setBooks(books.filter(b => b._id !== id));
            toast.success('Book rejected');
        } catch (err: any) {
            toast.error(err.message || 'Failed to reject book');
            console.error(err);
        }
    };

    // Filter & Pagination Logic
    const filteredBooks = books.filter(book =>
        book.bookName.toLowerCase().includes(search.toLowerCase()) ||
        book.sellerEmail.toLowerCase().includes(search.toLowerCase())
    );

    const totalPages = Math.ceil(filteredBooks.length / itemsPerPage);
    const paginatedBooks = filteredBooks.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full opacity-75"></div>
        </div>
    );

    if (error) return <div className="text-red-500 text-center py-10">{error}</div>;

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Pending Approvals</h1>
                    <p className="text-sm text-gray-500">Review and moderate user listings.</p>
                </div>
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search books or sellers..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none w-full sm:w-64 transition-all"
                    />
                    <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
                </div>
            </div>

            {books.length === 0 ? (
                <div className="bg-white p-12 rounded-xl border border-dashed border-gray-300 text-center">
                    <div className="text-4xl mb-4">🎉</div>
                    <h3 className="text-lg font-medium text-gray-900">All caught up!</h3>
                    <p className="text-gray-500">No pending books to review at the moment.</p>
                </div>
            ) : filteredBooks.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    No results found for "{search}"
                </div>
            ) : (
                <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-gray-50/50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Book Details</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Seller</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {paginatedBooks.map((book) => (
                                    <tr key={book._id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="h-16 w-12 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden relative border border-gray-100">
                                                    {book.images[0] ? (
                                                        <img className="h-full w-full object-cover" src={book.images[0]} alt="" />
                                                    ) : (
                                                        <span className="flex items-center justify-center h-full text-xs">📚</span>
                                                    )}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-semibold text-gray-900 line-clamp-1">{book.bookName}</div>
                                                    <div className="text-xs text-gray-500 line-clamp-1">{book.subject}</div>
                                                    <div className="text-xs text-gray-400 mt-0.5">{new Date(book.createdAt).toLocaleDateString()}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900 font-medium">{book.sellerEmail || 'Unknown'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                                                ₹{book.price}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleApprove(book._id)}
                                                    className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg hover:bg-emerald-700 hover:shadow-sm transition-all text-xs font-medium"
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleReject(book._id)}
                                                    className="bg-white text-red-600 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 hover:border-red-300 transition-all text-xs font-medium"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Previous
                            </button>
                            <span className="text-sm text-gray-600">
                                Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
                            </span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
