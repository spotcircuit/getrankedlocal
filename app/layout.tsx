import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'GetRankedLocal - Dominate Google & AI Search in 90 Days',
  description: 'Get your business ranked #1 on Google Maps and AI platforms. See exactly who\'s stealing your customers and how to beat them.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} overflow-x-hidden`}
        style={{ backgroundColor: '#000000', color: '#ffffff', overflowX: 'hidden' }}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'GetRankedLocal',
              url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
              logo: (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000') + '/logo.png',
              sameAs: [
                'https://www.linkedin.com/company/getrankedlocal',
              ],
              contactPoint: [{
                '@type': 'ContactPoint',
                contactType: 'customer support',
                email: 'support@getrankedlocal.com',
                availableLanguage: ['English'],
              }],
            }),
          }}
        />
        {children}
      </body>
    </html>
  )
}