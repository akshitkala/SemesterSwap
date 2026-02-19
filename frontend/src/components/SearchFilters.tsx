'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

export default function SearchFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Local state for immediate feedback
    const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
    const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
    const [sort, setSort] = useState(searchParams.get('sort') || 'newest');
    const [condition, setCondition] = useState(searchParams.get('condition') || '');
    const [subject, setSubject] = useState(searchParams.get('subject') || '');

    // Sync local state with URL params
    useEffect(() => {
        setMinPrice(searchParams.get('minPrice') || '');
        setMaxPrice(searchParams.get('maxPrice') || '');
        setSort(searchParams.get('sort') || 'newest');
        setCondition(searchParams.get('condition') || '');
        setSubject(searchParams.get('subject') || '');
    }, [searchParams]);

    const createQueryString = useCallback(
        (name: string, value: string) => {
            const params = new URLSearchParams(searchParams.toString());
            if (value) {
                params.set(name, value);
            } else {
                params.delete(name);
            }
            // Reset page on filter change
            params.delete('page');
            return params.toString();
        },
        [searchParams]
    );

    const updateFilter = (name: string, value: string) => {
        router.push(`/search?${createQueryString(name, value)}`);
    };

    const handlePriceApply = () => {
        const params = new URLSearchParams(searchParams.toString());
        if (minPrice) params.set('minPrice', minPrice);
        else params.delete('minPrice');

        if (maxPrice) params.set('maxPrice', maxPrice);
        else params.delete('maxPrice');

        params.delete('page');
        router.push(`/search?${params.toString()}`);
    };

    const clearFilters = () => {
        const params = new URLSearchParams(searchParams.toString());
        // keep q (search query) but clear filters
        const q = params.get('q');
        const newParams = new URLSearchParams();
        if (q) newParams.set('q', q);
        router.push(`/search?${newParams.toString()}`);
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-100/50 space-y-8">
            <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Filters</h2>
                <button
                    onClick={clearFilters}
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                >
                    Clear All
                </button>
            </div>

            {/* Sort */}
            <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">Sort By</label>
                <select
                    value={sort}
                    onChange={(e) => updateFilter('sort', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                    <option value="newest">Newest First</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                </select>
            </div>

            {/* Price Range */}
            <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">Price Range (₹)</label>
                <div className="flex gap-2">
                    <input
                        type="number"
                        placeholder="Min"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        min="0"
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                    <input
                        type="number"
                        placeholder="Max"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        min="0"
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                </div>
                <button
                    onClick={handlePriceApply}
                    className="w-full py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-md hover:bg-emerald-100 transition-colors"
                >
                    Apply Price
                </button>
            </div>

            {/* Condition */}
            <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">Condition</label>
                <div className="space-y-2">
                    {['new', 'good', 'used'].map((c) => (
                        <label key={c} className="flex items-center gap-2 cursor-pointer group">
                            <input
                                type="radio"
                                name="condition"
                                checked={condition === c}
                                onChange={() => updateFilter('condition', c)}
                                className="w-4 h-4 text-emerald-600 border-gray-300 focus:ring-emerald-500"
                            />
                            <span className="text-sm text-gray-600 group-hover:text-gray-900 capitalize">
                                {c}
                            </span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Subject */}
            <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">Subject</label>
                <select
                    value={subject}
                    onChange={(e) => updateFilter('subject', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                    <option value="">All Subjects</option>
                    <option value="Math">Math</option>
                    <option value="Physics">Physics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Biology">Biology</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="History">History</option>
                    <option value="Literature">Literature</option>
                    <option value="Psychology">Psychology</option>
                    <option value="Economics">Economics</option>
                    <option value="Engineering">Engineering</option>
                </select>
            </div>
        </div>
    );
}
