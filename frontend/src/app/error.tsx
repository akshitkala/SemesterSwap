'use client';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong!</h2>
            <p className="text-gray-500 mb-6">{error.message}</p>
            <button
                onClick={() => reset()}
                className="bg-gray-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-black transition-colors"
            >
                Try again
            </button>
        </div>
    );
}
