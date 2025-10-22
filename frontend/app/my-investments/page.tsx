"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ethers } from "ethers";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CampaignStateBadge } from "@/components/campaign-state-badge";
import { DashboardSkeleton } from "@/components/loading-state";
import { EmptyState } from "@/components/error-state";
import { useMockRole } from "@/contexts/MockRoleContext";
import { getFactoryAddress, SIMPLE_FACTORY_ABI, SIMPLE_CAMPAIGN_ABI, CampaignState, MilestoneState, RiskProfile } from "@/lib/contracts";
import { formatEth, formatPercentage, getRiskProfileLabel, truncateAddress, formatRelativeTime } from "@/lib/web3-utils";
import { 
  Wallet, 
  TrendingUp, 
  BarChart3, 
  AlertCircle, 
  Vote,
  Eye,
  DollarSign,
  CheckCircle,
  XCircle
} from "lucide-react";
import Link from "next/link";

interface Investment {
  campaignAddress: string;
  campaignTitle: string;
  campaignState: CampaignState;
  totalInvested: string;
  committedAmount: string;
  reserveAmount: string;
  riskProfile: RiskProfile;
  currentMilestone: number;
  totalMilestones: number;
  needsVote: boolean;
  autoYesMode: boolean;
  consecutiveMissedVotes: number;
  fundingProgress: number;
  hasRefund: boolean;
}

