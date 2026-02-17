import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import { AuthProvider } from '@/context/AuthContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Semester Swap - LPU Book Marketplace',
  description: 'Buy and sell used semester books at LPU without fees. Direct student-to-student exchange.',
  metadataBase: new URL('https://semester-swap.vercel.app'), // Placeholder URL
  openGraph: {
    title: 'Semester Swap - LPU Book Marketplace',
    description: 'Buy and sell used semester books at LPU without fees.',
    siteName: 'Semester Swap',
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Semester Swap',
    description: 'The easiest way to buy/sell books at LPU.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 min-h-screen text-gray-900`}>
        <AuthProvider>
          <Navbar />
          <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
