import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "./providers"

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
  weight: ['600', '700', '800', '900'],
})

export const metadata: Metadata = {
  title: "GRU - Web3 Crowdfunding Platform",
  description: "Decentralized milestone-based crowdfunding on Base blockchain. Fund innovative projects with transparency and security.",
  keywords: ["web3", "crowdfunding", "blockchain", "Base", "decentralized", "crypto"],
  authors: [{ name: "GRU Team" }],
  creator: "GRU",
  publisher: "GRU",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('http://localhost:3000'),
  openGraph: {
    title: "GRU - Web3 Crowdfunding Platform",
    description: "Decentralized milestone-based crowdfunding on Base blockchain",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "GRU - Web3 Crowdfunding Platform",
    description: "Decentralized milestone-based crowdfunding on Base blockchain",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-background text-foreground overflow-x-hidden`} suppressHydrationWarning>
        <div className="galactic-bg" />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
