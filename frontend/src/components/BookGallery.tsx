'use client';

import { useState } from 'react';
import Image from 'next/image';

export default function BookGallery({ images, title }: { images: string[]; title: string }) {
    const [mainImage, setMainImage] = useState(images[0]);

    if (!images || images.length === 0) {
        return (
            <div className="aspect-[3/4] bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400">
                No Image Available
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Main Image */}
            <div className="aspect-[3/4] relative bg-gray-100 rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
                <Image
                    src={mainImage.replace('/upload/', '/upload/f_auto,q_auto,w_800/')}
                    alt={title}
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 768px) 100vw, 50vw"
                />
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                    {images.map((img, idx) => (
                        <button
                            key={idx}
                            onClick={() => setMainImage(img)}
                            className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${mainImage === img ? 'border-emerald-600 ring-2 ring-emerald-100' : 'border-transparent hover:border-gray-300'
                                }`}
                        >
                            <Image
                                src={img.replace('/upload/', '/upload/f_auto,q_auto,w_200/')}
                                alt={`${title} thumbnail ${idx + 1}`}
                                fill
                                className="object-cover"
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
