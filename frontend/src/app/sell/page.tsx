'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/api';

export default function SellPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        bookName: '',
        subject: '',
        price: '',
        condition: 'Used',
        sellerPhone: '',
    });

    const [images, setImages] = useState<File[]>([]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const selectedFiles = Array.from(e.target.files);
            if (selectedFiles.length > 3) {
                setError('Maximum 3 images allowed');
                return;
            }
            setImages(selectedFiles);
            setError('');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const data = new FormData();
            data.append('bookName', formData.bookName);
            data.append('subject', formData.subject);
            data.append('price', formData.price);
            data.append('condition', formData.condition);
            data.append('sellerPhone', formData.sellerPhone);

            images.forEach((file) => {
                data.append('images', file);
            });

            const res = await fetch(`${API_URL}/books`, {
                method: 'POST',
                body: data,
            });

            const json = await res.json();

            if (!res.ok) {
                throw new Error(json.message || 'Failed to list book');
            }

            router.push('/'); // Redirecting to home after successful listing
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto font-[family-name:var(--font-geist-sans)]">
            <div className="text-center mb-10">
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-2">Sell Your Books</h1>
                <p className="text-gray-500">List your old semester books in seconds.</p>
            </div>

            <div className="bg-white p-8 md:p-12 rounded-3xl shadow-lg border border-gray-100 transition-all duration-300 hover:shadow-xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Book Name */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Book Title</label>
                        <input
                            type="text"
                            required
                            value={formData.bookName}
                            onChange={(e) => setFormData({ ...formData, bookName: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all placeholder-gray-400"
                            placeholder="e.g. Engineering Mathematics Vol 1"
                        />
                    </div>

                    {/* Subject */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Subject / Course Code</label>
                        <input
                            type="text"
                            required
                            value={formData.subject}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all placeholder-gray-400"
                            placeholder="e.g. CSE101"
                        />
                    </div>

                    {/* Price & Condition Grid */}
                    <div className="grid grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Price (₹)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-3.5 text-gray-500">₹</span>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    className="w-full pl-8 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                                    placeholder="0"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Condition</label>
                            <div className="relative">
                                <select
                                    value={formData.condition}
                                    onChange={(e) => setFormData({ ...formData, condition: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all appearance-none cursor-pointer"
                                >
                                    <option value="New">Like New</option>
                                    <option value="Good">Good</option>
                                    <option value="Used">Heavily Used</option>
                                </select>
                                <div className="absolute right-4 top-3.5 pointer-events-none">
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Phone Number */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">WhatsApp Number</label>
                        <input
                            type="tel"
                            required
                            pattern="[0-9]{10,15}"
                            value={formData.sellerPhone}
                            onChange={(e) => setFormData({ ...formData, sellerPhone: e.target.value })}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-900 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all placeholder-gray-400"
                            placeholder="9876543210"
                        />
                        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            Buyers will contact you via this number.
                        </p>
                    </div>

                    {/* Image Upload */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Upload Photos</label>
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <svg className="w-8 h-8 mb-3 text-gray-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2" />
                                </svg>
                                <p className="text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                <p className="text-xs text-gray-500 mt-1">SVG, PNG, JPG (MAX. 3 files)</p>
                            </div>
                            <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                multiple
                                onChange={handleImageChange}
                            />
                        </label>
                        {images.length > 0 && (
                            <div className="mt-3 flex gap-2">
                                {images.map((file, index) => (
                                    <div key={index} className="text-xs bg-gray-100 px-2 py-1 rounded-md text-gray-600 truncate max-w-[100px]">
                                        {file.name}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 border border-red-100 flex items-center gap-2">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-emerald-600 text-white py-4 rounded-full font-bold text-lg hover:bg-emerald-700 focus:ring-4 focus:ring-emerald-200 disabled:opacity-50 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0"
                    >
                        {loading ? 'Publishing...' : 'List It Now →'}
                    </button>

                    <p className="text-xs text-gray-400 text-center px-4 leading-relaxed">
                        By listing, you verify that you own the book and agree to our <a href="#" className="underline hover:text-gray-600">Terms of Service</a>. Listings are reviewed by admins.
                    </p>
                </form>
            </div>
        </div>
    );
}
