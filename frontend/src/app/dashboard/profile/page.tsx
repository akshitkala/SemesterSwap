'use client';

import { useAuth } from '@/context/AuthContext';

export default function ProfilePage() {
    const { user } = useAuth();

    if (!user) return null;

    return (
        <div className="max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold mb-8">My Profile</h1>

            <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
                <div className="flex items-center gap-6 mb-8">
                    <div className="h-24 w-24 bg-emerald-100 rounded-full flex items-center justify-center text-3xl">
                        {user.photoURL ? (
                            <img src={user.photoURL} alt={user.displayName || 'User'} className="h-full w-full rounded-full object-cover" />
                        ) : (
                            <span>👤</span>
                        )}
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold">{user.displayName || 'Semester Swap User'}</h2>
                        <p className="text-gray-500">{user.email}</p>
                        <span className="inline-block mt-2 px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                            Member
                        </span>
                    </div>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                        <input
                            type="text"
                            disabled
                            value={user.displayName || ''}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed"
                        />
                        <p className="text-xs text-gray-400 mt-1">Managed by Google Sign-In</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                        <input
                            type="email"
                            disabled
                            value={user.email || ''}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed"
                        />
                        <p className="text-xs text-gray-400 mt-1">Managed by Google Sign-In</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
