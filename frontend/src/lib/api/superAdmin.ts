import { auth } from '../firebase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const getAuthHeaders = async () => {
    const user = auth.currentUser;
    if (!user) {
        throw new Error('User not authenticated');
    }
    const token = await user.getIdToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const getSuperAdminStats = async () => {
    const headers = await getAuthHeaders();
    // API_URL already includes /api, so we just append /super-admin/stats
    const response = await fetch(`${API_URL}/super-admin/stats`, { headers });
    if (!response.ok) throw new Error('Failed to fetch stats');
    return response.json();
};

export const getAllUsers = async () => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/super-admin/users`, { headers });
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
};

export const promoteUser = async (id: string) => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/super-admin/promote/${id}`, {
        method: 'PUT',
        headers
    });
    if (!response.ok) throw new Error('Failed to promote user');
    return response.json();
};

export const demoteUser = async (id: string) => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/super-admin/demote/${id}`, {
        method: 'PUT',
        headers
    });
    if (!response.ok) throw new Error('Failed to demote user');
    return response.json();
};

export const getAllListings = async () => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/super-admin/listings`, { headers });
    if (!response.ok) throw new Error('Failed to fetch listings');
    return response.json();
};

export const deleteListing = async (id: string) => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/super-admin/listing/${id}`, {
        method: 'DELETE',
        headers
    });
    if (!response.ok) throw new Error('Failed to delete listing');
    return response.json();
};

export const toggleUserStatus = async (id: string) => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/super-admin/toggle-status/${id}`, {
        method: 'PUT',
        headers
    });
    if (!response.ok) throw new Error('Failed to toggle user status');
    return response.json();
};

export const approveListing = async (id: string) => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/super-admin/approve-listing/${id}`, {
        method: 'PUT',
        headers
    });
    if (!response.ok) throw new Error('Failed to approve listing');
    return response.json();
};

export const rejectListing = async (id: string) => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/super-admin/reject-listing/${id}`, {
        method: 'PUT',
        headers
    });
    if (!response.ok) throw new Error('Failed to reject listing');
    return response.json();
};

export const getActivityLogs = async (page = 1, limit = 50) => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/super-admin/activity?page=${page}&limit=${limit}`, { headers });
    if (!response.ok) throw new Error('Failed to fetch activity logs');
    return response.json();
};

export const toggleApprovalMode = async () => {
    const headers = await getAuthHeaders();
    const response = await fetch(`${API_URL}/super-admin/config/approval-mode`, {
        method: 'PUT',
        headers,
    });
    if (!response.ok) throw new Error('Failed to toggle approval mode');
    return response.json();
};

