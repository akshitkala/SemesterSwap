import Image from 'next/image';
import Link from 'next/link';
import { Book } from '@/lib/api';

export default function BookCard({ book, priority = false }: { book: Book; priority?: boolean }) {
    return (
        <Link
            href={`/book/${book.slug}`}
            className="group block bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
        >
            <div className="aspect-[3/4] relative bg-emerald-50 overflow-hidden">
                {book.images[0] ? (
                    <Image
                        src={book.images[0].replace('/upload/', '/upload/f_auto,q_auto,w_500/')}
                        alt={book.bookName}
                        fill
                        priority={priority}
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 50vw, 33vw"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-emerald-300">
                        <span className="text-4xl opacity-50">📚</span>
                    </div>
                )}
                <div className="absolute top-2 right-2 bg-black/60 text-white text-xs font-medium px-2.5 py-1 rounded-full backdrop-blur-sm">
                    {book.condition}
                </div>
            </div>

            <div className="p-4">
                <h3 className="font-semibold text-gray-900 truncate group-hover:text-emerald-600 transition-colors mb-1">
                    {book.bookName}
                </h3>
                <p className="text-sm text-gray-500 truncate mb-3">{book.subject}</p>
                <div className="flex items-center justify-between">
                    <p className="font-bold text-gray-900 text-lg">₹{book.price}</p>
                    <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full font-medium">View</span>
                </div>
            </div>
        </Link>
    );
}
