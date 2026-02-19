import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from 'react-hot-toast';

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
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-gray-50 min-h-screen text-gray-900`}>
        <AuthProvider>
          <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
          <Navbar />
          <div className="flex-grow">
            {children}
          </div>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
