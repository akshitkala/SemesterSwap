import Link from 'next/link';

export default function Navbar() {
    return (
        <nav className="bg-white/90 backdrop-blur-md border-b border-emerald-100 sticky top-0 z-50 transition-all duration-300">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                <Link href="/" className="font-bold text-xl tracking-tight text-emerald-600 hover:text-emerald-700 transition-colors">
                    SemesterSwap
                </Link>

                <Link
                    href="/sell"
                    className="bg-emerald-600 text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-emerald-700 transition-all duration-200 shadow-sm hover:shadow-md"
                >
                    Sell Book
                </Link>
            </div>
        </nav>
    );
}
