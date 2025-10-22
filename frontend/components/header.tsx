"use client"

import { useState } from "react"
import { Menu, X, PlusCircle, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter } from "next/navigation"
// import { useWeb3 } from "@/contexts/Web3Context" // Temporarily disabled
// import { WalletConnectModal } from "@/components/wallet-connect-modal" // Temporarily disabled
import { useMockRole } from "@/contexts/MockRoleContext"
import { RoleSelector, MobileRoleSelector } from "@/components/role-selector"

export function Header() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  // const [showWalletModal, setShowWalletModal] = useState(false) // Temporarily disabled
  // const { account, balance, chainId, isConnected, disconnect } = useWeb3() // Temporarily disabled
  const { role, mockAccount, mockBalance, setRole } = useMockRole()
  const isConnected = !!role

  const handleLogout = () => {
    setRole(null)
    router.push("/")
  }

  return (
    <>
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">👁</span>
            </div>
            <span className="font-bold text-xl text-primary">GRU</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition">
              Home
            </Link>
            <Link href="/browse" className="text-sm text-muted-foreground hover:text-foreground transition">
              Browse
            </Link>
            {isConnected && role === "investor" && (
              <Link href="/my-investments" className="text-sm text-muted-foreground hover:text-foreground transition">
                My Investments
              </Link>
            )}
            {isConnected && role === "founder" && (
              <Link href="/my-campaigns" className="text-sm text-muted-foreground hover:text-foreground transition">
                My Campaigns
              </Link>
            )}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {isConnected && role === "founder" && (
              <Button asChild variant="outline" size="sm">
                <Link href="/create">
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Create Campaign
                </Link>
              </Button>
            )}
            
            {isConnected ? (
              <div className="flex items-center gap-3">
                {/* Wallet Info - Always Visible */}
                <div className="px-3 py-2 bg-muted rounded-md border">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-xs font-mono">{mockAccount?.slice(0, 6)}...{mockAccount?.slice(-4)}</span>
                    <span className="text-xs text-muted-foreground">{mockBalance} ETH</span>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground capitalize">{role}</span>
                  </div>
                </div>
                
                {/* Logout Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="text-red-500 hover:text-red-600"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </div>
            ) : (
              <RoleSelector />
            )}
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu">
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Mobile Navigation */}
          {isOpen && (
            <div className="absolute top-16 left-0 right-0 bg-background border-b border-border md:hidden">
              <div className="flex flex-col gap-4 p-4">
                <Link href="/" className="text-sm text-muted-foreground hover:text-foreground" onClick={() => setIsOpen(false)}>
                  Home
                </Link>
                <Link href="/browse" className="text-sm text-muted-foreground hover:text-foreground" onClick={() => setIsOpen(false)}>
                  Browse Projects
                </Link>
                {isConnected && role === "investor" && (
                  <Link href="/my-investments" className="text-sm text-muted-foreground hover:text-foreground" onClick={() => setIsOpen(false)}>
                    My Investments
                  </Link>
                )}
                {isConnected && role === "founder" && (
                  <>
                    <Link href="/my-campaigns" className="text-sm text-muted-foreground hover:text-foreground" onClick={() => setIsOpen(false)}>
                      My Campaigns
                    </Link>
                    <Link href="/create" className="text-sm text-muted-foreground hover:text-foreground" onClick={() => setIsOpen(false)}>
                      Create Campaign
                    </Link>
                  </>
                )}
                
                {isConnected ? (
                  <>
                    {/* Mobile Wallet Info */}
                    <div className="px-3 py-2 bg-muted rounded-md border">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-xs font-mono">{mockAccount?.slice(0, 6)}...{mockAccount?.slice(-4)}</span>
                        <span className="text-xs text-muted-foreground">{mockBalance} ETH</span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground capitalize">{role}</span>
                      </div>
                    </div>
                    
                    {/* Mobile Logout Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsOpen(false);
                        handleLogout();
                      }}
                      className="w-full text-red-500 hover:text-red-600"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </Button>
                  </>
                ) : (
                  <MobileRoleSelector />
                )}
              </div>
            </div>
          )}
        </nav>
      </header>
    </>
  )
}
