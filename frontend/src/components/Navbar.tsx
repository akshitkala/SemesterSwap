
'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function Navbar() {
    const { user, signInWithGoogle, logout, isAdmin, isSuperAdmin, loading } = useAuth();
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

                {/* Mobile Menu Button */}
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="md:hidden p-2 text-gray-600 hover:text-emerald-600 transition-colors"
                    aria-label="Toggle menu"
                >
                    {isMobileMenuOpen ? (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                        </svg>
                    )}
                </button>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center gap-4">
                    {/* Admin Link - Only visible to admin (super_admin sees Super Admin link instead) */}
                    {!loading && isAdmin && !isSuperAdmin && (
                        <Link
                            href="/admin"
                            className="bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-red-100 border border-red-100 transition-all"
                        >
                            Admin
                        </Link>
                    )}

                    {/* Super Admin Link */}
                    {!loading && isSuperAdmin && (
                        <Link
                            href="/super-admin"
                            className="bg-purple-50 text-purple-600 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-purple-100 border border-purple-100 transition-all"
                        >
                            Super Admin
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

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="md:hidden absolute top-16 left-0 right-0 bg-white border-b border-gray-100 shadow-lg py-4 px-4 flex flex-col gap-4 animate-in slide-in-from-top-2 duration-200">
                    {!loading && isAdmin && !isSuperAdmin && (
                        <Link
                            href="/admin"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-medium text-center hover:bg-red-100 border border-red-100 transition-all"
                        >
                            Admin Dashboard
                        </Link>
                    )}

                    {!loading && isSuperAdmin && (
                        <Link
                            href="/super-admin"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="bg-purple-50 text-purple-600 px-4 py-2 rounded-lg text-sm font-medium text-center hover:bg-purple-100 border border-purple-100 transition-all"
                        >
                            Super Admin Dashboard
                        </Link>
                    )}

                    {!loading && (
                        user ? (
                            <>
                                <Link
                                    href="/dashboard"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-gray-50 ${pathname === '/dashboard' ? 'text-emerald-600 bg-emerald-50' : 'text-gray-600'}`}
                                >
                                    My Listings
                                </Link>
                                <Link
                                    href="/sell"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="bg-emerald-600 text-white px-4 py-2.5 rounded-lg text-center text-sm font-medium hover:bg-emerald-700 transition-all shadow-sm"
                                >
                                    Sell Book
                                </Link>
                                <button
                                    onClick={() => {
                                        logout();
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg text-left transition-colors"
                                >
                                    Sign Out
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => {
                                    handleLogin();
                                    setIsMobileMenuOpen(false);
                                }}
                                className="bg-gray-900 text-white px-4 py-2.5 rounded-lg text-center text-sm font-medium hover:bg-gray-800 transition-all shadow-sm"
                            >
                                Sign In with Google
                            </button>
                        )
                    )}
                </div>
            )}
        </nav>
    );
}
