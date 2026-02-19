'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { getUserProfile } from '@/lib/api/users';
import BookCard from '@/components/BookCard';
import Image from 'next/image';
import Link from 'next/link';

export default function ProfilePage() {
    const { id } = useParams();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!id) return;
        const fetchProfile = async () => {
            try {
                // Determine if 'id' is a string or array (though user page usually is strictly [id])
                const userId = Array.isArray(id) ? id[0] : id;
                const data = await getUserProfile(userId);
                setProfile(data.data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [id]);

    if (loading) return (
        <div className="flex h-screen items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
        </div>
    );

    if (error) return (
        <div className="flex h-screen flex-col items-center justify-center text-center">
            <div className="text-red-500 mb-4 text-xl">⚠️ {error}</div>
            <Link href="/" className="text-emerald-600 hover:underline">Go Home</Link>
        </div>
    );

    if (!profile) return null;

    return (
        <div className="min-h-screen bg-gray-50 pb-20 pt-24"> {/* Added padding top for fixed navbar */}
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Profile Header */}
                <div className="bg-white rounded-2xl shadow-sm p-8 mb-10 flex flex-col md:flex-row items-center md:items-start gap-8 border border-gray-100">
                    <div className="relative h-32 w-32 flex-shrink-0">
                        {profile.photoURL ? (
                            <Image
                                src={profile.photoURL}
                                alt={profile.displayName}
                                fill
                                className="rounded-full object-cover border-4 border-white shadow-lg"
                            />
                        ) : (
                            <div className="h-32 w-32 rounded-full bg-emerald-100 flex items-center justify-center text-4xl font-bold text-emerald-600 border-4 border-white shadow-lg">
                                {profile.displayName?.charAt(0) || 'U'}
                            </div>
                        )}
                        <div className={`absolute bottom-1 right-1 h-6 w-6 rounded-full border-4 border-white ${profile.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    </div>

                    <div className="flex-1 text-center md:text-left">
                        <div className="flex flex-col md:flex-row md:items-center gap-3 justify-center md:justify-start mb-2">
                            <h1 className="text-3xl font-bold text-gray-900">{profile.displayName}</h1>
                            {profile.role !== 'user' && (
                                <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wide rounded-full 
                                    ${profile.role === 'super_admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                    {profile.role.replace('_', ' ')}
                                </span>
                            )}
                        </div>
                        <p className="text-gray-500 mb-4">
                            Member since {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </p>

                        {/* Stats (Simple placeholder) */}
                        <div className="flex items-center justify-center md:justify-start gap-8 border-t border-gray-100 pt-4 mt-2">
                            <div>
                                <span className="block text-2xl font-bold text-gray-900">{profile.listings?.length || 0}</span>
                                <span className="text-sm text-gray-500 font-medium">Active Listings</span>
                            </div>
                            {/* Can add 'Sold Books' or 'Rating' here later */}
                        </div>
                    </div>
                </div>

                {/* Listings Grid */}
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <span>📚</span> Listings by {profile.displayName}
                    </h2>

                    {profile.listings && profile.listings.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {profile.listings.map((book: any) => (
                                <BookCard key={book._id} book={{ ...book, images: book.photos || [] }} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                            <p className="text-gray-500 text-lg">No active listings found.</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
