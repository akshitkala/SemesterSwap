
'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';

export default function Navbar() {
    const { user, signInWithGoogle, logout, isAdmin, loading } = useAuth();
    const pathname = usePathname();

    const handleLogin = async () => {
        try {
            await signInWithGoogle();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <nav className="bg-white/90 backdrop-blur-md border-b border-emerald-100 sticky top-0 z-50 transition-all duration-300">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                <Link href="/" className="font-bold text-xl tracking-tight text-emerald-600 hover:text-emerald-700 transition-colors">
                    SemesterSwap
                </Link>

                <div className="flex items-center gap-4">
                    {/* Admin Link - Only visible to admin */}
                    {!loading && isAdmin && (
                        <Link
                            href="/admin"
                            className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-100 border border-red-100 transition-all"
                        >
                            Admin
                        </Link>
                    )}

                    {/* Auth Based Links */}
                    {!loading && (
                        user ? (
                            <div className="flex items-center gap-4">
                                <Link
                                    href="/dashboard"
                                    className={`text-sm font-medium transition-colors hover:text-emerald-600 ${pathname === '/dashboard' ? 'text-emerald-600' : 'text-gray-600'}`}
                                >
                                    My Listings
                                </Link>
                                <button
                                    onClick={logout}
                                    className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                                >
                                    Sign Out
                                </button>
                                <Link
                                    href="/sell"
                                    className="bg-emerald-600 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-emerald-700 transition-all duration-200 shadow-sm hover:shadow-md"
                                >
                                    Sell Book
                                </Link>
                            </div>
                        ) : (
                            <button
                                onClick={handleLogin}
                                className="bg-gray-900 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-gray-800 transition-all duration-200 shadow-sm hover:shadow-md"
                            >
                                Sign In with Google
                            </button>
                        )
                    )}
                </div>
            </div>
        </nav>
    );
}
