export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface Book {
    _id: string;
    bookName: string;
    subject: string;
    price: number;
    condition: 'New' | 'Good' | 'Used';
    images: string[];
    sellerPhone: string; // Hidden in initial fetch, revealed later if needed
    slug: string;
    createdAt: string;
    status?: 'pending' | 'approved' | 'rejected' | 'sold';
}

export async function fetchBooks(): Promise<Book[]> {
    const res = await fetch(`${API_URL}/books`, {
        cache: 'no-store', // Disable caching for instant updates
    });

    if (!res.ok) {
        throw new Error(`Failed to fetch books: ${res.status} ${res.statusText}`);
    }

    const json = await res.json();
    return json.data;
}

export async function fetchBookBySlug(slug: string): Promise<Book> {
    const res = await fetch(`${API_URL}/books/${slug}`, {
        cache: 'no-store',
    });

    if (!res.ok) {
        if (res.status === 404) throw new Error('Book not found');
        throw new Error('Failed to fetch book details');
    }

    const json = await res.json();
    return json.data;
}

export async function searchBooks(query: string): Promise<Book[]> {
    const res = await fetch(`${API_URL}/books/search?q=${encodeURIComponent(query)}`, {
        cache: 'no-store',
    });

    if (!res.ok) {
        if (res.status === 404) return []; // Return empty array if no books found
        throw new Error('Failed to search books');
    }

    const json = await res.json();
    return json.data;
}

export async function fetchSellerBooks(phone: string): Promise<Book[]> {
    const res = await fetch(`${API_URL}/books/user?phone=${encodeURIComponent(phone)}`, {
        cache: 'no-store',
    });

    if (!res.ok) {
        if (res.status === 404) return [];
        throw new Error('Failed to fetch your books');
    }

    const json = await res.json();
    return json.data;
}

export async function deleteBook(id: string, phone: string): Promise<boolean> {
    const res = await fetch(`${API_URL}/books/id/${id}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone }),
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to delete book');
    }

    return true;
}
