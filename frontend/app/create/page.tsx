"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ethers } from "ethers";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useMockRole } from "@/contexts/MockRoleContext";
import { getFactoryAddress, SIMPLE_FACTORY_ABI } from "@/lib/contracts";
import { CreateCampaignFormData, MilestoneFormData } from "@/lib/types";
import { validateEthAmount, formatEth, parseEthInput, generateMockAddress } from "@/lib/web3-utils";
import { 
  AlertCircle, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  Info,
  PlusCircle,
  Target,
  Calendar,
  Percent
} from "lucide-react";
import { toast } from "sonner";

const MILESTONE_PRESETS = {
  standard: [
    { percentage: 10, days: 30 },
    { percentage: 20, days: 90 },
    { percentage: 25, days: 150 },
    { percentage: 25, days: 240 },
    { percentage: 20, days: 330 },
  ],
  conservative: [
    { percentage: 5, days: 30 },
    { percentage: 15, days: 90 },
    { percentage: 20, days: 150 },
    { percentage: 30, days: 240 },
    { percentage: 30, days: 330 },
  ],
  aggressive: [
    { percentage: 25, days: 30 },
    { percentage: 25, days: 90 },
    { percentage: 20, days: 150 },
    { percentage: 15, days: 240 },
    { percentage: 15, days: 330 },
  ],
};

