'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getActivityLogs } from '@/lib/superAdmin';

export default function ActivityPage() {
    const { user } = useAuth();
    const [activities, setActivities] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchActivities = async (currentPage: number) => {
        if (!user) return;
        try {
            setLoading(true);
            const token = await user.getIdToken();
            const data = await getActivityLogs(token, { page: String(currentPage), limit: '50' });
            setActivities(data.data);
            setTotalPages(data.pagination.pages);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActivities(page);
    }, [page]);

    const getActionLabel = (action: string) => {
        const labels: Record<string, string> = {
            'USER_PROMOTED': 'Promoted User',
            'USER_DEMOTED': 'Demoted User',
            'USER_BANNED': 'Banned User',
            'USER_UNBANNED': 'Unbanned User',
            'LISTING_APPROVED': 'Approved Listing',
            'LISTING_REJECTED': 'Rejected Listing',
            'LISTING_DELETED': 'Deleted Listing',
            'AUTO_APPROVE_LISTING': 'Auto-Approved Listing',
            'APPROVAL_MODE_CHANGED': 'Approval Mode Changed',
        };
        return labels[action] || action;
    };

    const getActionColor = (action: string) => {
        if (action.includes('APPROVED') || action.includes('UNBANNED')) return 'bg-green-100 text-green-800';
        if (action.includes('REJECTED') || action.includes('DELETED') || action.includes('BANNED')) return 'bg-red-100 text-red-800';
        if (action.includes('PROMOTED')) return 'bg-indigo-100 text-indigo-800';
        if (action.includes('DEMOTED')) return 'bg-orange-100 text-orange-800';
        return 'bg-gray-100 text-gray-800';
    };

    if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div></div>;

    return (
        <div>
            <h2 className="text-3xl font-bold mb-8 text-gray-800">Activity Logs</h2>

            {activities.length === 0 ? (
                <div className="bg-white p-8 rounded-lg shadow-sm text-center text-gray-500">
                    No activity logs found.
                </div>
            ) : (
                <>
                    <div className="bg-white shadow-md rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performed By</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {activities.map((activity) => (
                                    <tr key={activity._id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getActionColor(activity.action)}`}>
                                                {getActionLabel(activity.action)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                {activity.actor?.displayName && (
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">{activity.actor.displayName}</div>
                                                        <div className="text-sm text-gray-500">{activity.actor.email}</div>
                                                    </div>
                                                )}
                                                {!activity.actor && (
                                                    <span className="text-xs text-gray-400 italic">System</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{activity.targetModel}: {activity.target}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(activity.timestamp).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="mt-6 flex justify-center gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                                className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                                Previous
                            </button>
                            <span className="px-4 py-2 bg-white border border-gray-300 rounded-lg">
                                Page {page} of {totalPages}
                            </span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                                className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
