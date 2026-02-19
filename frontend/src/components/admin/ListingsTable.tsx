'use client';

import { useEffect, useState } from 'react';
import { getAllListings, deleteListing, approveListing, rejectListing } from '@/lib/api/superAdmin';
import { Book } from '@/lib/api';
import toast from 'react-hot-toast';

interface ListingsTableProps {
    initialFilter?: string;
}

export default function ListingsTable({ initialFilter = 'all' }: ListingsTableProps) {
    const [listings, setListings] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState(initialFilter);
    const [searchQuery, setSearchQuery] = useState('');

    // Update internal filter if prop changes
    useEffect(() => {
        setStatusFilter(initialFilter);
    }, [initialFilter]);

    const fetchListings = async () => {
        try {
            const data = await getAllListings();
            setListings(data.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchListings();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this listing?')) return;
        try {
            await deleteListing(id);
            setListings(listings.filter(l => l._id !== id));
            toast.success('Listing deleted');
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete listing');
        }
    };

    const handleApprove = async (id: string) => {
        try {
            await approveListing(id);
            toast.success('Listing approved');
            fetchListings();
        } catch (error: any) {
            toast.error(error.message || 'Failed to approve listing');
        }
    };

    const handleReject = async (id: string) => {
        if (!confirm('Are you sure you want to reject this listing?')) return;
        try {
            await rejectListing(id);
            toast.success('Listing rejected');
            fetchListings();
        } catch (error: any) {
            toast.error(error.message || 'Failed to reject listing');
        }
    };

    const filteredListings = listings.filter(listing => {
        const matchesStatus = statusFilter === 'all' || listing.status === statusFilter;
        const matchesSearch = listing.bookName.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div></div>;

    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Listings Management</h3>
            {/* Filters */}
            <div className="mb-6 flex gap-4">
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                </select>
                <input
                    type="text"
                    placeholder="Search by book name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
            </div>

            {filteredListings.length === 0 ? (
                <div className="bg-white p-8 rounded-lg shadow-sm text-center text-gray-500">
                    No listings found.
                </div>
            ) : (
                <div className="bg-white shadow-md rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Book</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seller</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredListings.map((listing) => (
                                <tr key={listing._id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 flex-shrink-0">
                                                <img className="h-10 w-10 rounded-md object-cover" src={listing.images[0] || '/placeholder.png'} alt="" />
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{listing.bookName}</div>
                                                <div className="text-sm text-gray-500">{listing.subject}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{listing.sellerEmail}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                            ₹{listing.price}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                            ${listing.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                listing.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-red-100 text-red-800'}`}>
                                            {listing.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(listing.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                        {listing.status === 'pending' && (
                                            <>
                                                <button onClick={() => handleApprove(listing._id)} className="text-green-600 hover:text-green-900">
                                                    Approve
                                                </button>
                                                <button onClick={() => handleReject(listing._id)} className="text-orange-600 hover:text-orange-900">
                                                    Reject
                                                </button>
                                            </>
                                        )}
                                        <button onClick={() => handleDelete(listing._id)} className="text-red-600 hover:text-red-900">
                                            Delete
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
