"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ethers } from "ethers";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CampaignStateBadge, MilestoneStateBadge } from "@/components/campaign-state-badge";
import { useMockRole } from "@/contexts/MockRoleContext";
import { getFactoryAddress, SIMPLE_CAMPAIGN_ABI, CampaignState, MilestoneState } from "@/lib/contracts";
import { formatEth, formatPercentage, truncateAddress, formatRelativeTime } from "@/lib/web3-utils";
import { 
  ArrowLeft,
  Upload,
  Users,
  Target,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Wallet,
  Calendar,
  Edit,
  Vote,
  CheckCheck
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface MilestoneData {
  description: string;
  releasePercentage: number;
  deadline: number;
  state: MilestoneState;
}

interface CampaignData {
  title: string;
  description: string;
  founder: string;
  fundingGoal: string;
  totalRaised: string;
  state: CampaignState;
  createdAt: number;
  currentMilestone: number;
  contributors: string[];
  milestones: MilestoneData[];
}

export default function FounderCampaignPage() {
  const router = useRouter();
  const params = useParams();
  const address = params?.address as string;
  
  const { role, mockAccount, isInMockMode } = useMockRole();
  const account = mockAccount;
  const isConnected = !!role;
  const provider: any = null;

  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);

  // Role-based access control - only founders can access this page
  useEffect(() => {
    if (isConnected && role !== "founder") {
      router.push("/");
    }
  }, [isConnected, role, router]);

  useEffect(() => {
    if (address && isConnected) {
      fetchCampaignData();
    } else {
      setLoading(false);
    }
  }, [address, isConnected]);

  async function fetchCampaignData() {
    try {
      setLoading(true);

      if (isInMockMode || !provider) {
        // Load from localStorage
        const storedCampaigns = localStorage.getItem('mockCampaigns');
        if (storedCampaigns) {
          const campaigns = JSON.parse(storedCampaigns);
          const foundCampaign = campaigns.find((c: any) => c.address === address);
          
          if (foundCampaign) {
            setCampaign({
              title: foundCampaign.title,
              description: foundCampaign.description,
              founder: foundCampaign.founder,
              fundingGoal: foundCampaign.fundingGoal,
              totalRaised: foundCampaign.totalRaised,
              state: foundCampaign.state,
              createdAt: Math.floor(new Date(foundCampaign.createdAt).getTime() / 1000),
              currentMilestone: foundCampaign.currentMilestone,
              contributors: [],
              milestones: [
                { description: "Milestone 1", releasePercentage: 10, deadline: 30, state: MilestoneState.Pending },
                { description: "Milestone 2", releasePercentage: 20, deadline: 90, state: MilestoneState.Pending },
                { description: "Milestone 3", releasePercentage: 25, deadline: 150, state: MilestoneState.Pending },
                { description: "Milestone 4", releasePercentage: 25, deadline: 240, state: MilestoneState.Pending },
                { description: "Milestone 5", releasePercentage: 20, deadline: 330, state: MilestoneState.Pending },
              ],
            });
          }
        }
        setLoading(false);
        return;
      }

      // Real Web3 mode
      // Validate and normalize the address to prevent ENS resolution
      const validatedAddress = ethers.getAddress(address);
      const campaignContract = new ethers.Contract(validatedAddress, SIMPLE_CAMPAIGN_ABI, provider);
      const data = await campaignContract.getCampaignData();
      const currentMilestone = Number(await campaignContract.currentMilestone());
      const contributors = await campaignContract.getContributors();

      const milestones: MilestoneData[] = [];
      for (let i = 0; i < 5; i++) {
        const milestone = await campaignContract.getMilestone(i);
        milestones.push({
          description: milestone.description,
          releasePercentage: Number(milestone.releasePercentage),
          deadline: Number(milestone.deadline),
          state: Number(milestone.state) as MilestoneState,
        });
      }

      setCampaign({
        title: data.title,
        description: data.description,
        founder: data.founder,
        fundingGoal: formatEth(data.fundingGoal),
        totalRaised: formatEth(data.totalRaised),
        state: Number(data.state) as CampaignState,
        createdAt: Number(data.createdAt),
        currentMilestone,
        contributors,
        milestones,
      });
      setLoading(false);
    } catch (err) {
      console.error("Error fetching campaign data:", err);
      setLoading(false);
    }
  }

  async function handleStartDevelopment() {
    try {
      setIsStarting(true);

      if (isInMockMode || !provider) {
        // Mock mode - update campaign state in localStorage
        toast.info("Starting development phase...");
        const storedCampaigns = localStorage.getItem('mockCampaigns');
        if (storedCampaigns) {
          const campaigns = JSON.parse(storedCampaigns);
          const campaignIndex = campaigns.findIndex((c: any) => c.address === address);
          
          if (campaignIndex !== -1) {
            campaigns[campaignIndex].state = CampaignState.Development;
            campaigns[campaignIndex].currentMilestone = 0;
            localStorage.setItem('mockCampaigns', JSON.stringify(campaigns));
            
            toast.success("Development phase started! 🚀");
            // Refresh campaign data
            await fetchCampaignData();
          }
        }
        setIsStarting(false);
        return;
      }

      // Real Web3 mode - call smart contract
      toast.info("Please confirm the transaction in your wallet...");
      const validatedAddress = ethers.getAddress(address);
      const signer = await provider.getSigner();
      const campaignContract = new ethers.Contract(validatedAddress, SIMPLE_CAMPAIGN_ABI, signer);
      
      const tx = await campaignContract.startDevelopment();
      toast.info("Transaction submitted. Waiting for confirmation...");
      await tx.wait();
      
      toast.success("Development phase started! 🚀");
      // Refresh campaign data
      await fetchCampaignData();
      setIsStarting(false);
    } catch (err: any) {
      console.error("Error starting development phase:", err);
      toast.error(err.message || "Failed to start development phase");
      setIsStarting(false);
    }
  }

  async function handleSubmitMilestone(milestoneIndex: number) {
    try {
      setIsSubmitting(true);

      if (isInMockMode || !provider) {
        // Mock mode - update milestone state in localStorage
        toast.info("Submitting milestone for voting...");
        const storedCampaigns = localStorage.getItem('mockCampaigns');
        if (storedCampaigns) {
          const campaigns = JSON.parse(storedCampaigns);
          const campaignIndex = campaigns.findIndex((c: any) => c.address === address);
          
          if (campaignIndex !== -1) {
            // Initialize milestones array if not exists
            if (!campaigns[campaignIndex].milestones) {
              campaigns[campaignIndex].milestones = [{}, {}, {}];
            }
            
            // Set milestone as submitted with voting deadline (7 days from now)
            const now = Math.floor(Date.now() / 1000);
            campaigns[campaignIndex].milestones[milestoneIndex] = {
              ...campaigns[campaignIndex].milestones[milestoneIndex],
              state: MilestoneState.Submitted,
              submittedAt: now,
              votingDeadline: now + (7 * 24 * 60 * 60), // 7 days
              yesVotes: 0,
              noVotes: 0,
              voters: []
            };
            
            localStorage.setItem('mockCampaigns', JSON.stringify(campaigns));
            
            toast.success("Milestone submitted! Voting period has started (7 days). 🗳️");
            // Refresh campaign data
            await fetchCampaignData();
          }
        }
        setIsSubmitting(false);
        return;
      }

      // Real Web3 mode - call smart contract
      toast.info("Please confirm the transaction in your wallet...");
      const validatedAddress = ethers.getAddress(address);
      const signer = await provider.getSigner();
      const campaignContract = new ethers.Contract(validatedAddress, SIMPLE_CAMPAIGN_ABI, signer);
      
      const tx = await campaignContract.submitMilestone(milestoneIndex);
      toast.info("Transaction submitted. Waiting for confirmation...");
      await tx.wait();
      
      toast.success("Milestone submitted! Voting period has started (7 days). 🗳️");
      // Refresh campaign data
      await fetchCampaignData();
      setIsSubmitting(false);
    } catch (err: any) {
      console.error("Error submitting milestone:", err);
      toast.error(err.message || "Failed to submit milestone");
      setIsSubmitting(false);
    }
  }

  async function handleFinalizeVoting(milestoneIndex: number) {
    try {
      setIsFinalizing(true);

      if (isInMockMode || !provider) {
        // Mock mode - finalize voting in localStorage
        toast.info("Finalizing voting...");
        const storedCampaigns = localStorage.getItem('mockCampaigns');
        if (storedCampaigns) {
          const campaigns = JSON.parse(storedCampaigns);
          const campaignIndex = campaigns.findIndex((c: any) => c.address === address);
          
          if (campaignIndex !== -1) {
            const milestone = campaigns[campaignIndex].milestones[milestoneIndex];
            const totalVotes = (parseFloat(milestone.yesVotes) || 0) + (parseFloat(milestone.noVotes) || 0);
            const yesPercentage = totalVotes > 0 ? ((parseFloat(milestone.yesVotes) || 0) / totalVotes) * 100 : 0;
            
            // Check if approved (>50% YES votes)
            if (yesPercentage > 50) {
              // Milestone approved - mark as completed and move to next
              milestone.state = MilestoneState.Completed;
              campaigns[campaignIndex].currentMilestone = milestoneIndex + 1;
              
              toast.success("Milestone approved and completed! Funds released. 💰");
              
              // Check if all milestones completed
              if (campaigns[campaignIndex].currentMilestone >= 3) {
                campaigns[campaignIndex].state = CampaignState.Completed;
                toast.success("All milestones completed! Campaign finished. 🎉");
              }
            } else {
              // Milestone rejected - reset to Pending for resubmission
              milestone.state = MilestoneState.Pending;
              milestone.yesVotes = 0;
              milestone.noVotes = 0;
              milestone.voters = [];
              
              toast.error("Milestone rejected. Please improve and resubmit. ❌");
            }
            
            localStorage.setItem('mockCampaigns', JSON.stringify(campaigns));
            
            // Refresh campaign data
            await fetchCampaignData();
          }
        }
        setIsFinalizing(false);
        return;
      }

      // Real Web3 mode - call smart contract
      toast.info("Please confirm the transaction in your wallet...");
      const validatedAddress = ethers.getAddress(address);
      const signer = await provider.getSigner();
      const campaignContract = new ethers.Contract(validatedAddress, SIMPLE_CAMPAIGN_ABI, signer);
      
      const tx = await campaignContract.finalizeVoting(milestoneIndex);
      toast.info("Transaction submitted. Waiting for confirmation...");
      await tx.wait();
      
      toast.success("Voting finalized! Check the results.");
      // Refresh campaign data
      await fetchCampaignData();
      setIsFinalizing(false);
    } catch (err: any) {
      console.error("Error finalizing voting:", err);
      toast.error(err.message || "Failed to finalize voting");
      setIsFinalizing(false);
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
                Connect your wallet to manage your campaign
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Please connect your wallet using the button in the header.
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-muted rounded w-1/3" />
              <div className="h-24 bg-muted rounded" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="h-32 bg-muted rounded" />
                <div className="h-32 bg-muted rounded" />
                <div className="h-32 bg-muted rounded" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!campaign) {
    return (
      <>
        <Header />
        <main className="relative min-h-screen flex items-center justify-center">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Campaign Not Found</CardTitle>
              <CardDescription>
                The campaign you're looking for doesn't exist
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push("/my-campaigns")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to My Campaigns
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </>
    );
  }

  const progress = campaign.fundingGoal !== "0" 
    ? (parseFloat(campaign.totalRaised) / parseFloat(campaign.fundingGoal)) * 100 
    : 0;

  const completedMilestones = campaign.milestones.filter(
    m => m.state === MilestoneState.Completed
  ).length;

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
            <Button
              variant="ghost"
              onClick={() => router.push("/my-campaigns")}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to My Campaigns
            </Button>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-4xl font-bold">{campaign.title}</h1>
                  <CampaignStateBadge state={campaign.state} />
                </div>
                <p className="text-muted-foreground">{campaign.description}</p>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Raised</p>
                    <p className="text-2xl font-bold">{campaign.totalRaised} ETH</p>
                    <p className="text-xs text-muted-foreground">
                      of {campaign.fundingGoal} ETH
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Progress</p>
                    <p className="text-2xl font-bold">{formatPercentage(progress)}</p>
                    <p className="text-xs text-muted-foreground">funded</p>
                  </div>
                  <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                    <Target className="w-6 h-6 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Contributors</p>
                    <p className="text-2xl font-bold">{campaign.contributors.length}</p>
                    <p className="text-xs text-muted-foreground">backers</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Milestones</p>
                    <p className="text-2xl font-bold">
                      {completedMilestones}/{campaign.milestones.length}
                    </p>
                    <p className="text-xs text-muted-foreground">completed</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-purple-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Campaign Stage Progress */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Campaign Stage</CardTitle>
              <CardDescription>
                Track your campaign's progress through each stage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Stage Timeline */}
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col items-center gap-2">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${
                        campaign.state >= CampaignState.Funding 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        1
                      </div>
                      <span className="text-sm font-medium">Funding</span>
                      {campaign.state === CampaignState.Funding && (
                        <Badge variant="outline" className="text-xs">Current</Badge>
                      )}
                    </div>
                    
                    <div className={`flex-1 h-1 mx-4 ${
                      campaign.state >= CampaignState.Development 
                        ? 'bg-primary' 
                        : 'bg-muted'
                    }`} />
                    
                    <div className="flex flex-col items-center gap-2">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${
                        campaign.state >= CampaignState.Development 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        2
                      </div>
                      <span className="text-sm font-medium">Development</span>
                      {campaign.state === CampaignState.Development && (
                        <Badge variant="outline" className="text-xs">Current</Badge>
                      )}
                    </div>
                    
                    <div className={`flex-1 h-1 mx-4 ${
                      campaign.state >= CampaignState.Completed 
                        ? 'bg-primary' 
                        : 'bg-muted'
                    }`} />
                    
                    <div className="flex flex-col items-center gap-2">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${
                        campaign.state >= CampaignState.Completed 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        3
                      </div>
                      <span className="text-sm font-medium">Completed</span>
                      {campaign.state === CampaignState.Completed && (
                        <Badge variant="outline" className="text-xs">Current</Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Funding Progress Bar */}
                {campaign.state === CampaignState.Funding && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Funding Progress</span>
                      <span className="font-semibold">
                        {campaign.totalRaised} / {campaign.fundingGoal} ETH
                      </span>
                    </div>
                    <Progress value={progress} className="h-3" />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{formatPercentage(progress)} funded</span>
                      <span>{campaign.contributors.length} contributors</span>
                    </div>
                  </div>
                )}

                {/* Action Button for Stage Transition */}
                {campaign.state === CampaignState.Funding && progress >= 100 && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      <p className="font-semibold mb-1">Funding Goal Reached! 🎉</p>
                      <p className="text-sm">You can now start the development phase and begin working on milestones. Use the "Start Development Phase" button in the Quick Actions section below.</p>
                    </AlertDescription>
                  </Alert>
                )}

                {campaign.state === CampaignState.Development && (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <p className="font-semibold mb-1">Development Phase Active</p>
                      <p className="text-sm">Complete and submit milestones to release funds. Current milestone: {campaign.currentMilestone}/{campaign.milestones.length}</p>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Milestones */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Milestones</CardTitle>
                  <CardDescription>
                    Track and submit your project milestones
                  </CardDescription>
                </div>
                {campaign.state === CampaignState.Development && campaign.currentMilestone <= campaign.milestones.length && (
                  <Button asChild>
                    <Link href={`/founder/campaign/${address}/submit/${campaign.currentMilestone}`}>
                      <Upload className="w-4 h-4 mr-2" />
                      Submit Milestone {campaign.currentMilestone}
                    </Link>
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {campaign.milestones.map((milestone, index) => {
                  const isCurrent = index === campaign.currentMilestone;
                  const isPending = milestone.state === MilestoneState.Pending;
                  const isSubmitted = milestone.state === MilestoneState.Submitted;
                  const isCompleted = milestone.state === MilestoneState.Completed;
                  
                  return (
                    <div
                      key={index}
                      className={`p-4 border rounded-lg ${
                        isCurrent ? "border-primary bg-primary/5" : ""
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold flex-shrink-0">
                          M{index}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold">{milestone.description}</h4>
                            <MilestoneStateBadge state={milestone.state} />
                            {isCurrent && (
                              <Badge variant="outline" className="text-xs">
                                Current
                              </Badge>
                            )}
                          </div>
                          <div className="flex gap-6 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Target className="w-4 h-4" />
                              <span>Release: {milestone.releasePercentage}%</span>
                            </div>
                            {milestone.deadline && (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>Deadline: {milestone.deadline} days</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Action buttons based on milestone state */}
                        <div className="flex flex-col gap-2">
                          {isCurrent && isPending && campaign.state === CampaignState.Development && (
                            <Button 
                              size="sm"
                              onClick={() => handleSubmitMilestone(index)}
                              disabled={isSubmitting}
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              {isSubmitting ? "Submitting..." : "Submit"}
                            </Button>
                          )}
                          
                          {isSubmitted && isCurrent && (
                            <>
                              <Badge variant="secondary" className="text-xs">
                                <Vote className="w-3 h-3 mr-1" />
                                Voting Active
                              </Badge>
                              <Button 
                                size="sm"
                                variant="outline"
                                onClick={() => handleFinalizeVoting(index)}
                                disabled={isFinalizing}
                              >
                                <CheckCheck className="w-4 h-4 mr-2" />
                                {isFinalizing ? "Finalizing..." : "Finalize"}
                              </Button>
                            </>
                          )}
                          
                          {isCompleted && (
                            <Badge variant="default" className="text-xs">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Completed
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Campaign Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Campaign Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Contract Address:</span>
                  <span className="font-mono">{truncateAddress(address)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Founder:</span>
                  <span className="font-mono">{truncateAddress(campaign.founder)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created:</span>
                  <span>{formatRelativeTime(campaign.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Milestone:</span>
                  <span className="font-semibold">
                    {campaign.currentMilestone} of {campaign.milestones.length}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href={`/campaign/${address}`}>
                    <BarChart3 className="w-4 h-4 mr-2" />
                    View Public Campaign Page
                  </Link>
                </Button>
                {campaign.state === CampaignState.Funding && progress >= 100 && (
                  <Button 
                    className="w-full justify-start"
                    onClick={handleStartDevelopment}
                    disabled={isStarting}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {isStarting ? "Starting..." : "Start Development Phase"}
                  </Button>
                )}
                {campaign.state === CampaignState.Development && campaign.currentMilestone < campaign.milestones.length && (
                  <>
                    {campaign.milestones[campaign.currentMilestone]?.state === MilestoneState.Pending && (
                      <Button 
                        className="w-full justify-start"
                        onClick={() => handleSubmitMilestone(campaign.currentMilestone)}
                        disabled={isSubmitting}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {isSubmitting ? "Submitting..." : `Submit Milestone ${campaign.currentMilestone}`}
                      </Button>
                    )}
                    {campaign.milestones[campaign.currentMilestone]?.state === MilestoneState.Submitted && (
                      <Button 
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => handleFinalizeVoting(campaign.currentMilestone)}
                        disabled={isFinalizing}
                      >
                        <CheckCheck className="w-4 h-4 mr-2" />
                        {isFinalizing ? "Finalizing..." : `Finalize Voting ${campaign.currentMilestone}`}
                      </Button>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

