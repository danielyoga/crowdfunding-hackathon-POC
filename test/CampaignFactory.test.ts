import { expect } from "chai";
import { ethers } from "hardhat";
import { CampaignFactory, Campaign } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("CampaignFactory", function () {
  let campaignFactory: CampaignFactory;
  let owner: SignerWithAddress;
  let founder: SignerWithAddress;
  let funder1: SignerWithAddress;
  let funder2: SignerWithAddress;

  const CREATION_FEE = ethers.parseEther("0.01");
  const FUNDING_GOAL = ethers.parseEther("10");

  beforeEach(async function () {
    [owner, founder, funder1, funder2] = await ethers.getSigners();

    const CampaignFactoryContract = await ethers.getContractFactory("CampaignFactory");
    campaignFactory = await CampaignFactoryContract.deploy(owner.address);
    await campaignFactory.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await campaignFactory.owner()).to.equal(owner.address);
    });

    it("Should initialize with correct default values", async function () {
      expect(await campaignFactory.campaignCount()).to.equal(0);
      expect(await campaignFactory.platformFeePercentage()).to.equal(200); // 2%
      expect(await campaignFactory.campaignCreationFee()).to.equal(CREATION_FEE);
    });
  });

  describe("Campaign Creation", function () {
    const milestoneDescriptions: [string, string, string, string, string] = [
      "Prototype Development",
      "Early Traction",
      "Strategic Partnership",
      "Revenue Proof",
      "Public Launch"
    ];
    
    const milestoneDeadlines: [bigint, bigint, bigint, bigint, bigint] = [
      90n, 120n, 90n, 120n, 60n
    ];
    
    const milestonePercentages: [bigint, bigint, bigint, bigint, bigint] = [
      1000n, 2000n, 2500n, 2500n, 2000n // 10%, 20%, 25%, 25%, 20% = 100%
    ];

    it("Should create a campaign successfully", async function () {
      const tx = await campaignFactory.connect(founder).createCampaign(
        "Test Campaign",
        "A test crowdfunding campaign",
        FUNDING_GOAL,
        milestoneDescriptions,
        milestoneDeadlines,
        milestonePercentages,
        { value: CREATION_FEE }
      );

      await expect(tx)
        .to.emit(campaignFactory, "CampaignCreated")
        .withArgs(0, await campaignFactory.campaigns(0), founder.address, "Test Campaign", FUNDING_GOAL, await ethers.provider.getBlock("latest").then(b => b!.timestamp));

      expect(await campaignFactory.campaignCount()).to.equal(1);
    });

    it("Should fail with insufficient creation fee", async function () {
      await expect(
        campaignFactory.connect(founder).createCampaign(
          "Test Campaign",
          "A test crowdfunding campaign",
          FUNDING_GOAL,
          milestoneDescriptions,
          milestoneDeadlines,
          milestonePercentages,
          { value: ethers.parseEther("0.005") } // Less than required
        )
      ).to.be.revertedWithCustomError(campaignFactory, "InsufficientCreationFee");
    });

    it("Should fail with invalid milestone percentages", async function () {
      const invalidPercentages: [bigint, bigint, bigint, bigint, bigint] = [
        1000n, 2000n, 2500n, 2500n, 1500n // Only 95%
      ];

      await expect(
        campaignFactory.connect(founder).createCampaign(
          "Test Campaign",
          "A test crowdfunding campaign",
          FUNDING_GOAL,
          milestoneDescriptions,
          milestoneDeadlines,
          invalidPercentages,
          { value: CREATION_FEE }
        )
      ).to.be.revertedWithCustomError(campaignFactory, "InvalidMilestoneCount");
    });

    it("Should track founder campaigns", async function () {
      await campaignFactory.connect(founder).createCampaign(
        "Test Campaign 1",
        "First campaign",
        FUNDING_GOAL,
        milestoneDescriptions,
        milestoneDeadlines,
        milestonePercentages,
        { value: CREATION_FEE }
      );

      await campaignFactory.connect(founder).createCampaign(
        "Test Campaign 2",
        "Second campaign",
        FUNDING_GOAL,
        milestoneDescriptions,
        milestoneDeadlines,
        milestonePercentages,
        { value: CREATION_FEE }
      );

      const founderCampaigns = await campaignFactory.getFounderCampaigns(founder.address);
      expect(founderCampaigns.length).to.equal(2);
      expect(founderCampaigns[0]).to.equal(0);
      expect(founderCampaigns[1]).to.equal(1);
    });
  });

  describe("Platform Management", function () {
    it("Should allow owner to update platform fee", async function () {
      const newFee = 300; // 3%
      
      await expect(campaignFactory.connect(owner).updatePlatformFee(newFee))
        .to.emit(campaignFactory, "PlatformFeeUpdated")
        .withArgs(200, newFee);

      expect(await campaignFactory.platformFeePercentage()).to.equal(newFee);
    });

    it("Should not allow platform fee above maximum", async function () {
      await expect(
        campaignFactory.connect(owner).updatePlatformFee(600) // 6% > 5% max
      ).to.be.revertedWithCustomError(campaignFactory, "InvalidPlatformFee");
    });

    it("Should allow owner to update creation fee", async function () {
      const newFee = ethers.parseEther("0.02");
      
      await expect(campaignFactory.connect(owner).updateCreationFee(newFee))
        .to.emit(campaignFactory, "CreationFeeUpdated")
        .withArgs(CREATION_FEE, newFee);

      expect(await campaignFactory.campaignCreationFee()).to.equal(newFee);
    });

    it("Should allow owner to withdraw fees", async function () {
      const milestoneDescriptions: [string, string, string, string, string] = [
        "Prototype Development",
        "Early Traction", 
        "Strategic Partnership",
        "Revenue Proof",
        "Public Launch"
      ];
      
      const milestoneDeadlines: [bigint, bigint, bigint, bigint, bigint] = [
        90n, 120n, 90n, 120n, 60n
      ];
      
      const milestonePercentages: [bigint, bigint, bigint, bigint, bigint] = [
        1000n, 2000n, 2500n, 2500n, 2000n
      ];

      // Create a campaign to generate fees
      await campaignFactory.connect(founder).createCampaign(
        "Test Campaign",
        "A test campaign",
        FUNDING_GOAL,
        milestoneDescriptions,
        milestoneDeadlines,
        milestonePercentages,
        { value: CREATION_FEE }
      );

      const initialBalance = await ethers.provider.getBalance(owner.address);
      
      await expect(campaignFactory.connect(owner).withdrawFees())
        .to.emit(campaignFactory, "FeesWithdrawn")
        .withArgs(owner.address, CREATION_FEE);

      const finalBalance = await ethers.provider.getBalance(owner.address);
      expect(finalBalance).to.be.gt(initialBalance);
    });
  });

  describe("Campaign Tracking", function () {
    beforeEach(async function () {
      const milestoneDescriptions: [string, string, string, string, string] = [
        "Prototype Development",
        "Early Traction",
        "Strategic Partnership", 
        "Revenue Proof",
        "Public Launch"
      ];
      
      const milestoneDeadlines: [bigint, bigint, bigint, bigint, bigint] = [
        90n, 120n, 90n, 120n, 60n
      ];
      
      const milestonePercentages: [bigint, bigint, bigint, bigint, bigint] = [
        1000n, 2000n, 2500n, 2500n, 2000n
      ];

      await campaignFactory.connect(founder).createCampaign(
        "Test Campaign",
        "A test campaign",
        FUNDING_GOAL,
        milestoneDescriptions,
        milestoneDeadlines,
        milestonePercentages,
        { value: CREATION_FEE }
      );
    });

    it("Should return correct campaign address", async function () {
      const campaignAddress = await campaignFactory.getCampaign(0);
      expect(campaignAddress).to.not.equal(ethers.ZeroAddress);
    });

    it("Should list active campaigns", async function () {
      const activeCampaigns = await campaignFactory.getAllActiveCampaigns();
      expect(activeCampaigns.length).to.equal(1);
    });

    it("Should return platform statistics", async function () {
      const stats = await campaignFactory.getPlatformStats();
      expect(stats.totalCampaigns).to.equal(1);
      expect(stats.activeCampaignsCount).to.equal(1);
      expect(stats.currentPlatformFee).to.equal(200);
      expect(stats.currentCreationFee).to.equal(CREATION_FEE);
    });
  });
});
