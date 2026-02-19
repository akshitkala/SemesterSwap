
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface Book {
    _id: string;
    bookName: string;
    subject: string;
    price: number;
    condition: 'new' | 'good' | 'used';  // V2: lowercase
    images: string[];
    sellerPhone: string;
    seller: { _id: string; displayName: string; email: string } | string; // V2: ObjectId ref (populated or raw)
    sellerEmail: string;
    slug: string;
    createdAt: string;
    status?: 'pending' | 'approved' | 'rejected';
}

export async function fetchBooks(): Promise<Book[]> {
    const res = await fetch(`${API_URL}/books`, {
        next: { revalidate: 60 }, // ISR: re-fetch at most once per minute
    });

    if (!res.ok) {
        throw new Error(`Failed to fetch books: ${res.status} ${res.statusText}`);
    }

    const json = await res.json();
    return json.data;
}

export async function fetchBookBySlug(slug: string): Promise<Book> {
    const res = await fetch(`${API_URL}/books/${slug}`, {
        next: { revalidate: 60 }, // ISR: book detail pages are cacheable
    });

    if (!res.ok) {
        if (res.status === 404) throw new Error('Book not found');
        throw new Error('Failed to fetch book details');
    }

    const json = await res.json();
    return json.data;
}

export interface SearchFilters {
    q?: string;
    condition?: 'new' | 'good' | 'used';
    minPrice?: number;
    maxPrice?: number;
    subject?: string;
    sort?: 'newest' | 'price_asc' | 'price_desc';
    page?: number;
    limit?: number;
}

export interface SearchResult {
    data: Book[];
    count: number;
    pagination: {
        total: number;
        page: number;
        pages: number;
        limit: number;
    };
}

export async function searchBooks(filters: SearchFilters): Promise<SearchResult> {
    const params = new URLSearchParams();
    if (filters.q) params.set('q', filters.q);
    if (filters.condition) params.set('condition', filters.condition);
    if (filters.subject) params.set('subject', filters.subject);
    if (filters.sort) params.set('sort', filters.sort);
    if (filters.minPrice !== undefined) params.set('minPrice', String(filters.minPrice));
    if (filters.maxPrice !== undefined) params.set('maxPrice', String(filters.maxPrice));
    if (filters.page !== undefined) params.set('page', String(filters.page));
    if (filters.limit !== undefined) params.set('limit', String(filters.limit));

    const res = await fetch(`${API_URL}/books/search?${params.toString()}`, {
        cache: 'no-store',
    });

    if (!res.ok) {
        throw new Error('Failed to search books');
    }

    return res.json();
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

export async function updateBook(id: string, formData: FormData, token: string): Promise<Book> {
    const res = await fetch(`${API_URL}/books/${id}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            // Content-Type is automatically set by browser for FormData
        },
        body: formData,
    });

    const json = await res.json();

    if (!res.ok) {
        throw new Error(json.message || 'Failed to update book');
    }

    return json.data;
}

export async function fetchBookById(id: string, token: string): Promise<Book> {
    const res = await fetch(`${API_URL}/books/id/${id}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
        cache: 'no-store',
    });

    if (!res.ok) {
        throw new Error('Failed to fetch book details');
    }

    const json = await res.json();
    return json.data;
}
