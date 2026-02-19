'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import {
    getSuperAdminStats,
    getAllUsers,
    promoteUser,
    demoteUser,
    toggleUserStatus,
    getAllListings,
    approveListing,
    rejectListing,
    deleteListing,
    getActivityLogs,
    AdminStats,
    UserUser,
    ActivityLog
} from '@/lib/superAdmin';
import toast from 'react-hot-toast';

export default function SuperAdminDashboard() {
    const { user, isSuperAdmin, loading: authLoading } = useAuth();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'listings' | 'activity'>('stats');
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [users, setUsers] = useState<UserUser[]>([]);
    const [listings, setListings] = useState<any[]>([]);
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Initial Load
    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                router.push('/');
            } else if (!isSuperAdmin) {
                router.push('/');
            } else {
                // Determine if user is super_admin (client-side check strictly for UX, backend enforces real security)
                // We'll fetch data and catch 403s to detect unauthorized access reliably
                loadData();
            }
        }
    }, [user, authLoading, router]);

    const loadData = async () => {
        if (!user) return;
        setLoading(true);
        try {
            const token = await user.getIdToken();
            const [statsData, usersData, listingsData, logsData] = await Promise.all([
                getSuperAdminStats(token),
                getAllUsers(token),
                getAllListings(token),
                getActivityLogs(token)
            ]);
            setStats(statsData);
            setUsers(usersData);
            setListings(listingsData);
            setLogs(logsData.data);
        } catch (error) {
            console.error('Failed to load super admin data:', error);
            // If 403/Unauthorized, redirect
            router.push('/');
        } finally {
            setLoading(false);
        }
    };

    // User Actions
    const handleUserAction = async (action: 'promote' | 'demote' | 'toggle', targetId: string) => {
        if (!user) return;
        if (!confirm(`Are you sure you want to ${action} this user?`)) return;

        setActionLoading(targetId);
        try {
            const token = await user.getIdToken();
            if (action === 'promote') await promoteUser(targetId, token);
            if (action === 'demote') await demoteUser(targetId, token);
            if (action === 'toggle') await toggleUserStatus(targetId, token);

            // Refresh users
            const updatedUsers = await getAllUsers(token);
            setUsers(updatedUsers);
            toast.success(`User ${action}d successfully`);
        } catch (error: any) {
            toast.error(error.message || 'Action failed');
        } finally {
            setActionLoading(null);
        }
    };

    // Listing Actions
    const handleListingAction = async (action: 'approve' | 'reject' | 'delete', targetId: string) => {
        if (!user) return;
        if (!confirm(`Are you sure you want to ${action} this listing?`)) return;

        setActionLoading(targetId);
        try {
            const token = await user.getIdToken();
            if (action === 'approve') await approveListing(targetId, token);
            if (action === 'reject') await rejectListing(targetId, token);
            if (action === 'delete') await deleteListing(targetId, token);

            // Refresh listings
            const updatedListings = await getAllListings(token);
            setListings(updatedListings);
            toast.success(`Listing ${action}d successfully`);
        } catch (error: any) {
            toast.error(error.message || 'Action failed');
        } finally {
            setActionLoading(null);
        }
    };

    if (authLoading || loading) return <div className="min-h-screen flex items-center justify-center">Loading Admin Panel...</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
                        <p className="text-gray-500">Secure Governance Platform</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={loadData}
                            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
                        >
                            Refresh Data
                        </button>
                        <button
                            onClick={() => router.push('/')}
                            className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-900"
                        >
                            Exit
                        </button>
                    </div>
                </header>

                {/* Tabs */}
                <div className="flex space-x-1 bg-white p-1 rounded-xl border border-gray-200 mb-8 w-fit">
                    {['stats', 'users', 'listings', 'activity'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${activeTab === tab
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden min-h-[500px]">

                    {/* STATS VIEW */}
                    {activeTab === 'stats' && stats && (
                        <div className="p-8">
                            <h2 className="text-xl font-semibold mb-6">System Overview</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <StatCard title="Total Users" value={stats.users.total} color="blue" />
                                <StatCard title="Active Users" value={stats.users.active} color="emerald" />
                                <StatCard title="Disabled Users" value={stats.users.disabled} color="red" />
                                <StatCard title="Total Listings" value={stats.listings.total} color="purple" />
                                <StatCard title="Pending" value={stats.listings.pending} color="yellow" />
                                <StatCard title="Approved" value={stats.listings.approved} color="emerald" />
                                <StatCard title="Rejected" value={stats.listings.rejected} color="red" />
                            </div>
                        </div>
                    )}

                    {/* USERS VIEW */}
                    {activeTab === 'users' && (
                        <div className="p-0">
                            <div className="px-6 py-4 border-b border-gray-100">
                                <h2 className="text-lg font-semibold">User Management</h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3">User</th>
                                            <th className="px-6 py-3">Role</th>
                                            <th className="px-6 py-3">Status</th>
                                            <th className="px-6 py-3">Listings</th>
                                            <th className="px-6 py-3">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map(u => (
                                            <tr key={u._id} className="bg-white border-b hover:bg-gray-50">
                                                <td className="px-6 py-4 font-medium text-gray-900">
                                                    <div>{u.displayName}</div>
                                                    <div className="text-xs text-gray-500">{u.email}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${u.role === 'super_admin' ? 'bg-purple-100 text-purple-800' :
                                                        u.role === 'admin' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-gray-100 text-gray-800'
                                                        }`}>
                                                        {u.role}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${u.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {u.isActive ? 'Active' : 'Disabled'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">{u.listingCount || 0}</td>
                                                <td className="px-6 py-4 space-x-2">
                                                    {u.role !== 'super_admin' && (
                                                        <>
                                                            {u.role === 'user' && (
                                                                <button onClick={() => handleUserAction('promote', u._id)} disabled={!!actionLoading} className="text-blue-600 hover:underline">Promote</button>
                                                            )}
                                                            {u.role === 'admin' && (
                                                                <button onClick={() => handleUserAction('demote', u._id)} disabled={!!actionLoading} className="text-orange-600 hover:underline">Demote</button>
                                                            )}
                                                            <button onClick={() => handleUserAction('toggle', u._id)} disabled={!!actionLoading} className={`${u.isActive ? 'text-red-600' : 'text-green-600'} hover:underline`}>
                                                                {u.isActive ? 'Disable' : 'Enable'}
                                                            </button>
                                                        </>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* LISTINGS VIEW */}
                    {activeTab === 'listings' && (
                        <div className="p-0">
                            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                                <h2 className="text-lg font-semibold">Global Listings</h2>
                                {/* Add Status Filter Here Later */}
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3">Book</th>
                                            <th className="px-6 py-3">Seller</th>
                                            <th className="px-6 py-3">Price</th>
                                            <th className="px-6 py-3">Status</th>
                                            <th className="px-6 py-3">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {listings.map(book => (
                                            <tr key={book._id} className="bg-white border-b hover:bg-gray-50">
                                                <td className="px-6 py-4 font-medium text-gray-900">
                                                    {book.bookName}
                                                    <div className="text-xs text-gray-500">{book.subject}</div>
                                                </td>
                                                <td className="px-6 py-4 text-gray-500">{book.sellerEmail}</td>
                                                <td className="px-6 py-4">₹{book.price}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${book.status === 'approved' ? 'bg-green-100 text-green-800' :
                                                        book.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-red-100 text-red-800'
                                                        }`}>
                                                        {book.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 space-x-2">
                                                    {book.status === 'pending' && (
                                                        <button onClick={() => handleListingAction('approve', book._id)} className="text-green-600 hover:underline">Approve</button>
                                                    )}
                                                    {book.status !== 'rejected' && (
                                                        <button onClick={() => handleListingAction('reject', book._id)} className="text-orange-600 hover:underline">Reject</button>
                                                    )}
                                                    <button onClick={() => handleListingAction('delete', book._id)} className="text-red-600 hover:underline">Delete</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* LOGS VIEW */}
                    {activeTab === 'activity' && (
                        <div className="p-0">
                            <div className="px-6 py-4 border-b border-gray-100">
                                <h2 className="text-lg font-semibold">Audit Logs</h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3">Time</th>
                                            <th className="px-6 py-3">Admin</th>
                                            <th className="px-6 py-3">Action</th>
                                            <th className="px-6 py-3">Target</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {logs.map(log => (
                                            <tr key={log._id} className="bg-white border-b hover:bg-gray-50">
                                                <td className="px-6 py-4 text-gray-500">
                                                    {new Date(log.timestamp).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 font-medium text-gray-900">
                                                    {log.actor?.email || <span className="text-gray-400 italic text-xs">system</span>}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2 py-1 bg-gray-100 rounded-md text-xs font-mono">
                                                        {log.action}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-gray-500">
                                                    {log.targetModel}: {log.target}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, color }: { title: string, value: number, color: string }) {
    const colorClasses: any = {
        blue: 'bg-blue-50 text-blue-700',
        emerald: 'bg-emerald-50 text-emerald-700',
        red: 'bg-red-50 text-red-700',
        purple: 'bg-purple-50 text-purple-700',
        yellow: 'bg-yellow-50 text-yellow-700',
    };

    return (
        <div className={`p-6 rounded-xl border border-gray-100 ${colorClasses[color] || 'bg-gray-50 text-gray-700'}`}>
            <p className="text-sm font-medium opacity-80">{title}</p>
            <p className="text-3xl font-bold mt-2">{value}</p>
        </div>
    );
}
