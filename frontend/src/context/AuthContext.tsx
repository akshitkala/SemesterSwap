
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
                // ── Fast path: serve role from cache instantly ──────────────
                const cacheKey = `role_${firebaseUser.uid}`;
                const cachedRole = sessionStorage.getItem(cacheKey);
                if (cachedRole) {
                    setRole(cachedRole);
                    setUser(firebaseUser);
                    setLoading(false); // unblock UI immediately
                }

                // ── Background refresh: always fetch fresh role ─────────────
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
                        sessionStorage.setItem(cacheKey, freshRole); // update cache
                        setRole(freshRole);
                    } else {
                        if (response.status !== 401) {
                            console.error('[AuthContext] Failed to fetch user role', response.status);
                        }
                        if (!cachedRole) setRole('user'); // only fallback if no cache
                    }
                } catch (error) {
                    console.error('[AuthContext] Error fetching user role:', error);
                    if (!cachedRole) setRole('user');
                }

                setUser(firebaseUser);
                if (!cachedRole) setLoading(false); // loading was already set above if cached
            } else {
                setUser(null);
                setRole(null);
                setLoading(false);
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
