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

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [campaignData, setCampaignData] = useState<any>(null);
  const [milestoneData, setMilestoneData] = useState<any>(null);

  // Form state
  const [ipfsHash, setIpfsHash] = useState("");
  const [description, setDescription] = useState("");
  const [fileUploading, setFileUploading] = useState(false);

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
    if (!signer) return;

    try {
      setLoading(true);

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

    } catch (err: any) {
      console.error("Error fetching data:", err);
      toast.error(err.message || "Failed to load milestone data");
    } finally {
      setLoading(false);
    }
  }

  const handleSubmit = async () => {
    if (!signer || !campaignData || !milestoneData) return;

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
      toast.info("Please confirm the transaction in your wallet...");

      // Validate and normalize the address to prevent ENS resolution
      const validatedAddress = ethers.getAddress(campaignAddress);
      const campaign = new ethers.Contract(validatedAddress, SIMPLE_CAMPAIGN_ABI, signer);

      const tx = await campaign.submitMilestone(milestoneIndex, ipfsHash.trim(), description.trim());

      toast.info("Transaction submitted. Submitting milestone...");
      await tx.wait();

      toast.success("Milestone submitted successfully! 🎉 Voting period has started.");

      // Redirect to campaign management page
      router.push(`/founder/campaign/${campaignAddress}`);

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

  const releaseAmount = (Number(campaignData.totalCommitted) * milestoneData.releasePercentage) / 100;
  const deadline = Number(milestoneData.deadline);
  const isBeforeDeadline = Date.now() / 1000 < deadline;
  const daysRemaining = Math.max(0, Math.floor((deadline - Date.now() / 1000) / (24 * 60 * 60)));

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
              {/* Deadline Warning */}
              {!isBeforeDeadline && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Deadline has passed! Submitting late may result in campaign failure.
                  </AlertDescription>
                </Alert>
              )}

              {isBeforeDeadline && daysRemaining <= 7 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Only {daysRemaining} days remaining until deadline!
                  </AlertDescription>
                </Alert>
              )}

              {/* Upload Form */}
              <Card>
                <CardHeader>
                  <CardTitle>Evidence Upload</CardTitle>
                  <CardDescription>
                    Upload your milestone deliverables to IPFS
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
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
                  <div className="space-y-2">
                    <Label htmlFor="description">
                      Description <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Describe what was completed, key features delivered, and any additional notes for voters..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={8}
                      maxLength={500}
                    />
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">
                        Minimum 10 characters
                      </span>
                      <span className="text-muted-foreground">
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
                        <p className="text-xs text-muted-foreground">Click "Test IPFS Link" to verify</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className={`w-5 h-5 flex-shrink-0 ${description.length >= 10 ? "text-green-500" : "text-muted-foreground"}`} />
                      <div>
                        <p className="text-sm font-medium">Description provided</p>
                        <p className="text-xs text-muted-foreground">Explain what was delivered</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className={`w-5 h-5 flex-shrink-0 ${isBeforeDeadline ? "text-green-500" : "text-red-500"}`} />
                      <div>
                        <p className="text-sm font-medium">Before deadline</p>
                        <p className="text-xs text-muted-foreground">
                          {isBeforeDeadline ? `${daysRemaining} days remaining` : "Deadline exceeded"}
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
                    <p className="text-sm text-muted-foreground mb-1">Description</p>
                    <p className="text-sm font-medium">{milestoneData.description}</p>
                  </div>

                  <Separator />

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Release %</span>
                      <span className="font-medium">{milestoneData.releasePercentage}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Potential Release</span>
                      <span className="font-medium">{formatEth(releaseAmount)} ETH</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Deadline</span>
                      <span className="font-medium">{formatDate(deadline)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Days Remaining</span>
                      <span className={`font-medium ${daysRemaining <= 7 ? "text-orange-500" : ""}`}>
                        {isBeforeDeadline ? daysRemaining : 0} days
                      </span>
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
                  After submission, contributors will have 7 days to vote. You need at least 60% YES votes to approve this milestone.
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

