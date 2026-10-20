'use client'

import { useAuthActions } from '@convex-dev/auth/react'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Loader2,
  Sparkles,
  CheckCircle2,
  Target,
  Command,
  RotateCcw,
  Wand2,
  ArrowUpRight,
  Layers,
  ShieldCheck,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { useUIStore } from '@/lib/store/ui'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'

const SHOWCASE_STAGES = [
  { id: 'waiting', label: 'Bekliyor', company: 'Stripe', role: 'Staff Frontend Engineer', score: 96, days: '2g' },
  { id: 'interview', label: 'Mülakat', company: 'Linear', role: 'Design Engineer', score: 98, days: 'Bugün' },
  { id: 'offer', label: 'Teklif 🎉', company: 'Vercel', role: 'DX & Product Engineer', score: 94, days: '1g' },
] as const

export function LoginForm() {
  const authActions = useAuthActions()
  const { uiMode, toggleUIMode } = useUIStore()
  const isAward = uiMode === 'award'
  const [step, setStep] = useState<'signIn' | 'signUp'>('signIn')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [activePreviewIdx, setActivePreviewIdx] = useState(1)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    document.documentElement.dataset.ui = uiMode
  }, [uiMode])

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

  // ============================================================================
  // CLASSIC UI LOGIN (Exact Original Layout + 1-click Switcher to Award UI)
  // ============================================================================
  if (!isAward) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
        <button
          type="button"
          onClick={toggleUIMode}
          className="fixed top-4 right-4 z-50 h-8 px-3 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-all"
        >
          <Wand2 className="h-3.5 w-3.5" />
          <span>✨ Ödüllü UI Görünümüne Geç</span>
        </button>

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

  // ============================================================================
  // AWARD UI MODE: High-Craft Spatial Showcase + Interactive Telemetry Bento
  // ============================================================================
  const activeStage = SHOWCASE_STAGES[activePreviewIdx]

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between p-3 sm:p-5 lg:p-6 relative overflow-hidden">
      {/* Top Floating Bar */}
      <header className="relative z-20 flex items-center justify-between max-w-[1440px] w-full mx-auto px-2 py-1">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary via-indigo-500 to-violet-600 text-white flex items-center justify-center font-mono font-extrabold text-xs tracking-wider shadow-md ring-1 ring-white/25">
            GCX
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-extrabold tracking-tight text-foreground">GCX</span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-widest bg-primary/15 text-primary border border-primary/25">
              OS 2.6 · HIGH-CRAFT
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleUIMode}
          title="Tek tıkla önceki Klasik Giriş ekranına dön"
          className="h-8 px-3 rounded-xl bg-card/80 hover:bg-card border border-border/80 text-xs font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-all cursor-pointer craft-surface"
        >
          <RotateCcw className="h-3.5 w-3.5 text-primary" />
          <span>Klasik UI&apos;a Dön</span>
        </button>
      </header>

      {/* Main Split Grid */}
      <div className="relative z-10 my-auto max-w-[1440px] w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center py-6">
        {/* LEFT COLUMN (7 cols): Editorial Value Prop + Interactive Live Product Bento */}
        <div className="lg:col-span-7 space-y-6 px-2">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[11px] font-mono font-semibold text-primary">
              <Sparkles className="h-3 w-3" />
              <span>CAREER COMMAND & ATS INTELLIGENCE</span>
            </div>

            <h1 className="text-3xl sm:text-4xl xl:text-5xl font-extrabold tracking-tight text-foreground leading-[1.08]">
              Kariyer süreçlerini{' '}
              <span className="font-serif italic font-normal text-primary">
                cerrahi bir hassasiyetle
              </span>{' '}
              yönet.
            </h1>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-xl">
              Dağınık Excel tablolarını bırakın. Başvuru huninizi, CV versiyonlarınızın dönüşüm
              oranlarını, 14+ gün sessiz kalan İK süreçlerini ve ilana özel Harvard CV üretimini tek bir{' '}
              <strong className="text-foreground font-semibold">Spatial komuta merkezinde</strong>{' '}
              toplayın.
            </p>
          </div>

          {/* Interactive Live Product Preview Bento */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 max-w-2xl">
            {/* Bento Card 1: Interactive Pipeline Inspector Preview (7 cols) */}
            <div className="sm:col-span-7 bg-card/90 border border-border/85 rounded-2xl p-4 space-y-3.5 craft-surface">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                  <Layers className="h-3 w-3 text-primary" />
                  CANLI PIPELINE ÖNİZLEMESİ
                </span>
                <span className="text-[10px] font-mono text-primary font-semibold">
                  Tıkla & Test Et
                </span>
              </div>

              {/* Interactive Rows */}
              <div className="space-y-1.5">
                {SHOWCASE_STAGES.map((item, idx) => {
                  const selected = activePreviewIdx === idx
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActivePreviewIdx(idx)}
                      className={cn(
                        'relative w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-left transition-colors cursor-pointer border',
                        selected
                          ? 'text-foreground border-primary/35'
                          : 'text-muted-foreground hover:text-foreground border-transparent hover:bg-muted/40'
                      )}
                    >
                      {selected && (
                        <motion.div
                          layoutId="login-showcase-active-row"
                          transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                          className="absolute inset-0 rounded-xl bg-primary/[0.09] -z-0"
                        />
                      )}
                      <div className="relative z-10 flex items-center gap-2.5 min-w-0">
                        <div
                          className={cn(
                            'w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-[10px] shrink-0',
                            selected
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground'
                          )}
                        >
                          {item.company.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-foreground truncate">
                            {item.company}
                          </div>
                          <div className="text-[10px] text-muted-foreground truncate">
                            {item.role}
                          </div>
                        </div>
                      </div>

                      <div className="relative z-10 flex items-center gap-2 shrink-0">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/12 text-emerald-600 dark:text-emerald-400">
                          %{item.score}
                        </span>
                        <span className="text-[10px] font-mono font-semibold text-foreground bg-muted px-2 py-0.5 rounded-md">
                          {item.label}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>

              <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>
                  Seçili: <strong className="text-foreground">{activeStage.company}</strong> —{' '}
                  {activeStage.role}
                </span>
                <span className="font-mono text-[10px] text-primary">
                  ATS Uyum: %{activeStage.score}
                </span>
              </div>
            </div>

            {/* Bento Card 2: Telemetry & Keyboard First Speed (5 cols) */}
            <div className="sm:col-span-5 flex flex-col justify-between gap-3.5">
              <div className="bg-card/90 border border-border/85 rounded-2xl p-4 space-y-2.5 craft-surface flex-1 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground">
                    AI ATS MOTORU
                  </span>
                  <Target className="h-3.5 w-3.5 text-emerald-500" />
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-mono font-extrabold text-foreground tabular-nums">
                    %{activeStage.score}
                  </span>
                  <span className="text-xs font-serif italic text-emerald-600 dark:text-emerald-400">
                    eşleşme skoru
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Kariyer hafızanızdaki belgelerden ilana en uygun metrikleri seçip Harvard CV üretir.
                </p>
              </div>

              <div className="bg-card/90 border border-border/85 rounded-2xl p-3.5 craft-surface flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-primary/12 border border-primary/25 text-primary flex items-center justify-center shrink-0">
                    <Command className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-foreground">Klavye Odaklı Hız</div>
                    <div className="text-[10px] text-muted-foreground">
                      Komut Paleti & Kısayollar
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 font-mono text-[10px]">
                  <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-foreground font-bold">
                    ⌘K
                  </kbd>
                  <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-foreground font-bold">
                    1-6
                  </kbd>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (5 cols): High-Craft Authentication Vault */}
        <div className="lg:col-span-5 flex justify-center lg:justify-end">
          <div className="w-full max-w-md bg-card/95 border border-border/90 rounded-[24px] p-6 sm:p-8 space-y-6 craft-surface">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-primary">
                  {step === 'signIn' ? 'WELCOME BACK' : 'CREATE WORKSPACE'}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="h-3 w-3" />
                  Bulut Senkronize
                </span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                {step === 'signIn' ? 'Komuta Merkezine Giriş Yap' : 'Yeni Çalışma Alanı Oluştur'}
              </h2>
              <p className="text-xs text-muted-foreground">
                Tüm başvuruların, CV versiyonların ve AI analizlerin anında senkronize olur.
              </p>
            </div>

            {/* OAuth Button */}
            <div className="space-y-2">
              <Button
                type="button"
                onClick={() => handleOAuth('github')}
                disabled={loading}
                className="w-full h-10 gap-2.5 text-xs font-semibold rounded-xl craft-surface cursor-pointer"
                variant="outline"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                )}
                <span>GitHub ile Hızlı Devam Et</span>
                <ArrowUpRight className="h-3.5 w-3.5 opacity-60 ml-auto" />
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/70" />
              </div>
              <div className="relative flex justify-center text-[10px] font-mono uppercase tracking-wider">
                <span className="bg-card px-2.5 text-muted-foreground font-semibold">
                  veya e-posta ile
                </span>
              </div>
            </div>

            {/* Email / Password Form */}
            <form onSubmit={handlePasswordAuth} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                  E-posta Adresi
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="aday@ornek.com"
                  className="mt-1 w-full h-10 px-3.5 rounded-xl bg-muted/60 border border-border/80 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                />
              </div>
              <div>
                <label className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                  Şifre
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="mt-1 w-full h-10 px-3.5 rounded-xl bg-muted/60 border border-border/80 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-10 rounded-xl text-xs font-bold shadow-md cursor-pointer"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : step === 'signIn' ? (
                  'Çalışma Alanını Aç →'
                ) : (
                  'Hesabı Oluştur & Başla →'
                )}
              </Button>
            </form>

            {/* Toggle signIn / signUp */}
            <div className="text-center text-xs text-muted-foreground pt-1 border-t border-border/50">
              {step === 'signIn' ? (
                <p>
                  Henüz hesabın yok mu?{' '}
                  <button
                    type="button"
                    onClick={() => setStep('signUp')}
                    className="text-primary font-semibold hover:underline cursor-pointer"
                  >
                    Yeni Hesap Oluştur
                  </button>
                </p>
              ) : (
                <p>
                  Zaten hesabın var mı?{' '}
                  <button
                    type="button"
                    onClick={() => setStep('signIn')}
                    className="text-primary font-semibold hover:underline cursor-pointer"
                  >
                    Giriş Yap
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Telemetry Footer */}
      <footer className="relative z-10 max-w-[1440px] w-full mx-auto px-2 py-2 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-muted-foreground border-t border-border/40">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
          <span>OKLCH Perceptual Color Space · Instrument Serif & JetBrains Mono Triad</span>
        </div>
        <div className="font-mono text-[10px]">
          İstediğin an sağ üstten Klasik UI moduna dönebilirsin.
        </div>
      </footer>
    </div>
  )
}
