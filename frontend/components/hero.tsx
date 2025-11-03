'use client'

// import { ConnectButton } from '@rainbow-me/rainbowkit' // Temporarily disabled
// import { useAccount } from 'wagmi' // Temporarily disabled
import { useMockRole } from '@/contexts/MockRoleContext'
import Link from 'next/link'

export function Hero() {
  const { role } = useMockRole()
  const isConnected = !!role // Using mock role instead of wagmi

  return (
    <section id="hero" className="relative overflow-hidden py-20 sm:py-32 lg:py-40" suppressHydrationWarning>
      <div className="absolute inset-0 -z-10" suppressHydrationWarning>
        <div className="absolute top-20 right-10 w-96 h-96 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full blur-3xl opacity-15" suppressHydrationWarning />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-purple-600 to-indigo-700 rounded-full blur-3xl opacity-20" suppressHydrationWarning />
        <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full blur-3xl opacity-15" suppressHydrationWarning />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" suppressHydrationWarning>
        <div className="grid lg:grid-cols-2 gap-12 items-center" suppressHydrationWarning>
          <div className="space-y-8" suppressHydrationWarning>
            <div className="space-y-4" suppressHydrationWarning>
              <div className="inline-block px-4 py-2 bg-primary/20 rounded-full border border-primary/40 backdrop-blur-sm" suppressHydrationWarning>
                <span className="text-sm font-medium text-primary">👁 Gru's Evil Genius Fund</span>
              </div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-balance leading-tight">
                {role === "investor" ? "Fund the Future" : "Steal the Future"}
              </h1>
              <p className="text-xl text-muted-foreground text-balance leading-relaxed">
                {role === "investor" 
                  ? "Discover and invest in the most audacious hackathon projects. Support innovation with milestone-based funding."
                  : "Join Gru's villainous venture to fund the most audacious hackathon projects. Decentralized crowdfunding for the mischievously brilliant."
                }
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4" suppressHydrationWarning>
              {!isConnected ? (
                <div className="bg-primary/10 border border-primary/30 text-foreground px-8 py-4 rounded-lg text-lg font-semibold" suppressHydrationWarning>
                  👆 Login as Investor or Founder to start
                </div>
              ) : role === "founder" ? (
                <Link
                  href="/create"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-lg text-lg font-semibold transition-colors shadow-lg text-center"
                >
                  Start Your Heist
                </Link>
              ) : null}
              <a
                href="#campaigns"
                className="border border-border text-foreground px-8 py-4 rounded-lg text-lg font-semibold hover:bg-muted transition-colors text-center"
              >
                {role === "investor" ? "Browse Projects" : "Explore Evil Plans"}
              </a>
            </div>

            <div className="flex items-center gap-8 pt-4" suppressHydrationWarning>
              <div suppressHydrationWarning>
                <div className="text-2xl font-bold text-primary" suppressHydrationWarning>$2.5M+</div>
                <div className="text-sm text-muted-foreground" suppressHydrationWarning>Stolen... Funded</div>
              </div>
              <div suppressHydrationWarning>
                <div className="text-2xl font-bold text-primary" suppressHydrationWarning>1,200+</div>
                <div className="text-sm text-muted-foreground" suppressHydrationWarning>Evil Projects</div>
              </div>
              <div suppressHydrationWarning>
                <div className="text-2xl font-bold text-primary" suppressHydrationWarning>50K+</div>
                <div className="text-sm text-muted-foreground" suppressHydrationWarning>Minions</div>
              </div>
            </div>
          </div>

          <div className="relative h-96 lg:h-full" suppressHydrationWarning>
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 via-purple-600/20 to-indigo-700/20 rounded-2xl border border-primary/30 backdrop-blur-md" suppressHydrationWarning />
            <div className="absolute inset-4 bg-gradient-to-br from-yellow-400/10 to-purple-600/10 rounded-xl border border-primary/20 flex items-center justify-center backdrop-blur-sm" suppressHydrationWarning>
              <div className="text-center space-y-4" suppressHydrationWarning>
                <div className="text-6xl" suppressHydrationWarning>👁</div>
                <p className="text-sm text-muted-foreground">Gru's Web3 Crowdfunding</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}