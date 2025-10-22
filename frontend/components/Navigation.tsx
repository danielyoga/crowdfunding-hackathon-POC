'use client'

// import { ConnectButton } from '@rainbow-me/rainbowkit' // Temporarily disabled
// import { useAccount } from 'wagmi' // Temporarily disabled
import { useMockRole } from '@/contexts/MockRoleContext'
import { RoleSelector } from '@/components/role-selector'

export function Navigation() {
  // const { address, isConnected } = useAccount() // Temporarily disabled
  const { role, mockAccount } = useMockRole()

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">👁</span>
          </div>
          <span className="font-bold text-xl text-primary">GRU</span>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#campaigns" className="text-sm text-muted-foreground hover:text-foreground transition">
            Campaigns
          </a>
          <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition">
            How It Works
          </a>
          <a href="#about" className="text-sm text-muted-foreground hover:text-foreground transition">
            About
          </a>
        </div>

        <div className="flex items-center gap-3">
          <RoleSelector />
        </div>
      </div>
    </nav>
  )
}
