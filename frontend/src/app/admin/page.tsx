
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { API_URL, Book } from '@/lib/api';

export default function AdminDashboard() {
    const { user, isAdmin, loading: authLoading } = useAuth();
    const router = useRouter();
    const [pendingBooks, setPendingBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading) {
            if (!user || !isAdmin) {
                router.push('/');
                return;
            }

            // Fetch pending books
            user.getIdToken().then(token => {
                fetch(`${API_URL}/admin/pending`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                    .then(res => res.json())
                    .then(data => {
                        if (data.success) {
                            setPendingBooks(data.data);
                        }
                    })
                    .catch(err => console.error(err))
                    .finally(() => setLoading(false));
            });
        }
    }, [user, isAdmin, authLoading, router]);

    const handleApprove = async (id: string) => {
        if (!user) return;
        const token = await user.getIdToken();
        try {
            const res = await fetch(`${API_URL}/admin/approve/${id}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setPendingBooks(pendingBooks.filter(b => b._id !== id));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleReject = async (id: string) => {
        if (!confirm('Reject and delete this book?')) return;
        if (!user) return;
        const token = await user.getIdToken();
        try {
            const res = await fetch(`${API_URL}/admin/reject/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setPendingBooks(pendingBooks.filter(b => b._id !== id));
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (authLoading || loading) return <div className="p-10 text-center">Loading Admin Panel...</div>;

    if (!isAdmin) return null; // Should redirect in effect

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8 text-gray-900 border-b pb-4">Admin Dashboard</h1>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-semibold mb-4 text-emerald-700">Pending Approvals ({pendingBooks.length})</h2>

                {pendingBooks.length === 0 ? (
                    <p className="text-gray-500 italic">No books waiting for approval.</p>
                ) : (
                    <div className="space-y-4">
                        {pendingBooks.map(book => (
                            <div key={book._id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 gap-4">
                                <div className="flex gap-4">
                                    <div className="h-20 w-16 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                                        {book.images[0] && <img src={book.images[0]} className="w-full h-full object-cover" />}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">{book.bookName}</h3>
                                        <p className="text-sm text-gray-600">{book.subject} • ₹{book.price}</p>
                                        <p className="text-xs text-gray-500 mt-1">Seller: {book.sellerEmail}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleApprove(book._id)}
                                        className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-emerald-700 transition"
                                    >
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => handleReject(book._id)}
                                        className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg text-sm hover:bg-red-100 transition"
                                    >
                                        Reject
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
