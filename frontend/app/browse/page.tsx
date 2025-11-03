"use client"

import { useEffect, useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { CampaignCard } from "@/components/campaign-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ProjectCardData } from "@/lib/types"
import { ProjectState } from "@/lib/contracts"
import { Search, Filter, Sparkles } from "lucide-react"

export default function BrowsePage() {
  const [projects, setProjects] = useState<ProjectCardData[]>([])
  const [filteredProjects, setFilteredProjects] = useState<ProjectCardData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterState, setFilterState] = useState<"all" | ProjectState>("all")

  // Fetch projects from localStorage
  useEffect(() => {
    fetchProjects()
  }, [])

  // Filter projects when search or filter changes
  useEffect(() => {
    let filtered = projects

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

    setFilteredProjects(filtered)
  }, [projects, searchQuery, filterState])

  async function fetchProjects() {
    try {
      setLoading(true)
      setError(null)

      // Fetch projects from blockchain
      if (typeof window !== "undefined") {
        const { ethers } = await import("ethers")
        const { SIMPLE_FACTORY_ABI, SIMPLE_PROJECT_ABI, getFactoryAddress } = await import("@/lib/contracts")
        
        // Create provider
        const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8545"
        const provider = new ethers.JsonRpcProvider(rpcUrl)
        
        // Get factory contract
        const factoryAddress = getFactoryAddress(31337) // localhost chain ID
        const factory = new ethers.Contract(factoryAddress, SIMPLE_FACTORY_ABI, provider)
        
        // Get all project addresses
        const allProjects = await factory.getAllProjects()
        
        if (allProjects.length === 0) {
          setProjects([])
          setFilteredProjects([])
          setLoading(false)
          return
        }
        
        // Fetch data for each project
        const projectCards: ProjectCardData[] = []
        
        for (const projectAddress of allProjects) {
          try {
            const projectContract = new ethers.Contract(projectAddress, SIMPLE_PROJECT_ABI, provider)
            const data = await projectContract.getProjectData()
            const currentMilestone = Number(await projectContract.currentMilestone())
            const contributors = await projectContract.getContributors()
            
            const fundingGoal = Number(ethers.formatEther(data.fundingGoal))
            const totalRaised = Number(ethers.formatEther(data.totalRaised))
            const progress = fundingGoal > 0 ? (totalRaised / fundingGoal) * 100 : 0
            
            const stateLabels = ["Funding", "Development", "Completed", "Failed"]
            const state = Number(data.state) as ProjectState
            
            projectCards.push({
              address: projectAddress,
              title: data.title,
              description: data.description,
              founder: data.founder,
              fundingGoal: fundingGoal.toFixed(4),
              totalRaised: totalRaised.toFixed(4),
              progress: Math.min(progress, 100),
              state,
              stateLabel: stateLabels[state],
              currentMilestone,
              totalMilestones: 3,
              contributorsCount: contributors.length,
              createdAt: new Date(Number(data.createdAt) * 1000)
            })
          } catch (err) {
            console.error(`Error fetching project ${projectAddress}:`, err)
          }
        }
        
        // Sort by creation date (newest first)
        projectCards.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        
        setProjects(projectCards)
        setFilteredProjects(projectCards)
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
              <Button onClick={fetchProjects} variant="outline">
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
                <div className="text-3xl font-bold text-primary">{projects.length}</div>
                <div className="text-sm text-muted-foreground">Total Projects</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">
                  {projects.filter(c => c.state === ProjectState.Funding).length}
                </div>
                <div className="text-sm text-muted-foreground">Funding</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">
                  {projects.filter(c => c.state === ProjectState.Development).length}
                </div>
                <div className="text-sm text-muted-foreground">In Development</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-primary">
                  {projects.reduce((sum, c) => sum + parseFloat(c.totalRaised), 0).toFixed(2)} ETH
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
                variant={filterState === ProjectState.Funding ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterState(ProjectState.Funding)}
              >
                Funding
              </Button>
              <Button
                variant={filterState === ProjectState.Development ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterState(ProjectState.Development)}
              >
                Development
              </Button>
              <Button
                variant={filterState === ProjectState.Completed ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterState(ProjectState.Completed)}
              >
                Completed
              </Button>
              <Button
                variant={filterState === ProjectState.Failed ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterState(ProjectState.Failed)}
              >
                Failed
              </Button>
            </div>
          </div>

          {/* Project Grid */}
          {filteredProjects.length === 0 ? (
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
                {filteredProjects.map((project) => (
                  <CampaignCard key={project.address} campaign={project} />
                ))}
              </div>

              {/* Results count */}
              <div className="mt-8 text-center text-sm text-muted-foreground">
                Showing {filteredProjects.length} of {projects.length} projects
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
