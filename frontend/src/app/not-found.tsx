import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">404</h2>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Page Not Found</h3>
            <p className="text-gray-500 mb-8 max-w-md">
                The book or page you are looking for might have been sold, removed, or never existed.
            </p>
            <Link
                href="/"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
                Go Home
            </Link>
        </div>
    );
}
