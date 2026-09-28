import type { Metadata } from 'next'
import { Manrope, Geist } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { cn } from '@/lib/utils'
import { ConvexAuthNextjsServerProvider } from '@convex-dev/auth/nextjs/server'

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' })

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'GCX — Başvuru Takip',
  description: 'Nereye başvurdum, hangi CV ile, kim döndü.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'GCX',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ConvexAuthNextjsServerProvider>
      <html lang="tr" suppressHydrationWarning className={cn('font-sans', geist.variable)}>
        <body className={`${manrope.variable} font-manrope antialiased`}>
          <Providers>{children}</Providers>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  )
}
