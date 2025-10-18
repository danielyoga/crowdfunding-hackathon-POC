import { expect } from "chai";
import { ethers } from "hardhat";
import { SimpleFactory, SimpleCampaign } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("SimpleFactory", function () {
  let factory: SimpleFactory;
  let owner: SignerWithAddress;
  let founder: SignerWithAddress;
  let contributor1: SignerWithAddress;
  let contributor2: SignerWithAddress;

  const CREATION_FEE = ethers.parseEther("0.01");
  const FUNDING_GOAL = ethers.parseEther("10");

  const milestoneDescriptions = [
    "Prototype Development",
    "Beta Testing",
    "Product Launch"
  ];
  
  const milestonePercentages = [3000, 4000, 3000]; // 30%, 40%, 30%

  beforeEach(async function () {
    [owner, founder, contributor1, contributor2] = await ethers.getSigners();

    const SimpleFactory = await ethers.getContractFactory("SimpleFactory");
    factory = await SimpleFactory.deploy();
    await factory.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await factory.owner()).to.equal(await owner.getAddress());
    });

    it("Should initialize with correct default values", async function () {
      expect(await factory.campaignCount()).to.equal(0);
      expect(await factory.creationFee()).to.equal(CREATION_FEE);
    });

    it("Should start with zero campaigns", async function () {
      const allCampaigns = await factory.getAllCampaigns();
      expect(allCampaigns.length).to.equal(0);
    });
  });

  describe("Campaign Creation", function () {
    it("Should create campaign with correct data", async function () {
      const tx = await factory.connect(founder).createCampaign(
        "Test Campaign",
        "A test crowdfunding campaign",
        FUNDING_GOAL,
        milestoneDescriptions,
        milestonePercentages,
        { value: CREATION_FEE }
      );
      
      await expect(tx)
        .to.emit(factory, "CampaignCreated")
        .withArgs(0, await factory.campaigns(0), await founder.getAddress(), "Test Campaign", FUNDING_GOAL);

      expect(await factory.campaignCount()).to.equal(1);
      expect(await factory.campaigns(0)).to.not.equal(ethers.ZeroAddress);
    });

    it("Should track founder campaigns", async function () {
      await factory.connect(founder).createCampaign(
        "Test Campaign 1",
        "First campaign",
        FUNDING_GOAL,
        milestoneDescriptions,
        milestonePercentages,
        { value: CREATION_FEE }
      );

      await factory.connect(founder).createCampaign(
        "Test Campaign 2",
        "Second campaign",
        FUNDING_GOAL,
        milestoneDescriptions,
        milestonePercentages,
        { value: CREATION_FEE }
      );

      const founderCampaigns = await factory.getFounderCampaigns(await founder.getAddress());
      expect(founderCampaigns.length).to.equal(2);
      expect(founderCampaigns[0]).to.equal(0);
      expect(founderCampaigns[1]).to.equal(1);
    });

    it("Should track all campaigns", async function () {
      await factory.connect(founder).createCampaign(
        "Campaign 1",
        "First campaign",
        FUNDING_GOAL,
        milestoneDescriptions,
        milestonePercentages,
        { value: CREATION_FEE }
      );

      await factory.connect(contributor1).createCampaign(
        "Campaign 2",
        "Second campaign",
        FUNDING_GOAL,
        milestoneDescriptions,
        milestonePercentages,
        { value: CREATION_FEE }
      );

      const allCampaigns = await factory.getAllCampaigns();
      expect(allCampaigns.length).to.equal(2);
    });

    it("Should prevent creation with insufficient fee", async function () {
      await expect(
        factory.connect(founder).createCampaign(
          "Test Campaign",
          "A test campaign",
          FUNDING_GOAL,
          milestoneDescriptions,
          milestonePercentages,
          { value: ethers.parseEther("0.005") } // Less than required fee
        )
      ).to.be.revertedWithCustomError(factory, "InsufficientCreationFee");
    });

    it("Should prevent creation with invalid funding goal", async function () {
      await expect(
        factory.connect(founder).createCampaign(
          "Test Campaign",
          "A test campaign",
          ethers.parseEther("0.005"), // Too low
          milestoneDescriptions,
          milestonePercentages,
          { value: CREATION_FEE }
        )
      ).to.be.revertedWith("Invalid funding goal");

      await expect(
        factory.connect(founder).createCampaign(
          "Test Campaign",
          "A test campaign",
          ethers.parseEther("1001"), // Too high
          milestoneDescriptions,
          milestonePercentages,
          { value: CREATION_FEE }
        )
      ).to.be.revertedWith("Invalid funding goal");
    });

    it("Should prevent creation with invalid milestone percentages", async function () {
      const invalidPercentages = [2000, 3000, 2000]; // Sums to 70%, not 100%

      await expect(
        factory.connect(founder).createCampaign(
          "Test Campaign",
          "A test campaign",
          FUNDING_GOAL,
          milestoneDescriptions,
          invalidPercentages,
          { value: CREATION_FEE }
        )
      ).to.be.revertedWith("Milestone percentages must sum to 100%");
    });

    it("Should prevent creation with zero milestone percentage", async function () {
      const invalidPercentages = [0, 5000, 5000]; // First milestone is 0%

      await expect(
        factory.connect(founder).createCampaign(
          "Test Campaign",
          "A test campaign",
          FUNDING_GOAL,
          milestoneDescriptions,
          invalidPercentages,
          { value: CREATION_FEE }
        )
      ).to.be.revertedWith("Invalid milestone percentage");
    });

    it("Should create campaign with exact funding goal limits", async function () {
      // Test minimum funding goal
      await expect(
        factory.connect(founder).createCampaign(
          "Min Campaign",
          "Minimum funding goal",
          ethers.parseEther("0.01"), // Minimum allowed
          milestoneDescriptions,
          milestonePercentages,
          { value: CREATION_FEE }
        )
      ).to.not.be.reverted;

      // Test maximum funding goal
      await expect(
        factory.connect(founder).createCampaign(
          "Max Campaign",
          "Maximum funding goal",
          ethers.parseEther("1000"), // Maximum allowed
          milestoneDescriptions,
          milestonePercentages,
          { value: CREATION_FEE }
        )
      ).to.not.be.reverted;
    });
  });

  describe("Campaign Management", function () {
    let campaign: SimpleCampaign;

    beforeEach(async function () {
      await factory.connect(founder).createCampaign(
        "Test Campaign",
        "A test campaign",
        FUNDING_GOAL,
        milestoneDescriptions,
        milestonePercentages,
        { value: CREATION_FEE }
      );

      const campaignAddress = await factory.campaigns(0);
      const SimpleCampaign = await ethers.getContractFactory("SimpleCampaign");
      campaign = SimpleCampaign.attach(campaignAddress) as SimpleCampaign;
    });

    it("Should get campaign by ID", async function () {
      const campaignAddress = await factory.getCampaign(0);
      expect(campaignAddress).to.equal(await campaign.getAddress());
    });

    it("Should return zero address for non-existent campaign", async function () {
      const campaignAddress = await factory.getCampaign(999);
      expect(campaignAddress).to.equal(ethers.ZeroAddress);
    });

    it("Should track campaign count correctly", async function () {
      expect(await factory.campaignCount()).to.equal(1);

      await factory.connect(contributor1).createCampaign(
        "Another Campaign",
        "Second campaign",
        FUNDING_GOAL,
        milestoneDescriptions,
        milestonePercentages,
        { value: CREATION_FEE }
      );

      expect(await factory.campaignCount()).to.equal(2);
    });
  });

  describe("Factory Management", function () {
    it("Should allow owner to update creation fee", async function () {
      const newFee = ethers.parseEther("0.02");
      
      await expect(factory.connect(owner).updateCreationFee(newFee))
        .to.emit(factory, "CreationFeeUpdated")
        .withArgs(CREATION_FEE, newFee);

      expect(await factory.creationFee()).to.equal(newFee);
    });

    it("Should prevent non-owner from updating creation fee", async function () {
      const newFee = ethers.parseEther("0.02");
      
      await expect(
        factory.connect(founder).updateCreationFee(newFee)
      ).to.be.revertedWithCustomError(factory, "OwnableUnauthorizedAccount");
    });

    it("Should allow owner to withdraw fees", async function () {
      // Create a campaign to generate fees
      await factory.connect(founder).createCampaign(
        "Test Campaign",
        "A test campaign",
        FUNDING_GOAL,
        milestoneDescriptions,
        milestonePercentages,
        { value: CREATION_FEE }
      );

      const ownerBalanceBefore = await ethers.provider.getBalance(await owner.getAddress());
      
      await expect(factory.connect(owner).withdrawFees())
        .to.emit(factory, "FeesWithdrawn")
        .withArgs(await owner.getAddress(), CREATION_FEE);

      const ownerBalanceAfter = await ethers.provider.getBalance(await owner.getAddress());
      expect(ownerBalanceAfter - ownerBalanceBefore).to.be.closeTo(
        CREATION_FEE,
        ethers.parseEther("0.001") // Allow for gas costs
      );
    });

    it("Should prevent withdrawing when no fees available", async function () {
      await expect(
        factory.connect(owner).withdrawFees()
      ).to.be.revertedWith("No fees to withdraw");
    });

    it("Should prevent non-owner from withdrawing fees", async function () {
      await expect(
        factory.connect(founder).withdrawFees()
      ).to.be.revertedWithCustomError(factory, "OwnableUnauthorizedAccount");
    });

    it("Should get platform statistics", async function () {
      await factory.connect(founder).createCampaign(
        "Test Campaign",
        "A test campaign",
        FUNDING_GOAL,
        milestoneDescriptions,
        milestonePercentages,
        { value: CREATION_FEE }
      );

      const stats = await factory.getPlatformStats();
      expect(stats.totalCampaigns).to.equal(1);
      expect(stats.currentCreationFee).to.equal(CREATION_FEE);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle multiple campaigns from same founder", async function () {
      for (let i = 0; i < 3; i++) {
        await factory.connect(founder).createCampaign(
          `Campaign ${i}`,
          `Campaign number ${i}`,
          FUNDING_GOAL,
          milestoneDescriptions,
          milestonePercentages,
          { value: CREATION_FEE }
        );
      }

      expect(await factory.campaignCount()).to.equal(3);
      
      const founderCampaigns = await factory.getFounderCampaigns(await founder.getAddress());
      expect(founderCampaigns.length).to.equal(3);
    });

    it("Should handle campaigns from different founders", async function () {
      await factory.connect(founder).createCampaign(
        "Founder 1 Campaign",
        "First founder's campaign",
        FUNDING_GOAL,
        milestoneDescriptions,
        milestonePercentages,
        { value: CREATION_FEE }
      );

      await factory.connect(contributor1).createCampaign(
        "Founder 2 Campaign",
        "Second founder's campaign",
        FUNDING_GOAL,
        milestoneDescriptions,
        milestonePercentages,
        { value: CREATION_FEE }
      );

      expect(await factory.campaignCount()).to.equal(2);
      
      const founder1Campaigns = await factory.getFounderCampaigns(await founder.getAddress());
      const founder2Campaigns = await factory.getFounderCampaigns(await contributor1.getAddress());
      
      expect(founder1Campaigns.length).to.equal(1);
      expect(founder2Campaigns.length).to.equal(1);
    });

    it("Should accept ETH via receive function", async function () {
      const ethAmount = ethers.parseEther("1");
      
      await expect(
        await contributor1.sendTransaction({
          to: await factory.getAddress(),
          value: ethAmount
        })
      ).to.not.be.reverted;

      // Should be able to withdraw the received ETH
      const ownerBalanceBefore = await ethers.provider.getBalance(await owner.getAddress());
      await factory.connect(owner).withdrawFees();
      const ownerBalanceAfter = await ethers.provider.getBalance(await owner.getAddress());
      
      expect(ownerBalanceAfter - ownerBalanceBefore).to.be.closeTo(
        ethAmount,
        ethers.parseEther("0.001") // Allow for gas costs
      );
    });
  });
});
