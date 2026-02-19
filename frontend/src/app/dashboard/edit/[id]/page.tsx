'use client';

import { useState, useEffect, use } from 'react';
import { fetchBookById, updateBook, Book } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function EditListing({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [book, setBook] = useState<Book | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        bookName: '',
        subject: '',
        price: '',
        condition: 'good',
        sellerPhone: ''
    });

    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [existingImages, setExistingImages] = useState<string[]>([]);

    useEffect(() => {
        const loadBook = async () => {
            if (!user) return;
            try {
                const token = await user.getIdToken();
                const data = await fetchBookById(id, token);
                setBook(data);
                setFormData({
                    bookName: data.bookName,
                    subject: data.subject,
                    price: data.price.toString(),
                    condition: data.condition,
                    sellerPhone: data.sellerPhone
                });
                setExistingImages(data.images || []);

                // Verify ownership (client-side UX check; backend enforces real security)
                // V2: seller is an ObjectId or populated object, not a uid string
                const ownerId = typeof data.seller === 'object' ? data.seller._id : data.seller;
                if (ownerId !== user.uid && !ownerId) {
                    router.push('/dashboard');
                }
            } catch (error) {
                console.error('Failed to load book', error);
                router.push('/dashboard');
            } finally {
                setLoading(false);
            }
        };

        if (!authLoading) {
            if (!user) {
                router.push('/dashboard');
            } else {
                loadBook();
            }
        }
    }, [user, authLoading, id, router]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const filesArray = Array.from(e.target.files);
            const totalImages = existingImages.length + filesArray.length;

            if (totalImages > 3) {
                toast.error(`Max 3 images. You have ${existingImages.length} existing + ${filesArray.length} new selected.`);
                return;
            }
            setImageFiles(filesArray);
        }
    };

    const handleRemoveExistingImage = (indexToRemove: number) => {
        setExistingImages(prev => prev.filter((_, index) => index !== indexToRemove));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!book || !user) return;

        setSaving(true);
        try {
            const token = await user.getIdToken();

            const data = new FormData();
            data.append('bookName', formData.bookName);
            data.append('subject', formData.subject);
            data.append('price', formData.price);
            data.append('condition', formData.condition);
            data.append('sellerPhone', formData.sellerPhone);

            // Append existing images to keep
            existingImages.forEach((imgUrl) => {
                data.append('existingImages', imgUrl);
            });

            // Append new images
            imageFiles.forEach((file) => {
                data.append('images', file);
            });

            await updateBook(book._id, data, token);

            toast.success('Listing updated! It is now pending approval.');
            router.push('/dashboard');
        } catch (error: any) {
            toast.error(error.message || 'Failed to update listing');
        } finally {
            setSaving(false);
        }
    };

    if (loading || authLoading) return <div className="text-center py-20">Loading...</div>;

    return (
        <div className="max-w-2xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6">Edit Listing</h1>

            <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl shadow-sm border border-gray-100">

                {/* Current Images Display */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Images ({existingImages.length + imageFiles.length}/3)</label>
                    <div className="flex gap-4 overflow-x-auto pb-2">
                        {existingImages.map((img, index) => (
                            <div key={`existing-${index}`} className="h-24 w-20 flex-shrink-0 rounded-lg overflow-hidden border border-gray-200 relative group">
                                <img src={img} alt={`Current ${index + 1}`} className="w-full h-full object-cover" />
                                <button
                                    type="button"
                                    onClick={() => handleRemoveExistingImage(index)}
                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-90 hover:bg-red-600 transition-colors"
                                    title="Remove Image"
                                >
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* New Images Input */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Add More Images</label>
                    <p className="text-xs text-gray-500 mb-2">Max 3 total images (Existing + New).</p>
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageChange}
                        disabled={existingImages.length >= 3}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 disabled:opacity-50"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Book Name</label>
                    <input
                        type="text"
                        required
                        value={formData.bookName}
                        onChange={e => setFormData({ ...formData, bookName: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject / Branch</label>
                    <input
                        type="text"
                        required
                        value={formData.subject}
                        onChange={e => setFormData({ ...formData, subject: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                        <input
                            type="number"
                            required
                            min="0"
                            value={formData.price}
                            onChange={e => setFormData({ ...formData, price: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
                        <select
                            value={formData.condition}
                            onChange={e => setFormData({ ...formData, condition: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        >
                            <option value="new">New</option>
                            <option value="good">Good</option>
                            <option value="used">Used</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Seller Phone</label>
                    <input
                        type="tel"
                        required
                        pattern="[0-9]{10,15}"
                        value={formData.sellerPhone}
                        onChange={e => setFormData({ ...formData, sellerPhone: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">10-15 digits only.</p>
                </div>

                <div className="flex gap-4 pt-4">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : 'Update Listing'}
                    </button>
                </div>
            </form>
        </div>
    );
}
