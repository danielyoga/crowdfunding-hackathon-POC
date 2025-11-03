"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ethers } from "ethers";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useMockRole } from "@/contexts/MockRoleContext";
import { SIMPLE_CAMPAIGN_ABI } from "@/lib/contracts";
import { LoadingState } from "@/components/loading-state";
import { ErrorState } from "@/components/error-state";
import { 
  ArrowLeft, 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  ExternalLink,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { formatDate, formatEth } from "@/lib/web3-utils";

export default function SubmitMilestonePage() {
  const params = useParams();
  const router = useRouter();
  const { role, mockAccount, isInMockMode } = useMockRole();
  const account = mockAccount;
  const isConnected = !!role;
  const signer = null; // No signer needed in mock mode

  const campaignAddress = params.address as string;
  const milestoneIndex = parseInt(params.milestoneIndex as string);

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [campaignData, setCampaignData] = useState<any>(null);
  const [milestoneData, setMilestoneData] = useState<any>(null);

  // Form state
  const [ipfsHash, setIpfsHash] = useState("");
  const [description, setDescription] = useState("");
  const [fileUploading, setFileUploading] = useState(false);

  // Set mounted state to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Role-based access control - only founders can access this page
  useEffect(() => {
    if (isConnected && role !== "founder") {
      router.push("/");
    }
  }, [isConnected, role, router]);

  useEffect(() => {
    if (isConnected && account) {
      fetchData();
    }
  }, [isConnected, account, campaignAddress, milestoneIndex]);

  async function fetchData() {
    try {
      setLoading(true);

      if (isInMockMode) {
        // Mock mode - load from localStorage
        const storedCampaigns = localStorage.getItem('mockCampaigns');
        if (!storedCampaigns) {
          toast.error("No campaigns found");
          setLoading(false);
          return;
        }

        const campaigns = JSON.parse(storedCampaigns);
        const foundCampaign = campaigns.find((c: any) => c.address === campaignAddress);
        
        if (!foundCampaign) {
          toast.error("Campaign not found");
          setLoading(false);
          return;
        }

        // Verify founder
        if (foundCampaign.founder.toLowerCase() !== account?.toLowerCase()) {
          toast.error("Only the campaign founder can submit milestones");
          setLoading(false);
          return;
        }

        // Verify milestone index
        if (milestoneIndex !== foundCampaign.currentMilestone) {
          toast.error("Can only submit the current milestone");
          setLoading(false);
          return;
        }

        // Create mock campaign data
        setCampaignData({
          title: foundCampaign.title,
          description: foundCampaign.description,
          founder: foundCampaign.founder,
          fundingGoal: ethers.parseEther(foundCampaign.fundingGoal),
          totalRaised: ethers.parseEther(foundCampaign.totalRaised),
          totalCommitted: ethers.parseEther(foundCampaign.totalRaised),
          state: foundCampaign.state,
          createdAt: Math.floor(new Date(foundCampaign.createdAt).getTime() / 1000),
        });

        // Create mock milestone data (SimpleCampaign has 3 milestones with equal distribution)
        const releasePercentages = [3333, 3333, 3334]; // 33.33%, 33.33%, 33.34% in basis points
        setMilestoneData({
          description: `Milestone ${milestoneIndex}`,
          releasePercentage: releasePercentages[milestoneIndex],
          state: foundCampaign.milestones && foundCampaign.milestones[milestoneIndex] 
            ? foundCampaign.milestones[milestoneIndex].state 
            : 0,
          submittedAt: 0,
          votingDeadline: 0,
          yesVotes: 0,
          noVotes: 0,
        });

      } else {
        // Real Web3 mode
        if (!signer) {
          setLoading(false);
          return;
        }

        // Validate and normalize the address to prevent ENS resolution
        const validatedAddress = ethers.getAddress(campaignAddress);
        const campaign = new ethers.Contract(validatedAddress, SIMPLE_CAMPAIGN_ABI, signer);

        // Fetch campaign and milestone data
        const data = await campaign.getCampaignData();
        const milestone = await campaign.getMilestone(milestoneIndex);
        const currentMilestone = Number(await campaign.currentMilestone());

        // Verify founder
        if (data.founder.toLowerCase() !== account?.toLowerCase()) {
          throw new Error("Only the campaign founder can submit milestones");
        }

        // Verify milestone index
        if (milestoneIndex !== currentMilestone) {
          throw new Error("Can only submit the current milestone");
        }

        setCampaignData(data);
        setMilestoneData(milestone);
      }

    } catch (err: any) {
      console.error("Error fetching data:", err);
      toast.error(err.message || "Failed to load milestone data");
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async () => {
    if (!campaignData || !milestoneData) return;

    // Validation
    if (!ipfsHash || ipfsHash.trim() === "") {
      toast.error("Please provide an IPFS hash");
      return;
    }

    if (!description || description.trim().length < 10) {
      toast.error("Please provide a detailed description (min 10 characters)");
      return;
    }

    try {
      setSubmitting(true);

      if (isInMockMode) {
        // Mock mode - update milestone in localStorage
        toast.info("Submitting milestone for voting...");
        
        // Simulate async operation
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const storedCampaigns = localStorage.getItem('mockCampaigns');
        if (storedCampaigns) {
          const campaigns = JSON.parse(storedCampaigns);
          const campaignIndex = campaigns.findIndex((c: any) => c.address === campaignAddress);
          
          if (campaignIndex !== -1) {
            // Initialize milestones array if not exists
            if (!campaigns[campaignIndex].milestones) {
              campaigns[campaignIndex].milestones = [{}, {}, {}];
            }
            
            // Set milestone as submitted with voting deadline (7 days from now)
            const now = Math.floor(Date.now() / 1000);
            campaigns[campaignIndex].milestones[milestoneIndex] = {
              state: 1, // MilestoneState.Submitted
              submittedAt: now,
              votingDeadline: now + (7 * 24 * 60 * 60), // 7 days
              yesVotes: 0,
              noVotes: 0,
              voters: [],
              ipfsHash: ipfsHash.trim(),
              submissionDescription: description.trim(),
            };
            
            localStorage.setItem('mockCampaigns', JSON.stringify(campaigns));
            
            toast.success("Milestone submitted successfully! 🎉 Voting period has started (7 days).");
            
            // Redirect to campaign management page
            router.push(`/founder/campaign/${campaignAddress}`);
          }
        }
        
      } else {
        // Real Web3 mode
        if (!signer) {
          toast.error("Wallet not connected");
          return;
        }

        toast.info("Please confirm the transaction in your wallet...");

        // Validate and normalize the address to prevent ENS resolution
        const validatedAddress = ethers.getAddress(campaignAddress);
        const campaign = new ethers.Contract(validatedAddress, SIMPLE_CAMPAIGN_ABI, signer);

        // SimpleCampaign.submitMilestone() only takes milestoneId
        // Store IPFS hash and description separately (e.g., in an event or off-chain)
        const tx = await campaign.submitMilestone(milestoneIndex);

        toast.info("Transaction submitted. Submitting milestone...");
        await tx.wait();

        toast.success("Milestone submitted successfully! 🎉 Voting period has started.");

        // Redirect to campaign management page
        router.push(`/founder/campaign/${campaignAddress}`);
      }

    } catch (err: any) {
      console.error("Error submitting milestone:", err);
      toast.error(err.message || "Failed to submit milestone");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // File size check (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      toast.error("File size must be less than 100MB");
      return;
    }

    try {
      setFileUploading(true);
      toast.info("Uploading to IPFS...");

      // TODO: Implement actual IPFS upload
      // For now, simulate upload
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock IPFS hash (in production, this would come from actual IPFS upload)
      const mockHash = "Qm" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      setIpfsHash(mockHash);
      
      toast.success("File uploaded to IPFS!");
      toast.info("Note: This is a mock upload. Implement actual IPFS integration for production.");

    } catch (err: any) {
      console.error("Error uploading file:", err);
      toast.error("Failed to upload file to IPFS");
    } finally {
      setFileUploading(false);
    }
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <>
        <Header />
        <main className="relative min-h-screen">
          <LoadingState message="Loading..." />
        </main>
        <Footer />
      </>
    );
  }

  if (!isConnected) {
    return (
      <>
        <Header />
        <main className="relative min-h-screen flex items-center justify-center">
          <ErrorState
            title="Wallet Not Connected"
            message="Please connect your wallet to submit milestones"
          />
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
          <LoadingState message="Loading milestone data..." />
        </main>
        <Footer />
      </>
    );
  }

  if (!campaignData || !milestoneData) {
    return (
      <>
        <Header />
        <main className="relative min-h-screen">
          <ErrorState
            title="Milestone Not Found"
            message="Unable to load milestone data. Please try again."
            onRetry={fetchData}
          />
        </main>
        <Footer />
      </>
    );
  }

  const releaseAmount = ((Number(campaignData.totalCommitted) * milestoneData.releasePercentage) / 10000).toString();

  return (
    <>
      <Header />
      <main className="relative min-h-screen">
        {/* Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 right-10 w-96 h-96 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-purple-600/20 to-indigo-700/20 rounded-full blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => router.push(`/founder/campaign/${campaignAddress}`)}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Campaign
            </Button>
            <h1 className="text-4xl font-bold mb-2">Submit Milestone {milestoneIndex}</h1>
            <p className="text-muted-foreground">
              Upload evidence and submit for community voting
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Important Information */}
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-semibold mb-1">Submission Guidelines</p>
                  <p className="text-sm">
                    Submit proof of your work (IPFS hash) and a detailed description. 
                    Once submitted, investors will have 7 days to vote on your milestone.
                  </p>
                </AlertDescription>
              </Alert>

              {/* Upload Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Evidence Upload</CardTitle>
                  <CardDescription>
                    Upload your milestone deliverables to IPFS for permanent, decentralized storage
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Examples of what to submit */}
                  <Alert>
                    <Upload className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      <p className="font-semibold mb-1">Examples of Evidence:</p>
                      <ul className="space-y-0.5 list-disc list-inside">
                        <li>Screenshots or demo videos of your work</li>
                        <li>Source code (ZIP file) or GitHub repository link</li>
                        <li>Documentation (PDF, Markdown)</li>
                        <li>Design files or prototypes</li>
                        <li>Test results or performance metrics</li>
                      </ul>
                    </AlertDescription>
                  </Alert>

                  {/* File Upload */}
                  <div className="space-y-3">
                    <Label>Upload File to IPFS</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
                      <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        onChange={handleFileUpload}
                        disabled={fileUploading}
                      />
                      <label 
                        htmlFor="file-upload"
                        className="cursor-pointer flex flex-col items-center gap-3"
                      >
                        {fileUploading ? (
                          <>
                            <Loader2 className="w-12 h-12 text-primary animate-spin" />
                            <p className="text-sm text-muted-foreground">Uploading to IPFS...</p>
                          </>
                        ) : (
                          <>
                            <Upload className="w-12 h-12 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">Drop files or click to upload</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Images, PDFs, ZIP files (max 100MB)
                              </p>
                            </div>
                          </>
                        )}
                      </label>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      💡 Tip: Compress multiple files into a ZIP to keep everything organized
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <Separator className="flex-1" />
                    <span className="text-sm text-muted-foreground">OR</span>
                    <Separator className="flex-1" />
                  </div>

                  {/* Manual IPFS Hash */}
                  <div className="space-y-2">
                    <Label htmlFor="ipfsHash">
                      IPFS Hash <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="ipfsHash"
                      placeholder="Qm..."
                      value={ipfsHash}
                      onChange={(e) => setIpfsHash(e.target.value)}
                      disabled={fileUploading}
                    />
                    <p className="text-xs text-muted-foreground">
                      Paste your IPFS hash if you've already uploaded your evidence
                    </p>
                  </div>

                  {/* Test IPFS Link */}
                  {ipfsHash && (
                    <div>
                      <a
                        href={`https://ipfs.io/ipfs/${ipfsHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                      >
                        Test IPFS Link <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle>Submission Description</CardTitle>
                  <CardDescription>
                    Explain what you've delivered for this milestone
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Helpful tips */}
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      <p className="font-semibold mb-1">What to include:</p>
                      <ul className="space-y-0.5 list-disc list-inside">
                        <li>Summary of completed work</li>
                        <li>Key features or deliverables</li>
                        <li>How to access/verify your work</li>
                        <li>Any challenges overcome</li>
                        <li>Next steps (if applicable)</li>
                      </ul>
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <Label htmlFor="description">
                      Description <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Example: I have successfully completed the initial prototype development. The key features include user authentication, database integration, and responsive UI. You can verify the work by accessing the IPFS link above. The prototype is fully functional and ready for testing. Next milestone will focus on adding advanced features and optimizations."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={10}
                      maxLength={500}
                    />
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">
                        Minimum 10 characters
                      </span>
                      <span className={`${description.length >= 500 ? "text-red-500" : "text-muted-foreground"}`}>
                        {description.length}/500
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Submission Checklist */}
              <Card>
                <CardHeader>
                  <CardTitle>Submission Checklist</CardTitle>
                  <CardDescription>
                    Make sure you complete all requirements before submitting
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <CheckCircle className={`w-5 h-5 flex-shrink-0 ${ipfsHash ? "text-green-500" : "text-muted-foreground"}`} />
                      <div>
                        <p className="text-sm font-medium">Evidence uploaded to IPFS</p>
                        <p className="text-xs text-muted-foreground">Upload your deliverables and get IPFS hash</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className={`w-5 h-5 flex-shrink-0 ${ipfsHash ? "text-green-500" : "text-muted-foreground"}`} />
                      <div>
                        <p className="text-sm font-medium">IPFS link is working and accessible</p>
                        <p className="text-xs text-muted-foreground">Click "Test IPFS Link" above to verify</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className={`w-5 h-5 flex-shrink-0 ${description.length >= 10 ? "text-green-500" : "text-muted-foreground"}`} />
                      <div>
                        <p className="text-sm font-medium">Detailed description provided</p>
                        <p className="text-xs text-muted-foreground">Minimum 10 characters explaining your work</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className={`w-5 h-5 flex-shrink-0 ${(ipfsHash && description.length >= 10) ? "text-green-500" : "text-muted-foreground"}`} />
                      <div>
                        <p className="text-sm font-medium">Ready for community voting</p>
                        <p className="text-xs text-muted-foreground">
                          All requirements met for submission
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Submit Button */}
              <Card>
                <CardContent className="pt-6">
                  <Alert className="mb-4">
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Once submitted, a 7-day voting period will begin. Investors will review your evidence and vote YES or NO.
                    </AlertDescription>
                  </Alert>

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleSubmit}
                    disabled={submitting || !ipfsHash || description.length < 10}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Submit for Voting
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Milestone Info */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Milestone Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Milestone</p>
                    <p className="text-sm font-medium">{milestoneData.description}</p>
                  </div>

                  <Separator />

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Release %</span>
                      <span className="font-medium">{(milestoneData.releasePercentage / 100).toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Potential Release</span>
                      <span className="font-medium">{formatEth(releaseAmount)} ETH</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Voting Period</span>
                      <span className="font-medium">7 days</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Approval Threshold</span>
                      <span className="font-medium">&gt;50% YES</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Campaign Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Title</span>
                    <span className="font-medium text-right">{campaignData.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Raised</span>
                    <span className="font-medium">{formatEth(campaignData.totalRaised)} ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Committed Pool</span>
                    <span className="font-medium">{formatEth(campaignData.totalCommitted)} ETH</span>
                  </div>
                </CardContent>
              </Card>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <p className="font-semibold mb-1">What happens next?</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Contributors have 7 days to vote on your submission</li>
                    <li>Votes are weighted by contribution amount</li>
                    <li>Need &gt;50% YES votes to approve</li>
                    <li>After voting ends, finalize to release funds</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

