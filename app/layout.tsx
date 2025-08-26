import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'GetRankedLocal - Dominate Google & AI Search in 90 Days',
  description: 'Get your business ranked #1 on Google Maps and AI platforms. See exactly who\'s stealing your customers and how to beat them.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body
        className={inter.className}
        style={{ backgroundColor: '#000000', color: '#ffffff' }}
      >
        {children}
      </body>
    </html>
  )
}