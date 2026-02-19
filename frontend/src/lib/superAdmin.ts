import { API_URL } from './api';

export interface AdminStats {
    users: {
        total: number;
        active: number;
        disabled: number;
        adminCount: number;
    };
    listings: {
        total: number;
        pending: number;
        approved: number;
        rejected: number;
    };
    currentApprovalMode: 'manual' | 'automatic';
}

export interface UserUser {
    _id: string;
    // uid is intentionally excluded — never returned by V2 API
    displayName: string;
    email: string;
    photoURL?: string;
    role: 'user' | 'admin' | 'super_admin';
    isActive: boolean;
    createdAt: string;
    listingCount?: number;
}

// V2 ActivityLog — matches AdminActivity schema (actor/actorType/target/targetModel/action)
export interface ActivityLog {
    _id: string;
    action: string;
    actor: { _id: string; displayName: string; email: string } | null; // null for system actions
    actorType: 'user' | 'system';
    target: string;
    targetModel: 'User' | 'Book';
    metadata?: Record<string, unknown>;
    timestamp: string;
}

// Stats
export async function getSuperAdminStats(token: string): Promise<AdminStats> {
    const res = await fetch(`${API_URL}/super-admin/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to fetch stats');
    return json.data;
}

// Users
export async function getAllUsers(token: string): Promise<UserUser[]> {
    const res = await fetch(`${API_URL}/super-admin/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to fetch users');
    return json.data;
}

export async function promoteUser(id: string, token: string): Promise<UserUser> {
    const res = await fetch(`${API_URL}/super-admin/promote/${id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to promote user');
    return json.data;
}

export async function demoteUser(id: string, token: string): Promise<UserUser> {
    const res = await fetch(`${API_URL}/super-admin/demote/${id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to demote user');
    return json.data;
}

export async function toggleUserStatus(id: string, token: string): Promise<UserUser> {
    const res = await fetch(`${API_URL}/super-admin/toggle-status/${id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to toggle user status');
    return json.data;
}

// Listings
export async function getAllListings(token: string, status: string = 'all', search: string = ''): Promise<any[]> {
    const query = new URLSearchParams();
    if (status !== 'all') query.append('status', status);
    if (search) query.append('search', search);

    const res = await fetch(`${API_URL}/super-admin/listings?${query.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to fetch listings');
    return json.data;
}

export async function approveListing(id: string, token: string): Promise<any> {
    const res = await fetch(`${API_URL}/super-admin/approve-listing/${id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to approve listing');
    return json.data;
}

export async function rejectListing(id: string, token: string): Promise<any> {
    const res = await fetch(`${API_URL}/super-admin/reject-listing/${id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to reject listing');
    return json.data;
}

export async function deleteListing(id: string, token: string): Promise<void> {
    const res = await fetch(`${API_URL}/super-admin/listing/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to delete listing');
}

// Activity Logs
export async function getActivityLogs(token: string, params?: Record<string, string>): Promise<{ data: ActivityLog[], pagination: { total: number; page: number; pages: number } }> {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    const res = await fetch(`${API_URL}/super-admin/activity${query}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to fetch activity logs');
    return json;
}

// Toggle approval mode (manual <-> automatic)
export async function toggleApprovalMode(token: string): Promise<{ approvalMode: string }> {
    const res = await fetch(`${API_URL}/super-admin/config/approval-mode`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to toggle approval mode');
    return json.data;
}
