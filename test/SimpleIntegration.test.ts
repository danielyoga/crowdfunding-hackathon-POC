import { expect } from "chai";
import { ethers } from "hardhat";
import { SimpleFactory, SimpleCampaign } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("Simple Integration Tests - End-to-End Scenarios", function () {
  let factory: SimpleFactory;
  let campaign: SimpleCampaign;
  let owner: SignerWithAddress;
  let founder: SignerWithAddress;
  let contributors: SignerWithAddress[];

  const CREATION_FEE = ethers.parseEther("0.01");
  const FUNDING_GOAL = ethers.parseEther("50");

  const milestoneDescriptions = [
    "Prototype Development",
    "Beta Testing",
    "Product Launch"
  ];
  
  const milestonePercentages = [3000, 4000, 3000]; // 30%, 40%, 30%

  beforeEach(async function () {
    const signers = await ethers.getSigners();
    owner = signers[0];
    founder = signers[1];
    contributors = signers.slice(2, 7); // 5 contributors

    // Deploy factory
    const SimpleFactory = await ethers.getContractFactory("SimpleFactory");
    factory = await SimpleFactory.deploy();
    await factory.waitForDeployment();

    // Create campaign
    const tx = await factory.connect(founder).createCampaign(
      "Integration Test Campaign",
      "A comprehensive test campaign for integration testing",
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

  describe("Complete Campaign Lifecycle", function () {
    it("Should complete full campaign from creation to completion", async function () {
      // Step 1: Fund the campaign
      const contributions = [
        ethers.parseEther("10"),
        ethers.parseEther("15"),
        ethers.parseEther("8"),
        ethers.parseEther("12"),
        ethers.parseEther("5")
      ];

      for (let i = 0; i < contributors.length; i++) {
        await campaign.connect(contributors[i]).fund({ value: contributions[i] });
      }

      // Verify funding
      const campaignData = await campaign.getCampaignData();
      expect(campaignData.totalRaised).to.equal(ethers.parseEther("50"));
      expect(campaignData.state).to.equal(0); // Active

      // Step 2: Complete milestones
      // Milestone 1: 30% release
      const founderBalanceBefore1 = await ethers.provider.getBalance(await founder.getAddress());
      await campaign.connect(founder).completeMilestone(0);
      const founderBalanceAfter1 = await ethers.provider.getBalance(await founder.getAddress());
      const expectedRelease1 = ethers.parseEther("50") * 3000n / 10000n; // 15 ETH
      expect(founderBalanceAfter1 - founderBalanceBefore1).to.be.closeTo(
        expectedRelease1,
        ethers.parseEther("0.01")
      );

      // Milestone 2: 40% release
      const founderBalanceBefore2 = await ethers.provider.getBalance(await founder.getAddress());
      await campaign.connect(founder).completeMilestone(1);
      const founderBalanceAfter2 = await ethers.provider.getBalance(await founder.getAddress());
      const expectedRelease2 = ethers.parseEther("50") * 4000n / 10000n; // 20 ETH
      expect(founderBalanceAfter2 - founderBalanceBefore2).to.be.closeTo(
        expectedRelease2,
        ethers.parseEther("0.01")
      );

      // Milestone 3: 30% release (final)
      const founderBalanceBefore3 = await ethers.provider.getBalance(await founder.getAddress());
      await campaign.connect(founder).completeMilestone(2);
      const founderBalanceAfter3 = await ethers.provider.getBalance(await founder.getAddress());
      const expectedRelease3 = ethers.parseEther("50") * 3000n / 10000n; // 15 ETH
      expect(founderBalanceAfter3 - founderBalanceBefore3).to.be.closeTo(
        expectedRelease3,
        ethers.parseEther("0.01")
      );

      // Verify campaign completion
      const finalCampaignData = await campaign.getCampaignData();
      expect(finalCampaignData.state).to.equal(1); // Completed
    });

    it("Should handle campaign failure and refunds", async function () {
      // Fund the campaign
      const contributions = [
        ethers.parseEther("20"),
        ethers.parseEther("15"),
        ethers.parseEther("10"),
        ethers.parseEther("5")
      ];

      for (let i = 0; i < 4; i++) {
        await campaign.connect(contributors[i]).fund({ value: contributions[i] });
      }

      // Fail the campaign
      await campaign.connect(founder).failCampaign();
      
      const campaignData = await campaign.getCampaignData();
      expect(campaignData.state).to.equal(2); // Failed

      // Claim refunds
      for (let i = 0; i < 4; i++) {
        const contributorBalanceBefore = await ethers.provider.getBalance(await contributors[i].getAddress());
        await campaign.connect(contributors[i]).claimRefund();
        const contributorBalanceAfter = await ethers.provider.getBalance(await contributors[i].getAddress());
        
        expect(contributorBalanceAfter - contributorBalanceBefore).to.be.closeTo(
          contributions[i],
          ethers.parseEther("0.01")
        );
      }
    });

    it("Should handle partial milestone completion", async function () {
      // Fund the campaign
      await campaign.connect(contributors[0]).fund({ value: ethers.parseEther("30") });
      await campaign.connect(contributors[1]).fund({ value: ethers.parseEther("20") });

      // Complete first milestone
      await campaign.connect(founder).completeMilestone(0);
      
      // Verify milestone state
      const milestone0 = await campaign.getMilestone(0);
      expect(milestone0.state).to.equal(1); // Completed
      expect(await campaign.currentMilestone()).to.equal(1);

      // Campaign should still be active
      const campaignData = await campaign.getCampaignData();
      expect(campaignData.state).to.equal(0); // Active
    });
  });

  describe("Multiple Campaigns", function () {
    it("Should handle multiple campaigns simultaneously", async function () {
      // Create second campaign
      await factory.connect(contributors[0]).createCampaign(
        "Second Campaign",
        "Another test campaign",
        ethers.parseEther("30"),
        milestoneDescriptions,
        milestonePercentages,
        { value: CREATION_FEE }
      );

      const campaign2Address = await factory.campaigns(1);
      const SimpleCampaign = await ethers.getContractFactory("SimpleCampaign");
      const campaign2 = SimpleCampaign.attach(campaign2Address) as SimpleCampaign;

      // Fund both campaigns
      await campaign.connect(contributors[1]).fund({ value: ethers.parseEther("25") });
      await campaign2.connect(contributors[2]).fund({ value: ethers.parseEther("15") });

      // Complete milestones in both campaigns
      await campaign.connect(founder).completeMilestone(0);
      await campaign2.connect(contributors[0]).completeMilestone(0);

      // Verify both campaigns are independent
      const campaign1Data = await campaign.getCampaignData();
      const campaign2Data = await campaign2.getCampaignData();
      
      expect(campaign1Data.totalRaised).to.equal(ethers.parseEther("25"));
      expect(campaign2Data.totalRaised).to.equal(ethers.parseEther("15"));
    });
  });

  describe("Edge Cases and Error Handling", function () {
    it("Should handle funding goal exactly reached", async function () {
      // Fund exactly to the goal
      await campaign.connect(contributors[0]).fund({ value: FUNDING_GOAL });

      // Should not allow additional funding
      await expect(
        campaign.connect(contributors[1]).fund({ value: ethers.parseEther("1") })
      ).to.be.revertedWithCustomError(campaign, "FundingGoalReached");
    });

    it("Should handle zero funding milestone completion", async function () {
      // Complete milestone with no funding
      await expect(campaign.connect(founder).completeMilestone(0))
        .to.not.be.reverted;

      const milestone = await campaign.getMilestone(0);
      expect(milestone.state).to.equal(1); // Completed
    });

    it("Should prevent operations on completed campaign", async function () {
      // Fund and complete all milestones
      await campaign.connect(contributors[0]).fund({ value: FUNDING_GOAL });
      await campaign.connect(founder).completeMilestone(0);
      await campaign.connect(founder).completeMilestone(1);
      await campaign.connect(founder).completeMilestone(2);

      // Should not allow additional funding
      await expect(
        campaign.connect(contributors[1]).fund({ value: ethers.parseEther("1") })
      ).to.be.revertedWithCustomError(campaign, "CampaignNotActive");

      // Should not allow milestone completion
      await expect(
        campaign.connect(founder).completeMilestone(0)
      ).to.be.revertedWithCustomError(campaign, "CampaignNotActive");
    });

    it("Should handle refunds after partial milestone completion", async function () {
      // Fund and complete one milestone
      await campaign.connect(contributors[0]).fund({ value: ethers.parseEther("30") });
      await campaign.connect(founder).completeMilestone(0);

      // Fail the campaign
      await campaign.connect(founder).failCampaign();

      // Should still allow refunds
      const contributorBalanceBefore = await ethers.provider.getBalance(await contributors[0].getAddress());
      await campaign.connect(contributors[0]).claimRefund();
      const contributorBalanceAfter = await ethers.provider.getBalance(await contributors[0].getAddress());
      
      // Should refund the remaining amount (70% of original contribution)
      const expectedRefund = ethers.parseEther("30") * 7000n / 10000n; // 21 ETH
      expect(contributorBalanceAfter - contributorBalanceBefore).to.be.closeTo(
        expectedRefund,
        ethers.parseEther("0.01")
      );
    });
  });

  describe("Factory Integration", function () {
    it("Should track multiple campaigns correctly", async function () {
      // Create multiple campaigns
      for (let i = 0; i < 3; i++) {
        await factory.connect(contributors[i]).createCampaign(
          `Campaign ${i}`,
          `Test campaign ${i}`,
          ethers.parseEther("20"),
          milestoneDescriptions,
          milestonePercentages,
          { value: CREATION_FEE }
        );
      }

      // Verify factory tracking
      expect(await factory.campaignCount()).to.equal(4); // 3 new + 1 from beforeEach
      expect(await factory.getAllCampaigns()).to.have.length(4);

      // Verify founder tracking
      const founderCampaigns = await factory.getFounderCampaigns(await founder.getAddress());
      expect(founderCampaigns).to.have.length(1);

      const contributor1Campaigns = await factory.getFounderCampaigns(await contributors[0].getAddress());
      expect(contributor1Campaigns).to.have.length(1);
    });

    it("Should handle fee collection and withdrawal", async function () {
      // Create multiple campaigns to generate fees
      const campaignCount = 5;
      const totalFees = CREATION_FEE * BigInt(campaignCount);

      for (let i = 0; i < campaignCount; i++) {
        await factory.connect(contributors[i % contributors.length]).createCampaign(
          `Campaign ${i}`,
          `Test campaign ${i}`,
          ethers.parseEther("10"),
          milestoneDescriptions,
          milestonePercentages,
          { value: CREATION_FEE }
        );
      }

      // Withdraw fees
      const ownerBalanceBefore = await ethers.provider.getBalance(await owner.getAddress());
      await factory.connect(owner).withdrawFees();
      const ownerBalanceAfter = await ethers.provider.getBalance(await owner.getAddress());

      expect(ownerBalanceAfter - ownerBalanceBefore).to.be.closeTo(
        totalFees,
        ethers.parseEther("0.01")
      );
    });
  });
});
