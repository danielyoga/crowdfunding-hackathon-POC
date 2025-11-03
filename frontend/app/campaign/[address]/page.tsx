"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ethers } from "ethers";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { CampaignStateBadge } from "@/components/campaign-state-badge";
import { MilestoneTimeline } from "@/components/milestone-timeline";
import { CampaignDetailsSkeleton } from "@/components/loading-state";
import { ErrorState } from "@/components/error-state";
import { useMockRole } from "@/contexts/MockRoleContext";
import { 
  CampaignState, 
  MilestoneState, 
  RiskProfile, 
  SIMPLE_CAMPAIGN_ABI
} from "@/lib/contracts";
import { CampaignWithAddress, Milestone } from "@/lib/types";
import { 
  truncateAddress, 
  formatEth, 
  formatPercentage,
  getRiskProfileLabel,
  formatRelativeTime,
  parseEthInput,
  validateEthAmount,
  getExplorerUrl,
  isValidAddress,
  validateAddress
} from "@/lib/web3-utils";
import {
  Users,
  Target,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  Copy,
  ArrowLeft
} from "lucide-react";
import { toast } from "sonner";

export default function CampaignDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { role, mockAccount, isInMockMode } = useMockRole();
  const account = mockAccount;
  const isConnected = !!role;
  const chainId = 31337; // Localhost for testing, update to 4202 for Lisk Sepolia or 1135 for Lisk Mainnet
  const provider = null; // No provider needed in mock mode
  const signer = null; // No signer needed in mock mode
  
  const campaignAddress = params.address as string;

  const [campaign, setCampaign] = useState<CampaignWithAddress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Funding state
  const [fundAmount, setFundAmount] = useState("");
  const [isFunding, setIsFunding] = useState(false);

  // Voting state
  const [isVoting, setIsVoting] = useState(false);

  useEffect(() => {
    fetchCampaignData();
  }, [campaignAddress, account]);

  async function fetchCampaignData() {
    try {
      setLoading(true);
      setError(null);

      // Validate address format first
      if (!isValidAddress(campaignAddress)) {
        setError(`Invalid campaign address: ${campaignAddress}. Ethereum addresses must be 42 characters (0x + 40 hex digits).`);
        setLoading(false);
        return;
      }

      if (isInMockMode) {
        // Load campaign from localStorage
        const storedCampaigns = localStorage.getItem('mockCampaigns');
        
        if (!storedCampaigns) {
          setError("No campaigns found");
          return;
        }

        const campaigns = JSON.parse(storedCampaigns);
        const foundCampaign = campaigns.find((c: any) => c.address === campaignAddress);
        
        if (!foundCampaign) {
          setError("Campaign not found");
          return;
        }

        // Convert stored campaign to expected format
        const campaignData = {
          title: foundCampaign.title,
          description: foundCampaign.description,
          founder: foundCampaign.founder,
          fundingGoal: ethers.parseEther(foundCampaign.fundingGoal),
          totalRaised: ethers.parseEther(foundCampaign.totalRaised),
          totalCommitted: ethers.parseEther(foundCampaign.totalRaised),
          totalReserve: BigInt(0),
          state: foundCampaign.state,
          currentMilestone: foundCampaign.currentMilestone,
          createdAt: BigInt(Math.floor(new Date(foundCampaign.createdAt).getTime() / 1000)),
        };

        // For SimpleCampaign mock mode, create milestones with proper structure
        const mockMilestones: Milestone[] = [
          {
            description: "Milestone 0",
            releasePercentage: 3333, // 33.33% in basis points
            state: foundCampaign.currentMilestone > 0 ? MilestoneState.Completed : 
                   foundCampaign.milestones && foundCampaign.milestones[0] ? foundCampaign.milestones[0].state : MilestoneState.Pending,
            submittedAt: foundCampaign.milestones && foundCampaign.milestones[0] ? BigInt(foundCampaign.milestones[0].submittedAt || 0) : BigInt(0),
            votingDeadline: foundCampaign.milestones && foundCampaign.milestones[0] ? BigInt(foundCampaign.milestones[0].votingDeadline || 0) : BigInt(0),
            yesVotes: foundCampaign.milestones && foundCampaign.milestones[0] ? BigInt(foundCampaign.milestones[0].yesVotes || 0) : BigInt(0),
            noVotes: foundCampaign.milestones && foundCampaign.milestones[0] ? BigInt(foundCampaign.milestones[0].noVotes || 0) : BigInt(0),
          },
          {
            description: "Milestone 1",
            releasePercentage: 3333, // 33.33% in basis points
            state: foundCampaign.currentMilestone > 1 ? MilestoneState.Completed : 
                   foundCampaign.milestones && foundCampaign.milestones[1] ? foundCampaign.milestones[1].state : MilestoneState.Pending,
            submittedAt: foundCampaign.milestones && foundCampaign.milestones[1] ? BigInt(foundCampaign.milestones[1].submittedAt || 0) : BigInt(0),
            votingDeadline: foundCampaign.milestones && foundCampaign.milestones[1] ? BigInt(foundCampaign.milestones[1].votingDeadline || 0) : BigInt(0),
            yesVotes: foundCampaign.milestones && foundCampaign.milestones[1] ? BigInt(foundCampaign.milestones[1].yesVotes || 0) : BigInt(0),
            noVotes: foundCampaign.milestones && foundCampaign.milestones[1] ? BigInt(foundCampaign.milestones[1].noVotes || 0) : BigInt(0),
          },
          {
            description: "Milestone 2",
            releasePercentage: 3334, // 33.34% in basis points (to make 100%)
            state: foundCampaign.currentMilestone > 2 ? MilestoneState.Completed : 
                   foundCampaign.milestones && foundCampaign.milestones[2] ? foundCampaign.milestones[2].state : MilestoneState.Pending,
            submittedAt: foundCampaign.milestones && foundCampaign.milestones[2] ? BigInt(foundCampaign.milestones[2].submittedAt || 0) : BigInt(0),
            votingDeadline: foundCampaign.milestones && foundCampaign.milestones[2] ? BigInt(foundCampaign.milestones[2].votingDeadline || 0) : BigInt(0),
            yesVotes: foundCampaign.milestones && foundCampaign.milestones[2] ? BigInt(foundCampaign.milestones[2].yesVotes || 0) : BigInt(0),
            noVotes: foundCampaign.milestones && foundCampaign.milestones[2] ? BigInt(foundCampaign.milestones[2].noVotes || 0) : BigInt(0),
          }
        ];

        const mockContributors: any[] = [];

        // Check if user has actually invested in this campaign
        let mockUserContribution = undefined;
        if (account) {
          const investmentKey = `mockInvestments_${account}`;
          const existingInvestments = localStorage.getItem(investmentKey);
          if (existingInvestments) {
            const investments = JSON.parse(existingInvestments);
            const userInvestment = investments.find((inv: any) => inv.campaignAddress === campaignAddress);
            
            if (userInvestment) {
              mockUserContribution = {
                contributor: account,
                totalAmount: ethers.parseEther(userInvestment.totalInvested),
                committedAmount: ethers.parseEther(userInvestment.committedAmount),
                reserveAmount: ethers.parseEther(userInvestment.reserveAmount),
                riskProfile: userInvestment.riskProfile,
                hasVoted: userInvestment.needsVote ? false : true,
                votedYes: false,
                consecutiveMissedVotes: userInvestment.consecutiveMissedVotes || 0,
                autoYesMode: userInvestment.autoYesMode || false,
              };
            }
          }
        }

        setCampaign({
          address: campaignAddress,
          data: campaignData,
          milestones: mockMilestones,
          contributors: mockContributors,
          userContribution: mockUserContribution,
        });
      } else {
        // Real Web3 mode
        // Use provider if available, otherwise create public provider
        let currentProvider: ethers.BrowserProvider | ethers.JsonRpcProvider;
        
        if (provider) {
          currentProvider = provider;
        } else if (typeof window !== "undefined" && window.ethereum) {
          currentProvider = new ethers.BrowserProvider(window.ethereum);
        } else {
          const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL || "http://127.0.0.1:8545";
          currentProvider = new ethers.JsonRpcProvider(rpcUrl);
        }

        // Validate and normalize the campaign address to prevent ENS resolution
        const validatedAddress = ethers.getAddress(campaignAddress);

        const campaignContract = new ethers.Contract(
          validatedAddress,
          SIMPLE_CAMPAIGN_ABI,
          currentProvider
        );

        // Fetch campaign data
        const data = await campaignContract.getProjectData();
        const currentMilestone = Number(await campaignContract.currentMilestone());
        const contributors = await campaignContract.getContributors();

        // Fetch milestones (SimpleCampaign has exactly 3 milestones)
        const milestonePromises = [];
        for (let i = 0; i < 3; i++) {
          milestonePromises.push(campaignContract.getMilestone(i));
        }
        const milestonesData = await Promise.all(milestonePromises);

        const milestones: Milestone[] = milestonesData.map((m, index) => ({
          description: m.description,
          releasePercentage: Number(m.releasePercentage),
          state: Number(m.state) as MilestoneState,
          submittedAt: m.submittedAt || BigInt(0),
          votingDeadline: m.votingDeadline || BigInt(0),
          yesVotes: m.yesVotes || BigInt(0),
          noVotes: m.noVotes || BigInt(0),
        }));

        // Get user's contribution if connected
        let userContribution;
        if (account) {
          try {
            const contributionAmount = await campaignContract.getContribution(account);
            if (contributionAmount > BigInt(0)) {
              userContribution = {
                contributor: account,
                totalAmount: contributionAmount,
                committedAmount: contributionAmount, // Simple contract doesn't distinguish
                reserveAmount: BigInt(0), // Simple contract doesn't have reserve
                riskProfile: RiskProfile.Conservative, // Default for simple contract
                hasVoted: false, // Simple contract doesn't have voting
                votedYes: false,
                consecutiveMissedVotes: 0,
                autoYesMode: false,
              };
            }
          } catch (err) {
            console.error("Error fetching user contribution:", err);
          }
        }

        setCampaign({
          address: campaignAddress,
          data: {
            title: data.title,
            description: data.description,
            founder: data.founder,
            fundingGoal: data.fundingGoal,
            totalRaised: data.totalRaised,
            totalCommitted: data.totalCommitted || BigInt(0),
            totalReserve: data.totalReserve || BigInt(0),
            state: Number(data.state) as CampaignState,
            currentMilestone,
            createdAt: data.createdAt,
          },
          milestones,
          contributors: contributors.map((addr: string) => ({ contributor: addr } as any)),
          userContribution,
        });
      }
    } catch (err: any) {
      console.error("Error fetching campaign:", err);
      setError(err.message || "Failed to load campaign");
    } finally {
      setLoading(false);
    }
  }

  async function handleFund() {
    if (!campaign) return;

    const validation = validateEthAmount(fundAmount, ethers.parseEther("0.001"));
    if (!validation.isValid) {
      toast.error(validation.error);
      return;
    }

    try {
      setIsFunding(true);
      
      if (isInMockMode) {
        // Mock mode - simulate funding and update localStorage
        toast.info("Simulating funding transaction...");
        
        // Simulate async operation
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Load campaigns from localStorage
        const storedCampaigns = localStorage.getItem('mockCampaigns');
        if (storedCampaigns) {
          const campaigns = JSON.parse(storedCampaigns);
          const campaignIndex = campaigns.findIndex((c: any) => c.address === campaignAddress);
          
          if (campaignIndex !== -1) {
            // Update the campaign with the new funding
            const currentRaised = parseFloat(campaigns[campaignIndex].totalRaised);
            const newAmount = parseFloat(fundAmount);
            campaigns[campaignIndex].totalRaised = (currentRaised + newAmount).toString();
            
            // Add contributor count (simplified for mock)
            campaigns[campaignIndex].contributors = (campaigns[campaignIndex].contributors || 0) + 1;
            
            // Save back to localStorage
            localStorage.setItem('mockCampaigns', JSON.stringify(campaigns));
            
            // Save investment to user's portfolio
            const investmentKey = `mockInvestments_${account}`;
            const existingInvestments = localStorage.getItem(investmentKey);
            const investments = existingInvestments ? JSON.parse(existingInvestments) : [];
            
            // Add new investment (SimpleCampaign doesn't have risk profiles)
            investments.push({
              campaignAddress: campaignAddress,
              campaignTitle: campaigns[campaignIndex].title,
              campaignState: campaigns[campaignIndex].state,
              totalInvested: fundAmount,
              committedAmount: fundAmount, // SimpleCampaign: all funds are committed
              reserveAmount: "0", // SimpleCampaign: no reserve
              riskProfile: RiskProfile.Balanced, // Default for display only
              currentMilestone: campaigns[campaignIndex].currentMilestone,
              totalMilestones: 5,
              needsVote: false,
              autoYesMode: false,
              consecutiveMissedVotes: 0,
              fundingProgress: (parseFloat(campaigns[campaignIndex].totalRaised) / parseFloat(campaigns[campaignIndex].fundingGoal)) * 100,
              hasRefund: false,
            });
            
            localStorage.setItem(investmentKey, JSON.stringify(investments));
            
            console.log('Mock funding campaign:', { 
              amount: fundAmount, 
              campaignAddress,
              newTotal: campaigns[campaignIndex].totalRaised
            });
          }
        }
        
        toast.success("Successfully funded the campaign! 🎉");
        setFundAmount("");
        
        // Refresh campaign data
        await fetchCampaignData();
      } else {
        // Real Web3 mode
        if (!signer) {
          toast.error("Wallet not connected");
          return;
        }

        toast.info("Please confirm the transaction in your wallet...");

        const campaignContract = new ethers.Contract(
          campaignAddress,
          SIMPLE_CAMPAIGN_ABI,
          signer
        );

        const amount = parseEthInput(fundAmount);
        // SimpleCampaign.fund() doesn't take parameters, only msg.value
        const tx = await campaignContract.fund({ value: amount });
        
        toast.info("Transaction submitted. Waiting for confirmation...");
        await tx.wait();

        toast.success("Successfully funded the campaign! 🎉");
        setFundAmount("");
        
        // Refresh campaign data
        await fetchCampaignData();
      }
    } catch (err: any) {
      console.error("Error funding campaign:", err);
      toast.error(err.message || "Failed to fund campaign");
    } finally {
      setIsFunding(false);
    }
  }

  async function handleVote(milestoneIndex: number, voteYes: boolean) {
    if (!campaign) return;

    try {
      setIsVoting(true);
      
      if (isInMockMode) {
        // Mock mode - simulate voting and update localStorage
        toast.info("Simulating vote submission...");
        
        // Simulate async operation
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Load campaigns from localStorage
        const storedCampaigns = localStorage.getItem('mockCampaigns');
        if (storedCampaigns) {
          const campaigns = JSON.parse(storedCampaigns);
          const campaignIndex = campaigns.findIndex((c: any) => c.address === campaignAddress);
          
          if (campaignIndex !== -1) {
            // Initialize milestones array if not exists
            if (!campaigns[campaignIndex].milestones) {
              campaigns[campaignIndex].milestones = [{}, {}, {}];
            }
            
            // Initialize milestone data if not exists
            if (!campaigns[campaignIndex].milestones[milestoneIndex]) {
              campaigns[campaignIndex].milestones[milestoneIndex] = {
                yesVotes: 0,
                noVotes: 0,
                voters: []
              };
            }
            
            const milestone = campaigns[campaignIndex].milestones[milestoneIndex];
            
            // Check if user already voted
            if (!milestone.voters) milestone.voters = [];
            if (milestone.voters.includes(account)) {
              toast.error("You have already voted on this milestone");
              setIsVoting(false);
              return;
            }
            
            // Get user's contribution weight
            const userContribution = parseFloat(campaign.userContribution?.totalAmount.toString() || "0") / 1e18;
            
            // Add vote
            if (voteYes) {
              milestone.yesVotes = (parseFloat(milestone.yesVotes) || 0) + userContribution;
            } else {
              milestone.noVotes = (parseFloat(milestone.noVotes) || 0) + userContribution;
            }
            
            // Mark user as voted
            milestone.voters.push(account);
            
            // Save back to localStorage
            localStorage.setItem('mockCampaigns', JSON.stringify(campaigns));
            
            console.log('Mock voting on milestone:', { 
              milestoneIndex, 
              voteYes,
              campaignAddress,
              weight: userContribution
            });
          }
        }
        
        toast.success(`Vote ${voteYes ? "YES" : "NO"} recorded! ✅`);
        
        // Refresh campaign data
        await fetchCampaignData();
      } else {
        // Real Web3 mode
        if (!signer) {
          toast.error("Wallet not connected");
          return;
        }

        toast.info("Please confirm your vote in your wallet...");

        const campaignContract = new ethers.Contract(
          campaignAddress,
          SIMPLE_CAMPAIGN_ABI,
          signer
        );

        const tx = await campaignContract.vote(milestoneIndex, voteYes);
        
        toast.info("Vote submitted. Waiting for confirmation...");
        await tx.wait();

        toast.success(`Vote ${voteYes ? "YES" : "NO"} recorded! ✅`);
        
        // Refresh campaign data
        await fetchCampaignData();
      }
    } catch (err: any) {
      console.error("Error voting:", err);
      toast.error(err.message || "Failed to vote");
    } finally {
      setIsVoting(false);
    }
  }

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    toast.success("Address copied to clipboard!");
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="relative min-h-screen">
          <CampaignDetailsSkeleton />
        </main>
        <Footer />
      </>
    );
  }

  if (error || !campaign) {
    return (
      <>
        <Header />
        <main className="relative min-h-screen flex items-center justify-center">
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground">
              {error === "No campaigns found" || error === "Campaign not found" 
                ? "No campaign for now" 
                : error || "The campaign you're looking for doesn't exist"}
            </p>
            <Button 
              onClick={() => router.push("/")} 
              className="mt-4"
              variant="outline"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const progress = (Number(campaign.data.totalRaised) / Number(campaign.data.fundingGoal)) * 100;
  const isFullyFunded = progress >= 100;
  const isFailed = campaign.data.state === CampaignState.Failed;
  const isCompleted = campaign.data.state === CampaignState.Completed;
  const isFounder = account && campaign.data.founder && account.toLowerCase() === campaign.data.founder.toLowerCase();
  const hasContributed = !!campaign.userContribution;

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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Header */}
              <div>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <h1 className="text-4xl font-bold">{campaign.data.title}</h1>
                  <CampaignStateBadge state={campaign.data.state} />
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span>Founder:</span>
                    <button 
                      onClick={() => copyAddress(campaign.data.founder)}
                      className="font-mono hover:text-foreground transition flex items-center gap-1"
                    >
                      {truncateAddress(campaign.data.founder)}
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Created {formatRelativeTime(campaign.data.createdAt)}
                  </div>
                  <a
                    href={getExplorerUrl(chainId!, "address", campaignAddress)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-foreground transition"
                  >
                    View on Explorer <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Tabs */}
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="milestones">Milestones</TabsTrigger>
                  <TabsTrigger value="contributors">Contributors</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                  {/* Description */}
                  <Card>
                    <CardHeader>
                      <CardTitle>About This Project</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground whitespace-pre-wrap">
                        {campaign.data.description}
                      </p>
                    </CardContent>
                  </Card>

                  {/* Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{campaign.contributors.length}</div>
                        <div className="text-sm text-muted-foreground">Contributors</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{campaign.data.currentMilestone}/5</div>
                        <div className="text-sm text-muted-foreground">Milestones</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{formatEth(campaign.data.totalRaised)}</div>
                        <div className="text-sm text-muted-foreground">IDRX Raised</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{progress.toFixed(0)}%</div>
                        <div className="text-sm text-muted-foreground">Progress</div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="milestones" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Project Milestones</CardTitle>
                      <CardDescription>
                        Track the progress of all 5 project milestones
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <MilestoneTimeline
                        milestones={campaign.milestones}
                        currentMilestone={campaign.data.currentMilestone}
                        showVoteButton={hasContributed && !isFounder}
                        onVote={(index) => {
                          // Scroll to voting section
                          document.getElementById("voting-section")?.scrollIntoView({ behavior: "smooth" });
                        }}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="contributors" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Contributors ({campaign.contributors.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {campaign.contributors.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          No contributors yet. Be the first to fund this project!
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {campaign.contributors.map((contributor, index) => (
                            <div 
                              key={index}
                              className="flex items-center justify-between p-3 rounded-md border"
                            >
                              <span className="font-mono">{truncateAddress(contributor.contributor)}</span>
                              {contributor.contributor && account && contributor.contributor.toLowerCase() === account.toLowerCase() && (
                                <span className="text-xs text-primary">You</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Funding Progress */}
              <Card>
                <CardHeader>
                  <CardTitle>Funding Progress</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-bold">{formatEth(campaign.data.totalRaised)}</span>
                    <span className="text-muted-foreground">/ {formatEth(campaign.data.fundingGoal)} IDRX</span>
                  </div>
                  
                  <Progress value={Math.min(progress, 100)} className="h-2" />
                  
                  <div className="text-sm text-muted-foreground text-center">
                    {formatPercentage(progress)} funded
                  </div>
                </CardContent>
              </Card>

              {/* User Investment */}
              {hasContributed && campaign.userContribution && (
                <Card>
                  <CardHeader>
                    <CardTitle>Your Investment</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Total</span>
                      <span className="font-medium">{formatEth(campaign.userContribution.totalAmount)} IDRX</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Committed</span>
                      <span className="font-medium">{formatEth(campaign.userContribution.committedAmount)} IDRX</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Reserve</span>
                      <span className="font-medium">{formatEth(campaign.userContribution.reserveAmount)} IDRX</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Risk Profile</span>
                      <span className="font-medium">{getRiskProfileLabel(campaign.userContribution.riskProfile)}</span>
                    </div>
                    {campaign.userContribution.autoYesMode && (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          Auto-YES mode is active due to missed votes
                        </AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Fund Campaign - Only in Funding state */}
              {!hasContributed && !isFounder && !isFailed && !isCompleted && campaign.data.state === CampaignState.Funding && (
                <Card>
                  <CardHeader>
                    <CardTitle>Fund This Project</CardTitle>
                    <CardDescription>
                      Support this project with your contribution
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!isConnected ? (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Please select your role (Investor) in the header to fund this project
                        </AlertDescription>
                      </Alert>
                    ) : role !== "investor" ? (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Only investors can fund campaigns. Please switch to Investor role.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <>
                        {/* Amount */}
                        <div className="space-y-2">
                          <Label htmlFor="amount">Amount (IDRX)</Label>
                          <Input
                            id="amount"
                            type="number"
                            step="0.001"
                            min="0.001"
                            placeholder="0.1"
                            value={fundAmount}
                            onChange={(e) => setFundAmount(e.target.value)}
                          />
                          <p className="text-xs text-muted-foreground">
                            Minimum: 0.001 IDRX
                          </p>
                        </div>

                        <Button
                          className="w-full"
                          onClick={handleFund}
                          disabled={isFunding || !fundAmount || parseFloat(fundAmount) <= 0 || isFullyFunded}
                        >
                          {isFunding ? "Funding..." : isFullyFunded ? "Fully Funded" : "Fund Project"}
                        </Button>
                        
                        {isFullyFunded && (
                          <p className="text-xs text-center text-muted-foreground">
                            This project has reached its funding goal
                          </p>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Development Phase Info - For investors */}
              {!isFounder && campaign.data.state === CampaignState.Development && !hasContributed && (
                <Card>
                  <CardHeader>
                    <CardTitle>Development Phase</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        <p className="font-semibold mb-1">Project is now in development!</p>
                        <p className="text-sm">
                          The founder is working on milestones. Track their progress below.
                        </p>
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              )}

              {/* Voting Section - For investors who have contributed */}
              {hasContributed && !isFounder && campaign.data.state === CampaignState.Development && (() => {
                // Find the milestone that's currently in Submitted state
                const votingMilestone = campaign.milestones.find((m, idx) => 
                  m.state === MilestoneState.Submitted && idx === campaign.data.currentMilestone
                );
                const votingMilestoneIndex = campaign.milestones.findIndex((m, idx) => 
                  m.state === MilestoneState.Submitted && idx === campaign.data.currentMilestone
                );

                if (!votingMilestone || votingMilestoneIndex === -1) return null;

                const totalVotes = Number(votingMilestone.yesVotes) + Number(votingMilestone.noVotes);
                const yesPercentage = totalVotes > 0 ? (Number(votingMilestone.yesVotes) / totalVotes) * 100 : 0;
                const noPercentage = totalVotes > 0 ? (Number(votingMilestone.noVotes) / totalVotes) * 100 : 0;
                const votingDeadline = Number(votingMilestone.votingDeadline);
                const now = Math.floor(Date.now() / 1000);
                const timeRemaining = votingDeadline - now;
                const isVotingActive = timeRemaining > 0 && votingMilestone.state === MilestoneState.Submitted;
                
                // Check if user has voted (for mock mode, check localStorage)
                let hasUserVoted = false;
                if (isInMockMode && account) {
                  const storedCampaigns = localStorage.getItem('mockCampaigns');
                  if (storedCampaigns) {
                    const campaigns = JSON.parse(storedCampaigns);
                    const foundCampaign = campaigns.find((c: any) => c.address === campaignAddress);
                    if (foundCampaign && foundCampaign.milestones && foundCampaign.milestones[votingMilestoneIndex]) {
                      const milestone = foundCampaign.milestones[votingMilestoneIndex];
                      hasUserVoted = milestone.voters && milestone.voters.includes(account);
                    }
                  }
                }

                return (
                  <Card id="voting-section" className="border-primary/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-primary" />
                        Milestone Voting Active
                      </CardTitle>
                      <CardDescription>
                        Vote to approve or reject Milestone {votingMilestoneIndex}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Milestone Info */}
                      <div className="p-4 bg-muted rounded-lg">
                        <h4 className="font-semibold mb-2">Milestone {votingMilestoneIndex}</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          {votingMilestone.description}
                        </p>
                        <div className="flex items-center gap-2 text-sm">
                          <Target className="w-4 h-4" />
                          <span>Release: {(votingMilestone.releasePercentage / 100).toFixed(2)}%</span>
                        </div>
                      </div>

                      {/* Founder's Submission Details (if available in mock mode) */}
                      {(() => {
                        if (isInMockMode) {
                          const storedCampaigns = localStorage.getItem('mockCampaigns');
                          if (storedCampaigns) {
                            const campaigns = JSON.parse(storedCampaigns);
                            const foundCampaign = campaigns.find((c: any) => c.address === campaignAddress);
                            if (foundCampaign && foundCampaign.milestones && foundCampaign.milestones[votingMilestoneIndex]) {
                              const milestone = foundCampaign.milestones[votingMilestoneIndex];
                              if (milestone.ipfsHash || milestone.submissionDescription) {
                                return (
                                  <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-3">
                                    <h4 className="font-semibold text-sm flex items-center gap-2">
                                      <CheckCircle className="w-4 h-4 text-primary" />
                                      Founder's Submission
                                    </h4>
                                    
                                    {milestone.submissionDescription && (
                                      <div>
                                        <p className="text-xs text-muted-foreground mb-1">Description:</p>
                                        <p className="text-sm">{milestone.submissionDescription}</p>
                                      </div>
                                    )}
                                    
                                    {milestone.ipfsHash && (
                                      <div>
                                        <p className="text-xs text-muted-foreground mb-1">Evidence:</p>
                                        <a
                                          href={`https://ipfs.io/ipfs/${milestone.ipfsHash}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-sm text-primary hover:underline flex items-center gap-1"
                                        >
                                          View on IPFS <ExternalLink className="w-3 h-3" />
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                );
                              }
                            }
                          }
                        }
                        return null;
                      })()}

                      {/* Voting Stats */}
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-green-600 font-medium">YES</span>
                            <span className="text-green-600 font-medium">{yesPercentage.toFixed(1)}%</span>
                          </div>
                          <Progress value={yesPercentage} className="h-2 bg-red-100">
                            <div className="h-full bg-green-500 transition-all" style={{ width: `${yesPercentage}%` }} />
                          </Progress>
                        </div>
                        
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-red-600 font-medium">NO</span>
                            <span className="text-red-600 font-medium">{noPercentage.toFixed(1)}%</span>
                          </div>
                          <Progress value={noPercentage} className="h-2 bg-green-100">
                            <div className="h-full bg-red-500 transition-all" style={{ width: `${noPercentage}%` }} />
                          </Progress>
                        </div>

                        <Separator />

                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Total Votes:</span>
                          <span className="font-medium">{formatEth(BigInt(totalVotes))} IDRX</span>
                        </div>
                        
                        {isVotingActive && (
                          <div className="flex items-center gap-2 text-sm">
                            <Clock className="w-4 h-4 text-orange-500" />
                            <span className="text-orange-500 font-medium">
                              {timeRemaining > 86400 
                                ? `${Math.floor(timeRemaining / 86400)} days remaining`
                                : timeRemaining > 3600
                                ? `${Math.floor(timeRemaining / 3600)} hours remaining`
                                : `${Math.floor(timeRemaining / 60)} minutes remaining`}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Voting Buttons */}
                      {!isConnected ? (
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription className="text-xs">
                            Please select your role (Investor) to vote
                          </AlertDescription>
                        </Alert>
                      ) : hasUserVoted ? (
                        <Alert>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <AlertDescription className="text-xs">
                            You have already voted on this milestone
                          </AlertDescription>
                        </Alert>
                      ) : !isVotingActive ? (
                        <Alert>
                          <XCircle className="h-4 w-4" />
                          <AlertDescription className="text-xs">
                            Voting period has ended. Waiting for founder to finalize results.
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          <Button
                            onClick={() => handleVote(votingMilestoneIndex, true)}
                            disabled={isVoting}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {isVoting ? "Voting..." : "Vote YES"}
                          </Button>
                          <Button
                            onClick={() => handleVote(votingMilestoneIndex, false)}
                            disabled={isVoting}
                            variant="destructive"
                          >
                            {isVoting ? "Voting..." : "Vote NO"}
                          </Button>
                        </div>
                      )}

                      {/* Info about voting */}
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          Your vote is weighted by your contribution amount. Milestone requires &gt;50% YES votes to be approved.
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  </Card>
                );
              })()}

              {/* Founder Actions */}
              {isFounder && (
                <Card>
                  <CardHeader>
                    <CardTitle>Founder Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      className="w-full"
                      onClick={() => router.push(`/founder/campaign/${campaignAddress}`)}
                    >
                      Manage Project
                    </Button>
                    
                    {/* Show Start Development button when in Funding state and goal reached */}
                    {campaign.data.state === CampaignState.Funding && 
                     Number(campaign.data.totalRaised) >= Number(campaign.data.fundingGoal) && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          toast.info("Please use the Manage Campaign page to start development phase");
                          router.push(`/founder/campaign/${campaignAddress}`);
                        }}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Start Development
                      </Button>
                    )}
                    
                    {/* Show Submit Milestone button only in Development state */}
                    {campaign.data.state === CampaignState.Development && 
                     campaign.milestones[campaign.data.currentMilestone]?.state === MilestoneState.Pending && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => router.push(`/founder/campaign/${campaignAddress}/submit/${campaign.data.currentMilestone}`)}
                      >
                        Submit Milestone {campaign.data.currentMilestone}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

