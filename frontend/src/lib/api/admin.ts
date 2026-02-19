import { auth } from '@/lib/firebase';
import { Book } from '@/lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdminStats {
    totalUsers: number;
    totalListings: number;
    pendingListings: number;
    approvedListings: number;
    rejectedListings: number;
}

export interface AdminUser {
    _id: string;
    email: string;
    displayName?: string;
    photoURL?: string;
    role: 'user' | 'admin' | 'super_admin';
    isActive: boolean;
    createdAt: string;
    // uid (firebaseUid) is intentionally NOT included — excluded at the API level
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getAuthHeaders = async () => {
    const user = auth.currentUser;
    if (!user) {
        throw new Error('User not authenticated');
    }
    const token = await user.getIdToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    };
};

// ─── Moderation (Phase 3) ─────────────────────────────────────────────────────

export const getPendingBooks = async (): Promise<Book[]> => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/admin/pending`, { headers });
    if (!response.ok) throw new Error('Failed to fetch pending books');
    const json = await response.json();
    return json.data;
};

export const approveBook = async (id: string): Promise<Book> => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/admin/approve/${id}`, {
        method: 'PUT',
        headers,
    });
    if (!response.ok) throw new Error('Failed to approve book');
    const json = await response.json();
    return json.data;
};

export const rejectBook = async (id: string): Promise<void> => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/admin/reject/${id}`, {
        method: 'DELETE',
        headers,
    });
    if (!response.ok) throw new Error('Failed to reject book');
};

// ─── Stats (Phase 4) ──────────────────────────────────────────────────────────

export const getAdminStats = async (): Promise<AdminStats> => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/admin/stats`, { headers });
    if (!response.ok) throw new Error('Failed to fetch admin stats');
    const json = await response.json();
    return json.data;
};

// ─── User Viewer — read-only (Phase 4) ────────────────────────────────────────

export const getAdminUsers = async (): Promise<AdminUser[]> => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/admin/users`, { headers });
    if (!response.ok) throw new Error('Failed to fetch users');
    const json = await response.json();
    return json.data;
};

export const getAdminUserById = async (id: string): Promise<AdminUser> => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/admin/users/${id}`, { headers });
    if (!response.ok) throw new Error('Failed to fetch user');
    const json = await response.json();
    return json.data;
};
