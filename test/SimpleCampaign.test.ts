import { expect } from "chai";
import { ethers } from "hardhat";
import { SimpleCampaign, SimpleFactory } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("SimpleCampaign", function () {
  let factory: SimpleFactory;
  let campaign: SimpleCampaign;
  let owner: SignerWithAddress;
  let founder: SignerWithAddress;
  let contributor1: SignerWithAddress;
  let contributor2: SignerWithAddress;
  let contributor3: SignerWithAddress;

  const CREATION_FEE = ethers.parseEther("0.01");
  const FUNDING_GOAL = ethers.parseEther("10");
  const CONTRIBUTION_AMOUNT = ethers.parseEther("2");

  const milestoneDescriptions = [
    "Prototype Development",
    "Beta Testing", 
    "Product Launch"
  ];
  
  const milestonePercentages = [3000, 4000, 3000]; // 30%, 40%, 30%

  beforeEach(async function () {
    [owner, founder, contributor1, contributor2, contributor3] = await ethers.getSigners();

    // Deploy factory
    const SimpleFactory = await ethers.getContractFactory("SimpleFactory");
    factory = await SimpleFactory.deploy();
    await factory.waitForDeployment();

    // Create campaign
    const tx = await factory.connect(founder).createCampaign(
      "Test Project",
      "A test project for milestone funding",
      FUNDING_GOAL,
      milestoneDescriptions,
      milestonePercentages,
      { value: CREATION_FEE }
    );
    
    await tx.wait();
    
    // Get campaign address
    const campaignAddress = await factory.campaigns(0);
    const SimpleCampaign = await ethers.getContractFactory("SimpleCampaign");
    campaign = SimpleCampaign.attach(campaignAddress) as SimpleCampaign;
  });

  describe("Campaign Creation", function () {
    it("Should create campaign with correct data", async function () {
      const campaignData = await campaign.getCampaignData();
      expect(campaignData.title).to.equal("Test Project");
      expect(campaignData.description).to.equal("A test project for milestone funding");
      expect(campaignData.founder).to.equal(await founder.getAddress());
      expect(campaignData.fundingGoal).to.equal(FUNDING_GOAL);
      expect(campaignData.totalRaised).to.equal(0);
      expect(campaignData.state).to.equal(0); // CampaignState.Active
      expect(campaignData.createdAt).to.be.greaterThan(0);
    });

    it("Should initialize milestones correctly", async function () {
      const milestone0 = await campaign.getMilestone(0);
      const milestone1 = await campaign.getMilestone(1);
      const milestone2 = await campaign.getMilestone(2);
      
      expect(milestone0.description).to.equal("Prototype Development");
      expect(milestone0.releasePercentage).to.equal(3000); // 30%
      expect(milestone0.state).to.equal(0); // MilestoneState.Pending
      
      expect(milestone1.description).to.equal("Beta Testing");
      expect(milestone1.releasePercentage).to.equal(4000); // 40%
      expect(milestone1.state).to.equal(0); // MilestoneState.Pending
      
      expect(milestone2.description).to.equal("Product Launch");
      expect(milestone2.releasePercentage).to.equal(3000); // 30%
      expect(milestone2.state).to.equal(0); // MilestoneState.Pending
    });

    it("Should set correct owner", async function () {
      expect(await campaign.owner()).to.equal(await founder.getAddress());
    });

    it("Should start with current milestone 0", async function () {
      expect(await campaign.currentMilestone()).to.equal(0);
    });
  });

  describe("Funding", function () {
    it("Should allow contributors to fund the campaign", async function () {
      await expect(campaign.connect(contributor1).fund({ value: CONTRIBUTION_AMOUNT }))
        .to.emit(campaign, "FundReceived")
        .withArgs(await contributor1.getAddress(), CONTRIBUTION_AMOUNT);
      
      const contribution = await campaign.getContribution(await contributor1.getAddress());
      expect(contribution).to.equal(CONTRIBUTION_AMOUNT);
      
      const campaignData = await campaign.getCampaignData();
      expect(campaignData.totalRaised).to.equal(CONTRIBUTION_AMOUNT);
    });

    it("Should track multiple contributors", async function () {
      await campaign.connect(contributor1).fund({ value: ethers.parseEther("3") });
      await campaign.connect(contributor2).fund({ value: ethers.parseEther("2") });
      await campaign.connect(contributor3).fund({ value: ethers.parseEther("1") });
      
      const contributors = await campaign.getContributors();
      expect(contributors.length).to.equal(3);
      expect(contributors).to.include(await contributor1.getAddress());
      expect(contributors).to.include(await contributor2.getAddress());
      expect(contributors).to.include(await contributor3.getAddress());
      
      const campaignData = await campaign.getCampaignData();
      expect(campaignData.totalRaised).to.equal(ethers.parseEther("6"));
    });

    it("Should allow same contributor to fund multiple times", async function () {
      await campaign.connect(contributor1).fund({ value: ethers.parseEther("2") });
      await campaign.connect(contributor1).fund({ value: ethers.parseEther("3") });
      
      const contribution = await campaign.getContribution(await contributor1.getAddress());
      expect(contribution).to.equal(ethers.parseEther("5"));
      
      const contributors = await campaign.getContributors();
      expect(contributors.length).to.equal(1); // Still only one unique contributor
    });

    it("Should prevent funding when goal is reached", async function () {
      await campaign.connect(contributor1).fund({ value: FUNDING_GOAL });
      
      await expect(
        campaign.connect(contributor2).fund({ value: ethers.parseEther("1") })
      ).to.be.revertedWithCustomError(campaign, "FundingGoalReached");
    });

    it("Should prevent funding with zero amount", async function () {
      await expect(
        campaign.connect(contributor1).fund({ value: 0 })
      ).to.be.revertedWith("Must send ETH");
    });

    it("Should prevent funding when campaign is not active", async function () {
      // Fail the campaign first
      await campaign.connect(founder).failCampaign();
      
      await expect(
        campaign.connect(contributor1).fund({ value: CONTRIBUTION_AMOUNT })
      ).to.be.revertedWithCustomError(campaign, "CampaignNotActive");
    });

    it("Should emit FundReceived event", async function () {
      await expect(campaign.connect(contributor1).fund({ value: CONTRIBUTION_AMOUNT }))
        .to.emit(campaign, "FundReceived")
        .withArgs(await contributor1.getAddress(), CONTRIBUTION_AMOUNT);
    });
  });

  describe("Milestone Completion", function () {
    beforeEach(async function () {
      // Fund the campaign first
      await campaign.connect(contributor1).fund({ value: ethers.parseEther("5") });
    });

    it("Should allow founder to complete milestones", async function () {
      await expect(campaign.connect(founder).completeMilestone(0))
        .to.emit(campaign, "MilestoneCompleted")
        .withArgs(0, ethers.parseEther("5") * 3000n / 10000n);
      
      const milestone = await campaign.getMilestone(0);
      expect(milestone.state).to.equal(1); // MilestoneState.Completed
      expect(await campaign.currentMilestone()).to.equal(1);
    });

    it("Should release funds when milestone is completed", async function () {
      const founderBalanceBefore = await ethers.provider.getBalance(await founder.getAddress());
      
      await campaign.connect(founder).completeMilestone(0);
      
      const founderBalanceAfter = await ethers.provider.getBalance(await founder.getAddress());
      const expectedRelease = ethers.parseEther("5") * 3000n / 10000n; // 30% of 5 ETH
      
      expect(founderBalanceAfter - founderBalanceBefore).to.be.closeTo(
        expectedRelease,
        ethers.parseEther("0.01") // Allow for gas costs
      );
    });

    it("Should prevent non-founders from completing milestones", async function () {
      await expect(
        campaign.connect(contributor1).completeMilestone(0)
      ).to.be.revertedWithCustomError(campaign, "OnlyFounder");
    });

    it("Should prevent completing wrong milestone", async function () {
      await expect(
        campaign.connect(founder).completeMilestone(1)
      ).to.be.revertedWithCustomError(campaign, "InvalidMilestone");
    });

    it("Should prevent completing already completed milestone", async function () {
      await campaign.connect(founder).completeMilestone(0);
      
      // After completing milestone 0, currentMilestone becomes 1
      // So trying to complete milestone 0 again should fail with InvalidMilestone
      await expect(
        campaign.connect(founder).completeMilestone(0)
      ).to.be.revertedWithCustomError(campaign, "InvalidMilestone");
    });

    it("Should prevent completing milestone when campaign not active", async function () {
      await campaign.connect(founder).failCampaign();
      
      await expect(
        campaign.connect(founder).completeMilestone(0)
      ).to.be.revertedWithCustomError(campaign, "CampaignNotActive");
    });

    it("Should complete campaign when all milestones are done", async function () {
      await expect(campaign.connect(founder).completeMilestone(0))
        .to.emit(campaign, "MilestoneCompleted");
      
      await expect(campaign.connect(founder).completeMilestone(1))
        .to.emit(campaign, "MilestoneCompleted");
      
      await expect(campaign.connect(founder).completeMilestone(2))
        .to.emit(campaign, "CampaignCompleted");
      
      const campaignData = await campaign.getCampaignData();
      expect(campaignData.state).to.equal(1); // CampaignState.Completed
    });

    it("Should handle zero fund release gracefully", async function () {
      // Create campaign with zero funding
      const tx = await factory.connect(founder).createCampaign(
        "Zero Fund Campaign",
        "Campaign with no funding",
        ethers.parseEther("1"),
        milestoneDescriptions,
        milestonePercentages,
        { value: CREATION_FEE }
      );
      await tx.wait();
      
      const campaignAddress = await factory.campaigns(1);
      const SimpleCampaign = await ethers.getContractFactory("SimpleCampaign");
      const zeroCampaign = SimpleCampaign.attach(campaignAddress) as SimpleCampaign;
      
      // Should not revert even with zero funds
      await expect(zeroCampaign.connect(founder).completeMilestone(0))
        .to.not.be.reverted;
    });
  });

  describe("Refunds", function () {
    beforeEach(async function () {
      await campaign.connect(contributor1).fund({ value: ethers.parseEther("3") });
      await campaign.connect(contributor2).fund({ value: ethers.parseEther("2") });
    });

    it("Should allow refunds when campaign fails", async function () {
      await campaign.connect(founder).failCampaign();
      
      const contributor1BalanceBefore = await ethers.provider.getBalance(await contributor1.getAddress());
      
      await campaign.connect(contributor1).claimRefund();
      
      const contributor1BalanceAfter = await ethers.provider.getBalance(await contributor1.getAddress());
      const refundAmount = contributor1BalanceAfter - contributor1BalanceBefore;
      
      expect(refundAmount).to.be.closeTo(
        ethers.parseEther("3"),
        ethers.parseEther("0.01") // Allow for gas costs
      );
    });

    it("Should prevent refunds when campaign is active", async function () {
      await expect(
        campaign.connect(contributor1).claimRefund()
      ).to.be.revertedWith("Campaign not failed");
    });
  });
});
