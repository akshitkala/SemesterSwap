'use client';

import { useEffect, useState } from 'react';
import { getSuperAdminStats } from '@/lib/api/superAdmin';

export default function SuperAdminOverview() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await getSuperAdminStats();
                setStats(data.data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div></div>;

    return (
        <div>
            <h2 className="text-3xl font-bold mb-8 text-gray-800">Dashboard Overview</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard title="Total Users" value={stats?.totalUsers || 0} icon="👥" color="bg-blue-500" />
                <StatCard title="Total Admins" value={stats?.totalAdmins || 0} icon="🛡️" color="bg-purple-500" />
                <StatCard title="Total Listings" value={stats?.totalListings || 0} icon="📚" color="bg-green-500" />
                <StatCard title="Pending Approvals" value={stats?.pendingListings || 0} icon="⏳" color="bg-yellow-500" />
                <StatCard title="Approved Listings" value={stats?.approvedListings || 0} icon="✅" color="bg-emerald-500" />
                <StatCard title="Rejected Listings" value={stats?.rejectedListings || 0} icon="❌" color="bg-red-500" />
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, color }: { title: string; value: number; icon: string; color: string }) {
    return (
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4" style={{ borderColor: color.replace('bg-', '') }}>
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-gray-500 text-sm font-medium">{title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
                </div>
                <div className={`${color} text-white text-4xl w-16 h-16 rounded-full flex items-center justify-center`}>
                    {icon}
                </div>
            </div>
        </div>
    );
}
