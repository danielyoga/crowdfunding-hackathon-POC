"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { CampaignCard } from "@/components/campaign-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { CampaignCardData } from "@/lib/types"
import { CampaignState } from "@/lib/contracts"
import { Search, Filter, Sparkles } from "lucide-react"

export default function BrowsePage() {
  const [campaigns, setCampaigns] = useState<CampaignCardData[]>([])
  const [filteredCampaigns, setFilteredCampaigns] = useState<CampaignCardData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterState, setFilterState] = useState<"all" | CampaignState>("all")

  // Fetch campaigns from localStorage
  useEffect(() => {
    fetchCampaigns()
  }, [])

  // Filter campaigns when search or filter changes
  useEffect(() => {
    let filtered = campaigns

    // Filter by state
    if (filterState !== "all") {
      filtered = filtered.filter(c => c.state === filterState)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(c => 
        c.title.toLowerCase().includes(query) ||
        c.description.toLowerCase().includes(query) ||
        c.address.toLowerCase().includes(query)
      )
    }

    setFilteredCampaigns(filtered)
  }, [campaigns, searchQuery, filterState])

  async function fetchCampaigns() {
    try {
      setLoading(true)
      setError(null)

      // Load campaigns from localStorage
      if (typeof window !== "undefined") {
        const storedCampaigns = localStorage.getItem('mockCampaigns')
        
        if (!storedCampaigns) {
          setCampaigns([])
          setFilteredCampaigns([])
          setLoading(false)
          return
        }

        const campaigns = JSON.parse(storedCampaigns)
        
        // Transform to CampaignCardData format
        const campaignCards: CampaignCardData[] = campaigns.map((campaign: any) => {
          const fundingGoal = parseFloat(campaign.fundingGoal)
          const totalRaised = parseFloat(campaign.totalRaised)
          const progress = fundingGoal > 0 ? (totalRaised / fundingGoal) * 100 : 0

          const stateLabels = ["Funding", "Development", "Completed", "Failed"]
          const state = campaign.state as CampaignState

          return {
            address: campaign.address,
            title: campaign.title,
            description: campaign.description,
            founder: campaign.founder,
            fundingGoal: campaign.fundingGoal,
            totalRaised: campaign.totalRaised,
            progress: Math.min(progress, 100),
            state,
            stateLabel: stateLabels[state],
            currentMilestone: campaign.currentMilestone || 1,
            totalMilestones: 3,
            contributorsCount: campaign.contributors?.length || 0,
            createdAt: new Date(campaign.createdAt)
          }
        })

        // Sort by creation date (newest first)
        campaignCards.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

        setCampaigns(campaignCards)
        setFilteredCampaigns(campaignCards)
      }
    } catch (err) {
      console.error("Error fetching projects:", err)
      setError(err instanceof Error ? err.message : "Failed to fetch projects")
    } finally {
      setLoading(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <>
        <Header />
        <main className="relative min-h-screen">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="space-y-6">
              <Skeleton className="h-12 w-64" />
              <Skeleton className="h-10 w-full max-w-md" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-[400px]" />
                ))}
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  // Error state
  if (error) {
    return (
      <>
        <Header />
        <main className="relative min-h-screen">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center space-y-4">
              <div className="text-6xl">⚠️</div>
              <h2 className="text-2xl font-bold text-red-400">Error Loading Projects</h2>
              <p className="text-muted-foreground">{error}</p>
              <Button onClick={fetchCampaigns} variant="outline">
                Try Again
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      <main className="relative min-h-screen">
        {/* Background decorations */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 right-10 w-96 h-96 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full blur-3xl opacity-10" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-purple-600 to-indigo-700 rounded-full blur-3xl opacity-15" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header Section */}
          <div className="space-y-6 mb-12">
            <div className="inline-block px-4 py-2 bg-primary/20 rounded-full border border-primary/40 backdrop-blur-sm">
              <span className="text-sm font-medium text-primary flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Browse Projects
              </span>
            </div>
            
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold mb-4">
                Explore Projects
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl">
                Discover and fund innovative hackathon projects. Join the revolution of decentralized crowdfunding.
              </p>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-6">
              <div>
                <div className="text-3xl font-bold text-primary">{campaigns.length}</div>
                <div className="text-sm text-muted-foreground">Total Projects</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">
                  {campaigns.filter(c => c.state === CampaignState.Funding).length}
                </div>
                <div className="text-sm text-muted-foreground">Funding</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">
                  {campaigns.filter(c => c.state === CampaignState.Development).length}
                </div>
                <div className="text-sm text-muted-foreground">In Development</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">
                  {campaigns.reduce((sum, c) => sum + parseFloat(c.totalRaised), 0).toFixed(2)} ETH
                </div>
                <div className="text-sm text-muted-foreground">Total Raised</div>
              </div>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search projects by title, description, or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            {/* Filter */}
            <div className="flex gap-2">
              <Button
                variant={filterState === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterState("all")}
              >
                All
              </Button>
              <Button
                variant={filterState === CampaignState.Funding ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterState(CampaignState.Funding)}
              >
                Funding
              </Button>
              <Button
                variant={filterState === CampaignState.Development ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterState(CampaignState.Development)}
              >
                Development
              </Button>
              <Button
                variant={filterState === CampaignState.Completed ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterState(CampaignState.Completed)}
              >
                Completed
              </Button>
              <Button
                variant={filterState === CampaignState.Failed ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterState(CampaignState.Failed)}
              >
                Failed
              </Button>
            </div>
          </div>

          {/* Campaign Grid */}
          {filteredCampaigns.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-bold mb-2">No Projects Found</h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery || filterState !== "all" 
                  ? "Try adjusting your search or filters"
                  : "Be the first to create a project!"}
              </p>
              {(searchQuery || filterState !== "all") && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchQuery("")
                    setFilterState("all")
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCampaigns.map((campaign) => (
                  <CampaignCard key={campaign.address} campaign={campaign} />
                ))}
              </div>

              {/* Results count */}
              <div className="mt-8 text-center text-sm text-muted-foreground">
                Showing {filteredCampaigns.length} of {campaigns.length} projects
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
