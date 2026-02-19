'use client';

import { useEffect, useState } from 'react';
import { getSuperAdminStats, toggleApprovalMode } from '@/lib/api/superAdmin';
import toast from 'react-hot-toast';
import { AdminStats } from '@/lib/superAdmin';

export default function SuperAdminOverview() {
    const [stats, setStats] = useState<AdminStats['listings'] & AdminStats['users'] | any>(null);
    const [approvalMode, setApprovalMode] = useState<'manual' | 'automatic'>('manual');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await getSuperAdminStats();
                // Map the API response to a flat structure for easier display if needed, 
                // or just use the nested structure. The previous implementation used a flat structure.
                // improved mapping based on what I saw in dashboard/page.tsx
                setStats({
                    totalUsers: data.data.users.total,
                    activeUsers: data.data.users.active,
                    disabledUsers: data.data.users.disabled,
                    totalListings: data.data.listings.total,
                    pendingListings: data.data.listings.pending,
                    approvedListings: data.data.listings.approved,
                    rejectedListings: data.data.listings.rejected
                });
                setApprovalMode(data.data.currentApprovalMode);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const handleToggleApproval = async () => {
        try {
            const response = await toggleApprovalMode();
            setApprovalMode(response.data.approvalMode);
            toast.success(`Approval mode switched to ${response.data.approvalMode}`);
        } catch (error) {
            toast.error('Failed to update approval mode');
            console.error(error);
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full opacity-75"></div>
        </div>
    );

    return (
        <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900">Dashboard Overview</h2>
                    <p className="text-gray-500 mt-1">Real-time platform metrics.</p>
                </div>
                <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                    <span className="text-sm font-medium text-gray-700">Approval Mode:</span>
                    <button
                        onClick={handleToggleApproval}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${approvalMode === 'automatic' ? 'bg-indigo-600' : 'bg-gray-200'
                            }`}
                    >
                        <span
                            className={`${approvalMode === 'automatic' ? 'translate-x-6' : 'translate-x-1'
                                } inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200`}
                        />
                    </button>
                    <span className={`text-sm font-medium w-20 ${approvalMode === 'automatic' ? 'text-indigo-600' : 'text-gray-500'}`}>
                        {approvalMode === 'automatic' ? 'Automatic' : 'Manual'}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Users"
                    value={stats?.totalUsers || 0}
                    icon={<span className="text-2xl">👥</span>}
                    color="bg-blue-50 text-blue-700 border-blue-100"
                />
                <StatCard
                    title="Active Users"
                    value={stats?.activeUsers || 0}
                    icon={<span className="text-2xl">🟢</span>}
                    color="bg-emerald-50 text-emerald-700 border-emerald-100"
                />
                <StatCard
                    title="Total Listings"
                    value={stats?.totalListings || 0}
                    icon={<span className="text-2xl">📚</span>}
                    color="bg-purple-50 text-purple-700 border-purple-100"
                />
                <StatCard
                    title="Pending"
                    value={stats?.pendingListings || 0}
                    icon={<span className="text-2xl">⏳</span>}
                    color="bg-yellow-50 text-yellow-700 border-yellow-100"
                />
                <StatCard
                    title="Approved"
                    value={stats?.approvedListings || 0}
                    icon={<span className="text-2xl">✅</span>}
                    color="bg-green-50 text-green-700 border-green-100"
                />
                <StatCard
                    title="Rejected"
                    value={stats?.rejectedListings || 0}
                    icon={<span className="text-2xl">❌</span>}
                    color="bg-red-50 text-red-700 border-red-100"
                />
                <StatCard
                    title="Disabled Users"
                    value={stats?.disabledUsers || 0}
                    icon={<span className="text-2xl">🚫</span>}
                    color="bg-red-50 text-red-700 border-red-100"
                />
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, color }: { title: string; value: number; icon: React.ReactNode; color: string }) {
    return (
        <div className={`rounded-2xl p-6 border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${color}`}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-semibold opacity-80 uppercase tracking-wide">{title}</p>
                    <h3 className="text-3xl font-bold mt-2">{value}</h3>
                </div>
                <div className="p-3 bg-white/50 rounded-xl backdrop-blur-sm shadow-sm">
                    {icon}
                </div>
            </div>
        </div>
    );
}
