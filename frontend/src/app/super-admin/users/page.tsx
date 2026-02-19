'use client';

import UsersTable from '@/components/admin/UsersTable';

export default function UsersPage() {
    return (
        <div>
            <h2 className="text-3xl font-bold mb-8 text-gray-800">User Management</h2>
            <UsersTable />
        </div>
    );
}
