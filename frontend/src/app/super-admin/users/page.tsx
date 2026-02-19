'use client';

import { useEffect, useState } from 'react';
import { getAllUsers, promoteUser, demoteUser, toggleUserStatus } from '@/lib/api/superAdmin';
import toast from 'react-hot-toast';

export default function UsersPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchUsers = async () => {
        try {
            const data = await getAllUsers();
            setUsers(data.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handlePromote = async (id: string) => {
        if (!confirm('Promote this user to Admin?')) return;
        try {
            await promoteUser(id);
            toast.success('User promoted to Admin');
            fetchUsers();
        } catch (error: any) {
            toast.error(error.message || 'Failed to promote user');
        }
    };

    const handleDemote = async (id: string) => {
        if (!confirm('Demote this Admin to User?')) return;
        try {
            await demoteUser(id);
            toast.success('Admin demoted to User');
            fetchUsers();
        } catch (error: any) {
            toast.error(error.message || 'Failed to demote user');
        }
    };

    const handleToggleStatus = async (id: string, currentStatus: boolean) => {
        const action = currentStatus ? 'disable' : 'enable';
        if (!confirm(`Are you sure you want to ${action} this user?`)) return;
        try {
            await toggleUserStatus(id);
            toast.success(`User ${action}d successfully`);
            fetchUsers();
        } catch (error: any) {
            toast.error(error.message || 'Failed to toggle user status');
        }
    };

    if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full"></div></div>;

    return (
        <div>
            <h2 className="text-3xl font-bold mb-8 text-gray-800">User Management</h2>

            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Listings</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {users.map((user) => (
                            <tr key={user._id} className={!user.isActive ? 'bg-gray-50 opacity-60' : ''}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="h-10 w-10 flex-shrink-0">
                                            {user.photoURL ? (
                                                <img className="h-10 w-10 rounded-full" src={user.photoURL} alt="" />
                                            ) : (
                                                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 font-bold">
                                                    {user.displayName?.charAt(0) || 'U'}
                                                </div>
                                            )}
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900 hover:text-indigo-600 hover:underline cursor-pointer">
                                                {/* Start Profile Link */}
                                                <a href={`/profile/${user._id}`} target="_blank" rel="noopener noreferrer">
                                                    {user.displayName || 'Unnamed User'}
                                                </a>
                                                {/* End Profile Link */}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                        ${user.role === 'super_admin' ? 'bg-purple-100 text-purple-800' :
                                            user.role === 'admin' ? 'bg-indigo-100 text-indigo-800' :
                                                'bg-green-100 text-green-800'}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                        ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {user.isActive ? 'Active' : 'Disabled'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.listingCount}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(user.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                    {user.role !== 'super_admin' && (
                                        <>
                                            {user.role === 'user' && (
                                                <button onClick={() => handlePromote(user._id)} className="text-indigo-600 hover:text-indigo-900">Promote</button>
                                            )}
                                            {user.role === 'admin' && (
                                                <button onClick={() => handleDemote(user._id)} className="text-orange-600 hover:text-orange-900">Demote</button>
                                            )}
                                            <button
                                                onClick={() => handleToggleStatus(user._id, user.isActive)}
                                                className={user.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}
                                            >
                                                {user.isActive ? 'Disable' : 'Enable'}
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
    );
}
