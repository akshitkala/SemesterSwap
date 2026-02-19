'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
    const { user, loading, isSuperAdmin } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/login');
            } else if (!isSuperAdmin) {
                router.push('/');
            }
        }
    }, [user, loading, isSuperAdmin, router]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
    );

    if (!isSuperAdmin) return null; // Prevent flash of content

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-indigo-900 text-white min-h-screen flex-shrink-0">
                <div className="p-6">
                    <h1 className="text-2xl font-bold">Admin Panel</h1>
                    <p className="text-indigo-300 text-sm mt-1">Super Admin Access</p>
                </div>
                <nav className="mt-6 px-4 space-y-2">
                    <Link href="/super-admin" className="block px-4 py-2 rounded hover:bg-indigo-800 transition">
                        📊 Overview
                    </Link>
                    <Link href="/super-admin/users" className="block px-4 py-2 rounded hover:bg-indigo-800 transition">
                        👥 Users
                    </Link>
                    <Link href="/super-admin/listings" className="block px-4 py-2 rounded hover:bg-indigo-800 transition">
                        📚 Listings
                    </Link>
                    <Link href="/super-admin/activity" className="block px-4 py-2 rounded hover:bg-indigo-800 transition">
                        📋 Activity Logs
                    </Link>
                    <Link href="/" className="block px-4 py-2 mt-8 rounded bg-indigo-800 hover:bg-indigo-700 transition text-center">
                        ← Back to Site
                    </Link>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}
