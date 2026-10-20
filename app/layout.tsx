import type { Metadata } from 'next'
import { Plus_Jakarta_Sans, JetBrains_Mono, Instrument_Serif } from 'next/font/google'
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

const fontMono = JetBrains_Mono({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-geist-mono',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

const fontSerif = Instrument_Serif({
  subsets: ['latin'],
  variable: '--font-editorial',
  display: 'swap',
  weight: ['400'],
  style: ['normal', 'italic'],
})

export const metadata: Metadata = {
  title: 'GCX — Kariyer & Başvuru Yönetimi',
  description: 'Kariyer ve iş başvurusu yönetim platformu.',
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
      <html
        lang="tr"
        suppressHydrationWarning
        data-ui="award"
        className={cn('font-sans', fontSans.variable, fontMono.variable, fontSerif.variable)}
      >
        <body className="font-sans antialiased bg-background text-foreground selection:bg-primary/20 tracking-tight">
          <Providers>{children}</Providers>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  )
}
