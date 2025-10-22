import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Web3 Milestone Crowdfunding',
  description: 'Revolutionary milestone-based crowdfunding platform with user-defined risk profiles and democratic governance',
  keywords: ['crowdfunding', 'web3', 'blockchain', 'milestones', 'defi', 'base'],
  authors: [{ name: 'Hackathon Team' }],
  openGraph: {
    title: 'Web3 Milestone Crowdfunding',
    description: 'Revolutionary milestone-based crowdfunding platform with user-defined risk profiles and democratic governance',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Web3 Milestone Crowdfunding',
    description: 'Revolutionary milestone-based crowdfunding platform with user-defined risk profiles and democratic governance',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#22c55e',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}


