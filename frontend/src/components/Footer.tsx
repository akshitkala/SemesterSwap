
import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="bg-white border-t border-gray-100 py-12">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                    <div className="col-span-1 md:col-span-2">
                        <Link href="/" className="font-bold text-xl tracking-tight text-emerald-600 hover:text-emerald-700 transition-colors">
                            SemesterSwap
                        </Link>
                        <p className="mt-4 text-gray-500 text-sm leading-relaxed max-w-xs">
                            The smartest way to buy and sell used semester books at LPU.
                            Direct student-to-student exchange with zero fees.
                        </p>
                    </div>

                    <div>
                        <h4 className="font-semibold text-gray-900 mb-4">Platform</h4>
                        <ul className="space-y-2 text-sm text-gray-500">
                            <li><Link href="/" className="hover:text-emerald-600 transition-colors">Browse Books</Link></li>
                            <li><Link href="/sell" className="hover:text-emerald-600 transition-colors">Sell a Book</Link></li>
                            <li><Link href="/search" className="hover:text-emerald-600 transition-colors">Search</Link></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-semibold text-gray-900 mb-4">Support</h4>
                        <ul className="space-y-2 text-sm text-gray-500">
                            <li><Link href="/how-it-works" className="hover:text-emerald-600 transition-colors">How it Works</Link></li>
                            <li><Link href="/terms" className="hover:text-emerald-600 transition-colors">Terms of Service</Link></li>
                            <li><Link href="/privacy" className="hover:text-emerald-600 transition-colors">Privacy Policy</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-gray-400">
                        © {new Date().getFullYear()} Semester Swap. Made with ❤️ at LPU.
                    </p>
                    <div className="flex items-center gap-6">
                        {/* Social placeholders could go here */}
                        <span className="text-sm text-gray-400 hover:text-gray-600 cursor-pointer">Twitter</span>
                        <span className="text-sm text-gray-400 hover:text-gray-600 cursor-pointer">Instagram</span>
                        <span className="text-sm text-gray-400 hover:text-gray-600 cursor-pointer">GitHub</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
