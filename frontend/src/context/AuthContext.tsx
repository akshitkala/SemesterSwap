
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import {
    onAuthStateChanged,
    User,
    GoogleAuthProvider,
    signInWithPopup,
    signOut
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
    isAdmin: boolean;
    isSuperAdmin: boolean;
    role: string | null;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// Admin email from env
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [role, setRole] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // ── Strategy: Stale-While-Revalidate ────────────────────────
                // 1. If we have a cached role, use it immediately for instant UI
                const cacheKey = `role_${firebaseUser.uid}`;
                const cachedRole = sessionStorage.getItem(cacheKey);

                if (cachedRole) {
                    setRole(cachedRole);
                    setUser(firebaseUser);
                    setLoading(false); // Unblock UI immediately with cached data
                }

                // 2. ALWAYS fetch the latest role from backend to ensure sync
                try {
                    const token = await firebaseUser.getIdToken();
                    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
                    const response = await fetch(`${API_URL}/auth/me`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    if (response.ok) {
                        const data = await response.json();
                        const freshRole = data.data.role;

                        // Only update state/cache if the role has actually changed
                        if (freshRole !== cachedRole) {
                            console.log(`[AuthContext] Role updated from ${cachedRole} to ${freshRole}`);
                            sessionStorage.setItem(cacheKey, freshRole);
                            setRole(freshRole);
                        }
                    } else {
                        // If backend fails but we have cache, keep cache. If no cache, fallback to 'user'.
                        if (response.status !== 401) {
                            console.error('[AuthContext] Failed to fetch user role', response.status);
                        }
                        if (!cachedRole) setRole('user');
                    }
                } catch (error) {
                    console.error('[AuthContext] Error fetching user role:', error);
                    if (!cachedRole) setRole('user');
                }

                setUser(firebaseUser);
                setLoading(false); // Ensure loading is false
            } else {
                setUser(null);
                setRole(null);
                setLoading(false);
                sessionStorage.clear(); // Clear all role keys
            }
        });
        return () => unsubscribe();
    }, []);


    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error("Error signing in with Google", error);
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            setRole(null);
            sessionStorage.clear();
        } catch (error) {
            console.error("Error signing out", error);
        }
    };

    const isAdmin = role === 'admin' || role === 'super_admin';
    const isSuperAdmin = role === 'super_admin';

    return (
        <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout, isAdmin, isSuperAdmin, role }}>
            {children}
        </AuthContext.Provider>
    );

}

export const useAuth = () => useContext(AuthContext);