export default function CreateCampaignPage() {
  const router = useRouter();
  const { role, mockAccount, isInMockMode } = useMockRole();
  const account = mockAccount;
  const isConnected = !!role;
  const chainId = 84532; // Base Sepolia for mock mode
  const signer = null; // No signer needed in mock mode

  const [step, setStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);

  // Role-based access control - only founders can access this page
  useEffect(() => {
    if (isConnected && role !== "founder") {
      router.push("/");
    }
  }, [isConnected, role, router]);

  // Form data
  const [formData, setFormData] = useState<CreateCampaignFormData>({
    title: "",
    description: "",
    fundingGoal: "",
    milestones: Array(5).fill(null).map(() => ({
      description: "",
      releasePercentage: 0,
      deadline: 0,
    })),
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validation for Step 1
  const validateStep1 = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.title.length < 3 || formData.title.length > 100) {
      newErrors.title = "Title must be 3-100 characters";
    }

    if (formData.description.length < 1 || formData.description.length > 1000) {
      newErrors.description = "Description must be 1-1000 characters";
    }

    const goalValidation = validateEthAmount(
      formData.fundingGoal,
      ethers.parseEther("0.01"),
      ethers.parseEther("10000")
    );
    if (!goalValidation.isValid) {
      newErrors.fundingGoal = goalValidation.error || "Invalid funding goal";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validation for Step 2
  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Check each milestone
    formData.milestones.forEach((milestone, index) => {
      if (!milestone.description || milestone.description.length < 3) {
        newErrors[`milestone${index}Description`] = "Description required (min 3 chars)";
      }
      if (milestone.description.length > 200) {
        newErrors[`milestone${index}Description`] = "Description too long (max 200 chars)";
      }
      if (milestone.releasePercentage < 5 || milestone.releasePercentage > 50) {
        newErrors[`milestone${index}Percentage`] = "Must be 5-50%";
      }
      if (milestone.deadline < 7 || milestone.deadline > 365) {
        newErrors[`milestone${index}Deadline`] = "Must be 7-365 days";
      }

      // Check chronological order
      if (index > 0 && milestone.deadline <= formData.milestones[index - 1].deadline) {
        newErrors[`milestone${index}Deadline`] = "Must be after previous milestone";
      }
    });

    // Check total percentage = 100%
    const totalPercentage = formData.milestones.reduce(
      (sum, m) => sum + (m.releasePercentage || 0),
      0
    );
    if (totalPercentage !== 100) {
      newErrors.totalPercentage = `Total must be 100% (currently ${totalPercentage}%)`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleBack = () => {
    setStep(Math.max(1, step - 1));
  };

  const applyPreset = (preset: keyof typeof MILESTONE_PRESETS) => {
    const presetData = MILESTONE_PRESETS[preset];
    setFormData({
      ...formData,
      milestones: presetData.map((p, index) => ({
        description: formData.milestones[index]?.description || "",
        releasePercentage: p.percentage,
        deadline: p.days,
      })),
    });
    toast.success(`Applied ${preset} preset!`);
  };

  const handleCreate = async () => {
    if (!validateStep1() || !validateStep2()) {
      toast.error("Please fix validation errors");
      return;
    }

    try {
      setIsCreating(true);

      // Mock mode - simulate campaign creation
      if (isInMockMode || !signer || !chainId) {
        toast.info("Creating your campaign...");
        
        // Simulate transaction delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Create mock campaign and save to localStorage
        const newCampaign = {
          address: generateMockAddress(),
          title: formData.title,
          description: formData.description,
          founder: account || "",
          fundingGoal: formData.fundingGoal,
          totalRaised: "0",
          progress: 0,
          state: 0, // Active
          stateLabel: "Active",
          currentMilestone: 1,
          totalMilestones: 5,
          contributorsCount: 0,
          createdAt: new Date(),
        };

        // Load existing campaigns from localStorage
        const storedCampaigns = localStorage.getItem('mockCampaigns');
        const campaigns = storedCampaigns ? JSON.parse(storedCampaigns) : [];
        
        // Add new campaign
        campaigns.unshift(newCampaign);
        
        // Save back to localStorage
        localStorage.setItem('mockCampaigns', JSON.stringify(campaigns));
        
        toast.success("Campaign created successfully! 🎉");
        
        // Redirect to campaigns page
        router.push("/my-campaigns");
        return;
      }

      // Real Web3 mode
      toast.info("Please confirm the transaction in your wallet...");

      const factoryAddress = getFactoryAddress(chainId);
      // Validate and normalize the address to prevent ENS resolution
      const validatedFactoryAddress = ethers.getAddress(factoryAddress);
      const factory = new ethers.Contract(validatedFactoryAddress, SIMPLE_FACTORY_ABI, signer);

      // Get creation fee
      const creationFee = await factory.creationFee();

      // Prepare milestone data
      const milestoneDescriptions = formData.milestones.map(m => m.description);
      const milestonePercentages = formData.milestones.map(m => m.releasePercentage);
      const milestoneDeadlines = formData.milestones.map(m => {
        const now = Math.floor(Date.now() / 1000);
        return now + (m.deadline * 24 * 60 * 60); // Convert days to seconds
      });

      // Create campaign
      const tx = await factory.createCampaign(
        formData.title,
        formData.description,
        parseEthInput(formData.fundingGoal),
        milestoneDescriptions,
        milestonePercentages,
        milestoneDeadlines,
        { value: creationFee }
      );

      toast.info("Transaction submitted. Creating your campaign...");
      const receipt = await tx.wait();

      // Get the campaign address from the event
      const event = receipt.logs.find((log: any) => {
        try {
          const parsed = factory.interface.parseLog(log);
          return parsed?.name === "CampaignCreated";
        } catch {
          return false;
        }
      });

      let campaignAddress = "";
      if (event) {
        const parsed = factory.interface.parseLog(event);
        campaignAddress = parsed?.args.campaign;
      }

      toast.success("Campaign created successfully! 🎉");

      // Redirect to campaign page or founder dashboard
      if (campaignAddress) {
        router.push(`/campaign/${campaignAddress}`);
      } else {
        router.push("/my-campaigns");
      }
    } catch (err: any) {
      console.error("Error creating campaign:", err);
      toast.error(err.message || "Failed to create campaign");
    } finally {
      setIsCreating(false);
    }
  };

  if (!isConnected) {
    return (
      <>
        <Header />
        <main className="relative min-h-screen flex items-center justify-center">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Connect Wallet Required</CardTitle>
              <CardDescription>
                You need to connect your wallet to create a project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Please connect your wallet using the button in the header
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </>
    );
  }

  const totalPercentage = formData.milestones.reduce((sum, m) => sum + (m.releasePercentage || 0), 0);

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
              onClick={() => router.back()}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-4xl font-bold mb-2">Create Project</h1>
            <p className="text-muted-foreground">
              Launch your Web3 project with milestone-based crowdfunding
            </p>
          </div>

          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Step {step} of 3</span>
              <span className="text-sm text-muted-foreground">
                {step === 1 && "Basic Information"}
                {step === 2 && "Define Milestones"}
                {step === 3 && "Review & Create"}
              </span>
            </div>
            <Progress value={(step / 3) * 100} className="h-2" />
          </div>

          {/* Step 1: Basic Information */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Basic Project Information</CardTitle>
                <CardDescription>
                  Provide essential details about your project
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">
                    Project Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="My Awesome Web3 Project"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    maxLength={100}
                  />
                  <div className="flex justify-between text-xs">
                    <span className={errors.title ? "text-red-500" : "text-muted-foreground"}>
                      {errors.title || "3-100 characters"}
                    </span>
                    <span className="text-muted-foreground">
                      {formData.title.length}/100
                    </span>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">
                    Description <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your project, its goals, and what makes it unique..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={6}
                    maxLength={1000}
                  />
                  <div className="flex justify-between text-xs">
                    <span className={errors.description ? "text-red-500" : "text-muted-foreground"}>
                      {errors.description || "1-1000 characters"}
                    </span>
                    <span className="text-muted-foreground">
                      {formData.description.length}/1000
                    </span>
                  </div>
                </div>

                {/* Funding Goal */}
                <div className="space-y-2">
                  <Label htmlFor="fundingGoal">
                    Funding Goal (ETH) <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="fundingGoal"
                      type="number"
                      step="0.01"
                      min="0.01"
                      max="10000"
                      placeholder="10"
                      value={formData.fundingGoal}
                      onChange={(e) => setFormData({ ...formData, fundingGoal: e.target.value })}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      ETH
                    </span>
                  </div>
                  <p className={errors.fundingGoal ? "text-xs text-red-500" : "text-xs text-muted-foreground"}>
                    {errors.fundingGoal || "Minimum: 0.01 ETH, Maximum: 10,000 ETH"}
                  </p>
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Your campaign will require 5 milestones with specific release percentages and deadlines
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Milestones */}
          {step === 2 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Define 5 Milestones</CardTitle>
                  <CardDescription>
                    Set up your project milestones with delivery deadlines and fund release percentages
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Presets */}
                  <div className="mb-6">
                    <Label className="mb-3 block">Quick Presets (Optional)</Label>
                    <div className="grid grid-cols-3 gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => applyPreset("standard")}
                      >
                        Standard (10-20-25-25-20%)
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => applyPreset("conservative")}
                      >
                        Conservative (5-15-20-30-30%)
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => applyPreset("aggressive")}
                      >
                        Aggressive (25-25-20-15-15%)
                      </Button>
                    </div>
                  </div>

                  <Separator className="my-6" />

                  {/* Milestones */}
                  <div className="space-y-6">
                    {formData.milestones.map((milestone, index) => (
                      <div key={index} className="p-4 border rounded-lg space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-sm font-bold">
                            M{index + 1}
                          </div>
                          <h4 className="font-semibold">Milestone {index + 1}</h4>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                          <Label htmlFor={`milestone${index}Desc`}>
                            Description <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id={`milestone${index}Desc`}
                            placeholder={`E.g., ${index === 0 ? "Prototype" : index === 1 ? "MVP" : index === 2 ? "Beta" : index === 3 ? "Launch" : "Growth"}`}
                            value={milestone.description}
                            onChange={(e) => {
                              const newMilestones = [...formData.milestones];
                              newMilestones[index].description = e.target.value;
                              setFormData({ ...formData, milestones: newMilestones });
                            }}
                            maxLength={200}
                          />
                          {errors[`milestone${index}Description`] && (
                            <p className="text-xs text-red-500">{errors[`milestone${index}Description`]}</p>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          {/* Release Percentage */}
                          <div className="space-y-2">
                            <Label htmlFor={`milestone${index}Percentage`} className="flex items-center gap-2">
                              <Percent className="w-4 h-4" />
                              Release %
                            </Label>
                            <Input
                              id={`milestone${index}Percentage`}
                              type="number"
                              min="5"
                              max="50"
                              step="5"
                              placeholder="20"
                              value={milestone.releasePercentage || ""}
                              onChange={(e) => {
                                const newMilestones = [...formData.milestones];
                                newMilestones[index].releasePercentage = parseInt(e.target.value) || 0;
                                setFormData({ ...formData, milestones: newMilestones });
                              }}
                            />
                            {errors[`milestone${index}Percentage`] && (
                              <p className="text-xs text-red-500">{errors[`milestone${index}Percentage`]}</p>
                            )}
                          </div>

                          {/* Deadline */}
                          <div className="space-y-2">
                            <Label htmlFor={`milestone${index}Deadline`} className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              Deadline (days)
                            </Label>
                            <Input
                              id={`milestone${index}Deadline`}
                              type="number"
                              min="7"
                              max="365"
                              placeholder="30"
                              value={milestone.deadline || ""}
                              onChange={(e) => {
                                const newMilestones = [...formData.milestones];
                                newMilestones[index].deadline = parseInt(e.target.value) || 0;
                                setFormData({ ...formData, milestones: newMilestones });
                              }}
                            />
                            {errors[`milestone${index}Deadline`] && (
                              <p className="text-xs text-red-500">{errors[`milestone${index}Deadline`]}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total Percentage */}
                  <div className="mt-6 p-4 bg-muted rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">Total Release Percentage:</span>
                      <span className={`text-xl font-bold ${totalPercentage === 100 ? "text-green-500" : "text-red-500"}`}>
                        {totalPercentage}%
                      </span>
                    </div>
                    <Progress value={totalPercentage} className="h-2" />
                    {errors.totalPercentage && (
                      <p className="text-xs text-red-500 mt-2">{errors.totalPercentage}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Review Your Campaign</CardTitle>
                  <CardDescription>
                    Please review all details before creating your campaign
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Campaign Info */}
                  <div>
                    <h3 className="font-semibold mb-3">Campaign Information</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Title:</span>
                        <span className="font-medium">{formData.title}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Funding Goal:</span>
                        <span className="font-medium">{formData.fundingGoal} ETH</span>
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="text-sm text-muted-foreground mb-1">Description:</p>
                      <p className="text-sm p-3 bg-muted rounded-md">{formData.description}</p>
                    </div>
                  </div>

                  <Separator />

                  {/* Milestones */}
                  <div>
                    <h3 className="font-semibold mb-3">Milestones Timeline</h3>
                    <div className="space-y-3">
                      {formData.milestones.map((milestone, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 border rounded-md">
                          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-sm font-bold flex-shrink-0">
                            M{index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{milestone.description}</p>
                            <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                              <span>Release: {milestone.releasePercentage}%</span>
                              <span>Deadline: {milestone.deadline} days</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* Creation Fee Info */}
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      A small creation fee will be charged to deploy your campaign smart contract on the blockchain.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={step === 1 || isCreating}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>

            {step < 3 ? (
              <Button onClick={handleNext}>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleCreate}
                disabled={isCreating}
                className="bg-primary"
              >
                {isCreating ? (
                  <>Creating...</>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Create Project
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

