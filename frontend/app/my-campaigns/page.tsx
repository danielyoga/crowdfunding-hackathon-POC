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
import { getFactoryAddress, SIMPLE_FACTORY_ABI, SIMPLE_CAMPAIGN_ABI, CampaignState, MilestoneState } from "@/lib/contracts";
import { CampaignCardData } from "@/lib/types";
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

  const [campaigns, setCampaigns] = useState<CampaignCardData[]>([]);
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
      fetchMyCampaigns();
    } else {
      setLoading(false);
    }
  }, [isConnected, account]);

  async function fetchMyCampaigns() {
    try {
      setLoading(true);

      if (isInMockMode || !provider) {
        // Mock mode - load campaigns from localStorage
        const storedCampaigns = localStorage.getItem('mockCampaigns');
        const mockCampaigns: CampaignCardData[] = storedCampaigns ? JSON.parse(storedCampaigns) : [];

        // Parse dates from JSON
        mockCampaigns.forEach(campaign => {
          campaign.createdAt = new Date(campaign.createdAt);
        });

        // Calculate stats
        const activeCampaigns = mockCampaigns.filter(c => 
          c.state === CampaignState.Funding || c.state === CampaignState.Development
        ).length;
        const completedCampaigns = mockCampaigns.filter(c => c.state === CampaignState.Completed).length;
        const totalRaised = mockCampaigns.reduce((sum, c) => sum + parseFloat(c.totalRaised), 0);

        setCampaigns(mockCampaigns);
        setStats({
          total: mockCampaigns.length,
          active: activeCampaigns,
          completed: completedCampaigns,
          totalRaised: totalRaised.toFixed(4),
          totalReceived: "0.0000",
        });
        setLoading(false);
        return;
      }

      // Real Web3 mode - should not reach here in mock mode
      if (!account) {
        setLoading(false);
        setCampaigns([]);
        return;
      }

      const network = await provider.getNetwork();
      const chainId = Number(network.chainId);

      const factoryAddress = getFactoryAddress(chainId);
      // Validate and normalize the address to prevent ENS resolution
      const validatedFactoryAddress = ethers.getAddress(factoryAddress);
      const factory = new ethers.Contract(validatedFactoryAddress, SIMPLE_FACTORY_ABI, provider);

      // Get all campaigns
      const allCampaigns: string[] = await factory.getAllCampaigns();

      // Filter campaigns where connected account is the founder
      const myCampaignPromises = allCampaigns.map(async (address) => {
        try {
          // Validate and normalize the address to prevent ENS resolution
          const validatedAddress = ethers.getAddress(address);
          const campaign = new ethers.Contract(validatedAddress, SIMPLE_CAMPAIGN_ABI, provider);
          const data = await campaign.getCampaignData();

          // Only include if this account is the founder
          if (data.founder.toLowerCase() !== account.toLowerCase()) {
            return null;
          }

          const currentMilestone = Number(await campaign.currentMilestone());
          const contributors = await campaign.getContributors();

          const fundingGoal = formatEth(data.fundingGoal);
          const totalRaised = formatEth(data.totalRaised);
          const progress = Number(data.totalRaised) > 0
            ? (Number(data.totalRaised) / Number(data.fundingGoal)) * 100
            : 0;

          const state = Number(data.state) as CampaignState;
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
            totalMilestones: 5, // SimpleCampaign has 5 milestones
            contributorsCount: contributors.length,
            createdAt: new Date(Number(data.createdAt) * 1000),
          };
        } catch (err) {
          console.error(`Error fetching campaign ${address}:`, err);
          return null;
        }
      });

      const myCampaigns = (await Promise.all(myCampaignPromises)).filter(
        (c): c is CampaignCardData => c !== null
      );

      // Sort by creation date (newest first)
      myCampaigns.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      // Calculate stats
      const activeCampaigns = myCampaigns.filter(c => 
        c.state === CampaignState.Funding || c.state === CampaignState.Development
      ).length;
      const completedCampaigns = myCampaigns.filter(c => c.state === CampaignState.Completed).length;
      const totalRaised = myCampaigns.reduce((sum, c) => sum + parseFloat(c.totalRaised), 0);

      setCampaigns(myCampaigns);
      setStats({
        total: myCampaigns.length,
        active: activeCampaigns,
        completed: completedCampaigns,
        totalRaised: totalRaised.toFixed(4),
        totalReceived: "0", // TODO: Calculate from milestone releases
      });
      setLoading(false);
    } catch (err) {
      console.error("Error fetching campaigns:", err);
      setCampaigns([]);
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

          {/* Campaigns List */}
          {campaigns.length === 0 ? (
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
              {campaigns.map((campaign) => (
                <Card 
                  key={campaign.address} 
                  className="hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/campaign/${campaign.address}`)}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Campaign Info */}
                      <div className="flex-1 space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-xl font-bold">{campaign.title}</h3>
                              <CampaignStateBadge state={campaign.state} />
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {campaign.description}
                            </p>
                          </div>
                        </div>

                        {/* Progress */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Funding Progress</span>
                            <span className="font-semibold">
                              {campaign.totalRaised} / {campaign.fundingGoal} ETH
                            </span>
                          </div>
                          <Progress value={campaign.progress} className="h-2" />
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">
                              {formatPercentage(campaign.progress)} funded
                            </span>
                            <span className="text-muted-foreground">
                              {campaign.contributorsCount} contributors
                            </span>
                          </div>
                        </div>

                        {/* Milestone Info */}
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
                              M{campaign.currentMilestone}
                            </div>
                            <span className="text-muted-foreground">
                              Current Milestone: {campaign.currentMilestone}/{campaign.totalMilestones}
                            </span>
                          </div>
                          <div className="text-muted-foreground">
                            Created {formatRelativeTime(Math.floor(campaign.createdAt.getTime() / 1000))}
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
                          <Link href={`/founder/campaign/${campaign.address}`}>
                            <BarChart3 className="w-4 h-4 mr-2" />
                            Manage
                          </Link>
                        </Button>

                        {campaign.state === CampaignState.Development && (
                          <Button
                            className="w-full"
                            asChild
                          >
                            <Link href={`/founder/campaign/${campaign.address}/submit/${campaign.currentMilestone}`}>
                              <Upload className="w-4 h-4 mr-2" />
                              Submit M{campaign.currentMilestone}
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

