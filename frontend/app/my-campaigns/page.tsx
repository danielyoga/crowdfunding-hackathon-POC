"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ethers } from "ethers";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CampaignStateBadge, MilestoneStateBadge } from "@/components/campaign-state-badge";
import { DashboardSkeleton } from "@/components/loading-state";
import { EmptyState } from "@/components/error-state";
import { useMockRole } from "@/contexts/MockRoleContext";
import { getFactoryAddress, SIMPLE_FACTORY_ABI, SIMPLE_CAMPAIGN_ABI, ProjectState, MilestoneState } from "@/lib/contracts";
import { ProjectCardData } from "@/lib/types";
import { formatEth, formatPercentage, truncateAddress, formatRelativeTime } from "@/lib/web3-utils";
import { 
  PlusCircle, 
  TrendingUp, 
  Target, 
  CheckCircle, 
  Clock,
  Eye,
  Upload,
  BarChart3,
  Wallet
} from "lucide-react";
import Link from "next/link";

export default function MyCampaignsPage() {
  const router = useRouter();
  const { role, mockAccount, isInMockMode } = useMockRole();
  const account = mockAccount;
  const isConnected = !!role;
  const provider: any = null; // No provider needed in mock mode

  const [projects, setProjects] = useState<ProjectCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    totalRaised: "0",
    totalReceived: "0",
  });

  // Role-based access control - only founders can access this page
  useEffect(() => {
    if (isConnected && role !== "founder") {
      router.push("/");
    }
  }, [isConnected, role, router]);

  useEffect(() => {
    if (isConnected && account) {
      fetchMyProjects();
    } else {
      setLoading(false);
    }
  }, [isConnected, account]);

  async function fetchMyProjects() {
    try {
      setLoading(true);

      if (isInMockMode || !provider) {
        // Mock mode - load projects from localStorage
        const storedProjects = localStorage.getItem('mockProjects') || localStorage.getItem('mockCampaigns');
        const mockProjects: ProjectCardData[] = storedProjects ? JSON.parse(storedProjects) : [];

        // Parse dates from JSON
        mockProjects.forEach(project => {
          project.createdAt = new Date(project.createdAt);
        });

        // Calculate stats
        const activeProjects = mockProjects.filter(c => 
          c.state === ProjectState.Funding || c.state === ProjectState.Development
        ).length;
        const completedProjects = mockProjects.filter(c => c.state === ProjectState.Completed).length;
        const totalRaised = mockProjects.reduce((sum, c) => sum + parseFloat(c.totalRaised), 0);

        setProjects(mockProjects);
        setStats({
          total: mockProjects.length,
          active: activeProjects,
          completed: completedProjects,
          totalRaised: totalRaised.toFixed(4),
          totalReceived: "0.0000",
        });
        setLoading(false);
        return;
      }

      // Real Web3 mode - should not reach here in mock mode
      if (!account) {
        setLoading(false);
        setProjects([]);
        return;
      }

      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);

      const factoryAddress = getFactoryAddress(chainId);
      // Validate and normalize the address to prevent ENS resolution
      const validatedFactoryAddress = ethers.getAddress(factoryAddress);
      const factory = new ethers.Contract(validatedFactoryAddress, SIMPLE_FACTORY_ABI, provider);

      // Get all projects
      const allProjects: string[] = await factory.getAllProjects();

      // Filter projects where connected account is the founder
      const myProjectPromises = allProjects.map(async (address) => {
        try {
          // Validate and normalize the address to prevent ENS resolution
          const validatedAddress = ethers.getAddress(address);
          const project = new ethers.Contract(validatedAddress, SIMPLE_CAMPAIGN_ABI, provider);
          const data = await project.getProjectData();

          // Only include if this account is the founder
          if (data.founder.toLowerCase() !== account.toLowerCase()) {
            return null;
          }

          const currentMilestone = Number(await project.currentMilestone());
          const contributors = await project.getContributors();

          const fundingGoal = formatEth(data.fundingGoal);
          const totalRaised = formatEth(data.totalRaised);
          const progress = Number(data.totalRaised) > 0
            ? (Number(data.totalRaised) / Number(data.fundingGoal)) * 100
            : 0;

          const state = Number(data.state) as ProjectState;
          const stateLabels = ["Funding", "Development", "Completed", "Failed"];

          return {
            address,
            title: data.title,
            description: data.description,
            founder: data.founder,
            fundingGoal,
            totalRaised,
            progress: Math.min(progress, 100),
            state,
            stateLabel: stateLabels[state],
            currentMilestone,
            totalMilestones: 5, // SimpleProject has 5 milestones
            contributorsCount: contributors.length,
            createdAt: new Date(Number(data.createdAt) * 1000),
          };
        } catch (err) {
          console.error(`Error fetching project ${address}:`, err);
          return null;
        }
      });

      const myProjects = (await Promise.all(myProjectPromises)).filter(
        (c): c is ProjectCardData => c !== null
      );

      // Sort by creation date (newest first)
      myProjects.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      // Calculate stats
      const activeProjects = myProjects.filter(c => 
        c.state === ProjectState.Funding || c.state === ProjectState.Development
      ).length;
      const completedProjects = myProjects.filter(c => c.state === ProjectState.Completed).length;
      const totalRaised = myProjects.reduce((sum, c) => sum + parseFloat(c.totalRaised), 0);

      setProjects(myProjects);
      setStats({
        total: myProjects.length,
        active: activeProjects,
        completed: completedProjects,
        totalRaised: totalRaised.toFixed(4),
        totalReceived: "0", // TODO: Calculate from milestone releases
      });
      setLoading(false);
    } catch (err) {
      console.error("Error fetching projects:", err);
      setProjects([]);
      setLoading(false);
    }
  }

  if (!isConnected) {
    return (
      <>
        <Header />
        <main className="relative min-h-screen flex items-center justify-center">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Connect Wallet</CardTitle>
              <CardDescription>
                Connect your wallet to view your projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Please connect your wallet using the button in the header to access your founder dashboard.
              </p>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </>
    );
  }

  if (loading) {
    return (
      <>
        <Header />
        <main className="relative min-h-screen">
          <DashboardSkeleton />
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="relative min-h-screen">
        {/* Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 right-10 w-96 h-96 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-purple-600/20 to-indigo-700/20 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">My Projects</h1>
              <p className="text-muted-foreground">
                Manage and track your crowdfunding projects
              </p>
            </div>
            <Button asChild size="lg">
              <Link href="/create">
                <PlusCircle className="w-5 h-5 mr-2" />
                Create Project
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Projects</p>
                    <p className="text-3xl font-bold">{stats.total}</p>
                  </div>
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Active</p>
                    <p className="text-3xl font-bold text-green-500">{stats.active}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                    <Clock className="w-6 h-6 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Completed</p>
                    <p className="text-3xl font-bold text-blue-500">{stats.completed}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Raised</p>
                    <p className="text-3xl font-bold">{stats.totalRaised}</p>
                    <p className="text-xs text-muted-foreground">ETH</p>
                  </div>
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Projects List */}
          {projects.length === 0 ? (
            <EmptyState
              title="No projects created"
              message="You haven't created any projects yet. Start your first crowdfunding project today!"
              action={{
                label: "Create Your First Project",
                onClick: () => router.push("/create")
              }}
              icon="🚀"
            />
          ) : (
            <div className="space-y-4">
              {projects.map((project) => (
                <Card 
                  key={project.address} 
                  className="hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/campaign/${project.address}`)}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Project Info */}
                      <div className="flex-1 space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-xl font-bold">{project.title}</h3>
                              <CampaignStateBadge state={project.state} />
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {project.description}
                            </p>
                          </div>
                        </div>

                        {/* Progress */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Funding Progress</span>
                            <span className="font-semibold">
                              {project.totalRaised} / {project.fundingGoal} IDRX
                            </span>
                          </div>
                          <Progress value={project.progress} className="h-2" />
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">
                              {formatPercentage(project.progress)} funded
                            </span>
                            <span className="text-muted-foreground">
                              {project.contributorsCount} contributors
                            </span>
                          </div>
                        </div>

                        {/* Milestone Info */}
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                              M{project.currentMilestone}
                            </div>
                            <span className="text-muted-foreground">
                              Current Milestone: {project.currentMilestone}/{project.totalMilestones}
                            </span>
                          </div>
                          <div className="text-muted-foreground">
                            Created {formatRelativeTime(Math.floor(project.createdAt.getTime() / 1000))}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-3 lg:w-48" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="outline"
                          className="w-full"
                          asChild
                        >
                          <Link href={`/founder/campaign/${project.address}`}>
                            <BarChart3 className="w-4 h-4 mr-2" />
                            Manage
                          </Link>
                        </Button>

                        {project.state === ProjectState.Development && (
                          <Button
                            className="w-full"
                            asChild
                          >
                            <Link href={`/founder/campaign/${project.address}/submit/${project.currentMilestone}`}>
                              <Upload className="w-4 h-4 mr-2" />
                              Submit M{project.currentMilestone}
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