export default function MyInvestmentsPage() {
  const router = useRouter();
  const { role, mockAccount, isInMockMode } = useMockRole();
  const account = mockAccount;
  const isConnected = !!role;
  const provider: any = null; // Will be created dynamically in fetchInvestments for real Web3 mode

  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalInvested: "0",
    activeInvestments: 0,
    completedInvestments: 0,
    pendingVotes: 0,
    availableRefunds: "0",
  });

  useEffect(() => {
    if (isConnected && account) {
      fetchInvestments();
    }
  }, [isConnected, account]);

  async function fetchInvestments() {
    if (!account) return;

    try {
      setLoading(true);

      if (isInMockMode) {
        // Mock mode - load investments from localStorage
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate loading
        
        // Load user's investments from localStorage
        const storedInvestments = localStorage.getItem(`mockInvestments_${account}`);
        
        if (storedInvestments) {
          const userInvestments: Investment[] = JSON.parse(storedInvestments);
          
          // Calculate stats
          const totalInvested = userInvestments.reduce((sum, inv) => sum + parseFloat(inv.totalInvested), 0);
          const activeInvestments = userInvestments.filter(inv => inv.campaignState === CampaignState.Development || inv.campaignState === CampaignState.Funding).length;
          const completedInvestments = userInvestments.filter(inv => inv.campaignState === CampaignState.Completed).length;
          const pendingVotes = userInvestments.filter(inv => inv.needsVote).length;
          const availableRefunds = userInvestments
            .filter(inv => inv.hasRefund)
            .reduce((sum, inv) => sum + parseFloat(inv.totalInvested), 0);

          setInvestments(userInvestments);
          setStats({
            totalInvested: totalInvested.toFixed(4),
            activeInvestments,
            completedInvestments,
            pendingVotes,
            availableRefunds: availableRefunds.toFixed(4),
          });
        } else {
          // No investments found
          setInvestments([]);
          setStats({
            totalInvested: "0",
            activeInvestments: 0,
            completedInvestments: 0,
            pendingVotes: 0,
            availableRefunds: "0",
          });
        }
      } else {
        // Real Web3 mode - create provider dynamically
        let currentProvider: ethers.BrowserProvider | ethers.JsonRpcProvider;
        
        if (typeof window !== "undefined" && window.ethereum) {
          currentProvider = new ethers.BrowserProvider(window.ethereum);
        } else {
          const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8545";
          currentProvider = new ethers.JsonRpcProvider(rpcUrl);
        }

        const network = await currentProvider.getNetwork();
        const chainId = Number(network.chainId);

        const factoryAddress = getFactoryAddress(chainId);
        // Validate and normalize the address to prevent ENS resolution
        const validatedFactoryAddress = ethers.getAddress(factoryAddress);
        const factory = new ethers.Contract(validatedFactoryAddress, SIMPLE_FACTORY_ABI, currentProvider);

        // Get all campaigns
        const allCampaigns: string[] = await factory.getAllCampaigns();

        // Filter campaigns where user has contributed
        const investmentPromises = allCampaigns.map(async (address) => {
          try {
            // Validate and normalize the address to prevent ENS resolution
            const validatedAddress = ethers.getAddress(address);
            const campaign = new ethers.Contract(validatedAddress, SIMPLE_CAMPAIGN_ABI, currentProvider);

            // Check if user has contributed
            const contributionAmount = await campaign.getContribution(account);
            
            if (contributionAmount <= BigInt(0)) {
              return null;
            }

            const data = await campaign.getCampaignData();
            const currentMilestone = Number(await campaign.currentMilestone());
            const milestone = await campaign.getMilestone(currentMilestone);

            const fundingProgress = Number(data.totalRaised) > 0
              ? (Number(data.totalRaised) / Number(data.fundingGoal)) * 100
              : 0;

            // Check if needs vote (Simple contract doesn't have voting)
            const needsVote = false;
            
            // Check if has refund available
            const hasRefund = Number(data.state) === CampaignState.Failed;

            return {
              campaignAddress: address,
              campaignTitle: data.title,
              campaignState: Number(data.state) as CampaignState,
              totalInvested: formatEth(contributionAmount),
              committedAmount: formatEth(contributionAmount), // Simple contract doesn't distinguish
              reserveAmount: "0", // Simple contract doesn't have reserve
              riskProfile: RiskProfile.Conservative, // Default for simple contract
              currentMilestone,
              totalMilestones: 3, // SimpleCampaign has 3 milestones
              needsVote,
              autoYesMode: false, // Simple contract doesn't have auto-yes
              consecutiveMissedVotes: 0, // Simple contract doesn't track this
              fundingProgress,
              hasRefund,
            };
          } catch (err) {
            console.error(`Error fetching investment ${address}:`, err);
            return null;
          }
        });

        const myInvestments = (await Promise.all(investmentPromises)).filter(
          (inv): inv is Investment => inv !== null
        );

        // Calculate stats
        const totalInvested = myInvestments.reduce((sum, inv) => sum + parseFloat(inv.totalInvested), 0);
        const activeInvestments = myInvestments.filter(inv => inv.campaignState === CampaignState.Development || inv.campaignState === CampaignState.Funding).length;
        const completedInvestments = myInvestments.filter(inv => inv.campaignState === CampaignState.Completed).length;
        const pendingVotes = myInvestments.filter(inv => inv.needsVote).length;
        const availableRefunds = myInvestments
          .filter(inv => inv.hasRefund)
          .reduce((sum, inv) => sum + parseFloat(inv.totalInvested), 0);

        setInvestments(myInvestments);
        setStats({
          totalInvested: totalInvested.toFixed(4),
          activeInvestments,
          completedInvestments,
          pendingVotes,
          availableRefunds: availableRefunds.toFixed(4),
        });
      }
    } catch (err) {
      console.error("Error fetching investments:", err);
    } finally {
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
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Connect your wallet to view your investments
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
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">My Investments</h1>
            <p className="text-muted-foreground">
              Track and manage your campaign investments
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total Invested</p>
                    <p className="text-3xl font-bold">{stats.totalInvested}</p>
                    <p className="text-xs text-muted-foreground">ETH</p>
                  </div>
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Active Investments</p>
                    <p className="text-3xl font-bold text-green-500">{stats.activeInvestments}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Pending Votes</p>
                    <p className="text-3xl font-bold text-purple-500">{stats.pendingVotes}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                    <Vote className="w-6 h-6 text-purple-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Available Refunds</p>
                    <p className="text-3xl font-bold text-orange-500">{stats.availableRefunds}</p>
                    <p className="text-xs text-muted-foreground">ETH</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-orange-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pending Actions */}
          {stats.pendingVotes > 0 && (
            <Alert className="mb-8 border-purple-500/50 bg-purple-500/10">
              <Vote className="h-4 w-4 text-purple-500" />
              <AlertDescription>
                You have {stats.pendingVotes} pending vote{stats.pendingVotes > 1 ? "s" : ""}. Vote now to maintain your voting rights!
              </AlertDescription>
            </Alert>
          )}

          {/* Investments List */}
          {investments.length === 0 ? (
            <EmptyState
              title="No Investments Yet"
              message="You haven't invested in any campaigns yet. Browse projects and start funding!"
              action={{
                label: "Browse Projects",
                onClick: () => router.push("/browse"),
              }}
              icon="💼"
            />
          ) : (
            <div className="space-y-4">
              {investments.map((investment) => (
                <Card 
                  key={investment.campaignAddress}
                  className={`hover:border-primary/50 transition-colors cursor-pointer ${investment.needsVote ? "border-purple-500/30" : ""}`}
                  onClick={() => router.push(`/campaign/${investment.campaignAddress}`)}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Campaign Info */}
                      <div className="flex-1 space-y-4">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-xl font-bold">{investment.campaignTitle}</h3>
                              <CampaignStateBadge state={investment.campaignState} />
                              {investment.needsVote && (
                                <Badge className="bg-purple-500/20 text-purple-500 border-purple-500/30">
                                  🗳️ Vote Now
                                </Badge>
                              )}
                              {investment.autoYesMode && (
                                <Badge variant="outline" className="border-orange-500/30 text-orange-500">
                                  Auto-YES Mode
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>Milestone {investment.currentMilestone}/{investment.totalMilestones}</span>
                              <span>•</span>
                              <span>{getRiskProfileLabel(investment.riskProfile)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Investment Details */}
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Total Invested</p>
                            <p className="text-lg font-bold">{investment.totalInvested} ETH</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Committed</p>
                            <p className="text-lg font-bold text-blue-500">{investment.committedAmount} ETH</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Reserve</p>
                            <p className="text-lg font-bold text-green-500">{investment.reserveAmount} ETH</p>
                          </div>
                        </div>

                        {/* Warnings */}
                        {investment.consecutiveMissedVotes > 0 && !investment.autoYesMode && (
                          <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="text-xs">
                              Missed votes: {investment.consecutiveMissedVotes}/2. One more miss will activate Auto-YES mode!
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-3 lg:w-48" onClick={(e) => e.stopPropagation()}>
                        {investment.needsVote && (
                          <Button
                            className="w-full bg-purple-500 hover:bg-purple-600"
                            asChild
                          >
                            <Link href={`/campaign/${investment.campaignAddress}#voting-section`}>
                              <Vote className="w-4 h-4 mr-2" />
                              Vote Now
                            </Link>
                          </Button>
                        )}

                        {investment.hasRefund && (
                          <Button
                            className="w-full bg-orange-500 hover:bg-orange-600"
                            asChild
                          >
                            <Link href={`/campaign/${investment.campaignAddress}/refund`}>
                              <DollarSign className="w-4 h-4 mr-2" />
                              Claim Refund
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

