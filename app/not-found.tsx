import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 text-center">
      <div className="space-y-4">
        <h1 className="text-4xl font-extrabold text-foreground">404</h1>
        <p className="text-muted-foreground text-sm">Sayfa bulunamadı.</p>
        <Link href="/dashboard">
          <Button size="sm">Dashboard&apos;a Dön</Button>
        </Link>
      </div>
    </div>
  )
}
