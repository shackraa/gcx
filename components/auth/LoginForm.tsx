'use client'

import { useAuthActions } from '@convex-dev/auth/react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'

export function LoginForm() {
  const authActions = useAuthActions()
  const [step, setStep] = useState<'signIn' | 'signUp'>('signIn')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  async function handleOAuth(provider: 'github' | 'google') {
    setLoading(true)
    try {
      if (authActions?.signIn) {
        await authActions.signIn(provider, { redirectTo: '/dashboard' })
      }
    } catch {
      toast({ title: 'Giriş başarısız', variant: 'destructive' })
      setLoading(false)
    }
  }

  async function handlePasswordAuth(e: React.FormEvent) {
    e.preventDefault()
    if (!email || !password) return
    setLoading(true)

    try {
      if (authActions?.signIn) {
        await authActions.signIn('password', {
          email,
          password,
          flow: step,
        })
        router.push('/dashboard')
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Giriş yapılamadı'
      toast({
        title: step === 'signIn' ? 'Giriş hatası' : 'Kayıt hatası',
        description: msg.includes('Invalid') ? 'E-posta veya şifre hatalı' : msg,
        variant: 'destructive',
      })
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded-xl bg-foreground text-background items-center justify-center font-extrabold text-sm tracking-wider shadow-md mb-0.5">
            GCX
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">GCX</h1>
          <p className="text-muted-foreground text-xs font-medium">
            Kariyer & Başvuru Yönetim Platformu
          </p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-6 space-y-5 shadow-xl">
          <div className="space-y-1 text-center">
            <h2 className="text-base font-bold text-foreground">
              {step === 'signIn' ? 'Hesabına Giriş Yap' : 'Yeni Hesap Oluştur'}
            </h2>
            <p className="text-xs text-muted-foreground">
              Tüm cihazlarında gerçek zamanlı senkronize.
            </p>
          </div>

          {/* OAuth Buttons */}
          <div className="space-y-2">
            <Button
              type="button"
              onClick={() => handleOAuth('github')}
              disabled={loading}
              className="w-full h-10 gap-2.5 text-xs font-semibold"
              variant="outline"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                </svg>
              )}
              GitHub ile Devam Et
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-card px-2 text-muted-foreground font-semibold">veya e-posta ile</span>
            </div>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handlePasswordAuth} className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">E-posta</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="sen@ornek.com"
                className="mt-1 w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Şifre</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="mt-1 w-full h-9 px-3 rounded-lg bg-muted border-0 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-9 text-xs font-bold"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : step === 'signIn' ? (
                'Giriş Yap'
              ) : (
                'Kayıt Ol'
              )}
            </Button>
          </form>

          {/* Toggle signIn / signUp */}
          <div className="text-center text-xs text-muted-foreground pt-1">
            {step === 'signIn' ? (
              <p>
                Hesabın yok mu?{' '}
                <button
                  type="button"
                  onClick={() => setStep('signUp')}
                  className="text-primary font-semibold hover:underline"
                >
                  Kayıt Ol
                </button>
              </p>
            ) : (
              <p>
                Zaten hesabın var mı?{' '}
                <button
                  type="button"
                  onClick={() => setStep('signIn')}
                  className="text-primary font-semibold hover:underline"
                >
                  Giriş Yap
                </button>
              </p>
            )}
          </div>
        </div>

        <p className="text-[11px] text-center text-muted-foreground">
          Sadece sana özel · Güvenli bulut altyapısı
        </p>
      </div>
    </div>
  )
}
