'use client';

import { useEffect, useState } from 'react';
import { Book } from '@/lib/api';
import { getPendingBooks, approveBook, rejectBook } from '@/lib/api/admin';
import toast from 'react-hot-toast';

export default function AdminPendingsPage() {
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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

    if (loading) return <div>Loading...</div>;
    if (error) return <div className="text-red-500">{error}</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Pending Approvals</h1>

            {books.length === 0 ? (
                <div className="bg-white p-6 rounded-lg shadow-sm text-center text-gray-500">
                    No pending books found.
                </div>
            ) : (
                <div className="bg-white shadow-sm rounded-lg border overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Book</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seller</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {books.map((book) => (
                                <tr key={book._id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 flex-shrink-0">
                                                <img className="h-10 w-10 rounded-md object-cover" src={book.images[0] || '/placeholder.png'} alt="" />
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{book.bookName}</div>
                                                <div className="text-sm text-gray-500">{book.subject}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{book.sellerEmail || 'Unknown'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                            ₹{book.price}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(book.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                        <button
                                            onClick={() => handleApprove(book._id)}
                                            className="text-green-600 hover:text-green-900 bg-green-50 px-3 py-1 rounded-md"
                                        >
                                            Approve
                                        </button>
                                        <button
                                            onClick={() => handleReject(book._id)}
                                            className="text-red-600 hover:text-red-900 bg-red-50 px-3 py-1 rounded-md"
                                        >
                                            Reject
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
