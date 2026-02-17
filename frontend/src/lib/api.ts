
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface Book {
    _id: string;
    bookName: string;
    subject: string;
    price: number;
    condition: 'New' | 'Good' | 'Used';
    images: string[];
    sellerPhone: string;
    sellerId: string;
    sellerEmail: string; // Added field
    slug: string;
    createdAt: string;
    status?: 'pending' | 'approved' | 'rejected' | 'sold';
}

export async function fetchBooks(): Promise<Book[]> {
    const res = await fetch(`${API_URL}/books`, {
        cache: 'no-store',
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
        if (res.status === 404) return [];
        throw new Error('Failed to search books');
    }

    const json = await res.json();
    return json.data;
}

export async function fetchSellerBooks(token: string): Promise<Book[]> {
    const res = await fetch(`${API_URL}/books/user`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
        cache: 'no-store',
    });

    if (!res.ok) {
        if (res.status === 404) return [];
        throw new Error('Failed to fetch your books');
    }

    const json = await res.json();
    return json.data;
}

export async function deleteBook(id: string, token: string): Promise<boolean> {
    const res = await fetch(`${API_URL}/books/id/${id}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to delete book');
    }

    return true;
}

export async function createBook(formData: FormData, token: string): Promise<Book> {
    const res = await fetch(`${API_URL}/books`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
        body: formData,
    });

    const json = await res.json();

    if (!res.ok) {
        throw new Error(json.message || 'Failed to list book');
    }

    return json.data;
}
