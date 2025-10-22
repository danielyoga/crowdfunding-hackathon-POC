'use client'

// import { ConnectButton } from '@rainbow-me/rainbowkit' // Temporarily disabled
// import { useAccount } from 'wagmi' // Temporarily disabled
import Link from 'next/link'
import { useMockRole } from '@/contexts/MockRoleContext'
import { Hero } from '@/components/hero'
import { CampaignList } from '@/components/CampaignList'
import { PlatformStats } from '@/components/PlatformStats'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'

export default function Home() {
  // const { address, isConnected } = useAccount() // Temporarily disabled
  const { role, mockAccount } = useMockRole()
  const address = mockAccount
  const isConnected = !!role

  return (
    <div className="relative min-h-screen">
      <Header />
      
      <main>
        {/* Hero Section */}
        <Hero />
        
        {/* Platform Stats */}
        <section id="stats" className="py-12 bg-card/50 backdrop-blur-sm">
          <div className="container mx-auto px-4">
            <PlatformStats />
          </div>
        </section>
        
        {/* Campaign List */}
        <section id="campaigns" className="py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-2">
                  {role === "investor" ? "Browse Projects" : "Active Projects"}
                </h2>
                <p className="text-muted-foreground">
                  {role === "investor" 
                    ? "Explore innovative projects and support their milestones"
                    : "Discover innovative projects seeking milestone-based funding"
                  }
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <Link
                  href="/browse"
                  className="bg-muted text-foreground px-6 py-3 rounded-lg hover:bg-muted/80 flex items-center gap-2 border"
                >
                  View All
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
                
                {role === "founder" && (
                  <Link
                    href="/create"
                    className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Project
                  </Link>
                )}
              </div>
            </div>
            
            <CampaignList />
          </div>
        </section>
        
        {/* How It Works Section */}
        <section id="how-it-works" className="py-16 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                How It Works
              </h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Our milestone-based approach ensures accountability and protects both founders and funders
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">1</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Create Project</h3>
                <p className="text-muted-foreground">
                  Founders create projects with 5 clear milestones and funding goals
                </p>
              </div>
              
              {/* Step 2 */}
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">2</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Fund Projects</h3>
                <p className="text-muted-foreground">
                  Contributors fund projects with ETH. Funds are held in smart contracts
                </p>
              </div>
              
              {/* Step 3 */}
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary">3</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Release Funds</h3>
                <p className="text-muted-foreground">
                  Founders complete milestones to release funds progressively
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  )
}
