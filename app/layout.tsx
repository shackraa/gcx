import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { cn } from '@/lib/utils'
import { ConvexAuthNextjsServerProvider } from '@convex-dev/auth/nextjs/server'

const fontSans = Plus_Jakarta_Sans({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
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
      <html lang="tr" suppressHydrationWarning className={cn('font-sans', fontSans.variable)}>
        <body className="font-sans antialiased bg-background text-foreground selection:bg-primary/20 tracking-tight">
          <Providers>{children}</Providers>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  )
}
