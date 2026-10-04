import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { cn } from '@/lib/utils'
import { ConvexAuthNextjsServerProvider } from '@convex-dev/auth/nextjs/server'

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-sans',
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
      <html lang="tr" suppressHydrationWarning className={cn('font-sans', inter.variable)}>
        <body className="font-sans antialiased bg-background text-foreground selection:bg-primary/20">
          <Providers>{children}</Providers>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  )
}
