import { expect } from "chai";
import { ethers } from "hardhat";
import { Campaign, CampaignFactory, Governance } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("Integration Tests - End-to-End Scenarios", function () {
  let campaignFactory: CampaignFactory;
  let governance: Governance;
  let campaign: Campaign;
  let owner: SignerWithAddress;
  let founder: SignerWithAddress;
  let funders: SignerWithAddress[];

  const CREATION_FEE = ethers.parseEther("0.01");
  const FUNDING_GOAL = ethers.parseEther("100");

  const milestoneDescriptions: [string, string, string, string, string] = [
    "Prototype Development",
    "Early Traction",
    "Strategic Partnership",
    "Revenue Proof",
    "Public Launch"
  ];

  const milestoneDeadlines: [bigint, bigint, bigint, bigint, bigint] = [
    30n, 90n, 150n, 240n, 330n  // Cumulative: 30, 90, 150, 240, 330 days (within 365 max)
  ];

  const milestonePercentages: [bigint, bigint, bigint, bigint, bigint] = [
    1000n, 2000n, 2500n, 2500n, 2000n
  ];

  beforeEach(async function () {
    const signers = await ethers.getSigners();
    owner = signers[0];
    founder = signers[1];
    funders = signers.slice(2, 12); // 10 funders

    // Deploy Governance
    const GovernanceContract = await ethers.getContractFactory("Governance");
    governance = await GovernanceContract.deploy(owner.address);
    await governance.waitForDeployment();

    // Deploy CampaignFactory
    const CampaignFactoryContract = await ethers.getContractFactory("CampaignFactory");
    campaignFactory = await CampaignFactoryContract.deploy(owner.address);
    await campaignFactory.waitForDeployment();

    // Authorize factory in governance
    await governance.connect(owner).setContractAuthorization(
      await campaignFactory.getAddress(),
      true
    );
  });

  describe("Complete Success Flow", function () {
    it("Should complete entire campaign lifecycle successfully", async function () {
      // Step 1: Founder creates campaign
      const tx = await campaignFactory.connect(founder).createCampaign(
        "Revolutionary DApp",
        "A decentralized application for social good",
        FUNDING_GOAL,
        milestoneDescriptions,
        milestoneDeadlines,
        milestonePercentages,
        { value: CREATION_FEE }
      );

      const campaignAddress = await campaignFactory.campaigns(0);
      campaign = await ethers.getContractAt("Campaign", campaignAddress);

      expect(await campaign.owner()).to.equal(founder.address);

      // Step 2: Multiple funders contribute with different risk profiles
      const contributions = [
        { funder: funders[0], amount: ethers.parseEther("15"), profile: 0 }, // Conservative
        { funder: funders[1], amount: ethers.parseEther("20"), profile: 1 }, // Balanced
        { funder: funders[2], amount: ethers.parseEther("25"), profile: 2 }, // Aggressive
        { funder: funders[3], amount: ethers.parseEther("10"), profile: 0 }, // Conservative
        { funder: funders[4], amount: ethers.parseEther("30"), profile: 1 }, // Balanced
      ];

      let totalRaised = 0n;
      for (const contrib of contributions) {
        await campaign.connect(contrib.funder).fund(contrib.profile, {
          value: contrib.amount
        });
        totalRaised += contrib.amount;
      }

      const campaignData = await campaign.getCampaignData();
      expect(campaignData.totalRaised).to.equal(totalRaised);
      expect(await campaign.getFundersList()).to.have.lengthOf(5);

      // Step 3: Track founder balance to verify fund releases
      let founderBalanceBefore = await ethers.provider.getBalance(founder.address);

      // Step 4: Complete all 5 milestones
      for (let milestoneId = 0; milestoneId < 5; milestoneId++) {
        // Founder submits milestone
        await campaign.connect(founder).submitMilestone(
          milestoneId,
          `ipfs://evidence-milestone-${milestoneId}`
        );

        const milestone = await campaign.getMilestone(milestoneId);
        expect(milestone.state).to.equal(2); // Voting

        // All funders vote YES
        for (const contrib of contributions) {
          await campaign.connect(contrib.funder).vote(milestoneId, true);
        }

        // Fast forward past voting period
        await time.increase(8 * 24 * 60 * 60);

        // Finalize milestone
        await campaign.finalizeMilestone(milestoneId);

        const finalizedMilestone = await campaign.getMilestone(milestoneId);
        expect(finalizedMilestone.state).to.equal(5); // Completed
      }

      // Step 5: Verify campaign completed and reserves released
      const finalData = await campaign.getCampaignData();
      expect(finalData.state).to.equal(1); // Completed

      const founderBalanceAfter = await ethers.provider.getBalance(founder.address);
      
      // Founder should have received all committed + all reserves
      // (minus gas costs, but should be significantly higher)
      expect(founderBalanceAfter).to.be.gt(founderBalanceBefore);

      // Step 6: Verify no refunds available (campaign succeeded)
      for (const contrib of contributions) {
        const refundAmount = await campaign.getRefundAmount(contrib.funder.address);
        expect(refundAmount).to.equal(0);
      }
    });
  });

  describe("Partial Failure Flow", function () {
    it("Should handle campaign failure at milestone 3 with correct refunds", async function () {
      // Create and fund campaign
      const tx = await campaignFactory.connect(founder).createCampaign(
        "Failed Project",
        "This project will fail at milestone 3",
        FUNDING_GOAL,
        milestoneDescriptions,
        milestoneDeadlines,
        milestonePercentages,
        { value: CREATION_FEE }
      );

      const campaignAddress = await campaignFactory.campaigns(0);
      campaign = await ethers.getContractAt("Campaign", campaignAddress);

      // Fund with different risk profiles
      await campaign.connect(funders[0]).fund(0, { value: ethers.parseEther("30") }); // Conservative
      await campaign.connect(funders[1]).fund(1, { value: ethers.parseEther("40") }); // Balanced
      await campaign.connect(funders[2]).fund(2, { value: ethers.parseEther("30") }); // Aggressive

      // Complete milestones 0 and 1 successfully
      for (let milestoneId = 0; milestoneId < 2; milestoneId++) {
        await campaign.connect(founder).submitMilestone(milestoneId, `ipfs://evidence-${milestoneId}`);
        
        for (let i = 0; i < 3; i++) {
          await campaign.connect(funders[i]).vote(milestoneId, true);
        }

        await time.increase(8 * 24 * 60 * 60);
        await campaign.finalizeMilestone(milestoneId);
      }

      // Milestone 2 (index 2) fails - submit but get rejected twice
      // First rejection
      await campaign.connect(founder).submitMilestone(2, `ipfs://bad-evidence`);
      
      for (let i = 0; i < 3; i++) {
        await campaign.connect(funders[i]).vote(2, false); // Vote NO
      }

      await time.increase(8 * 24 * 60 * 60);
      await campaign.finalizeMilestone(2);

      // Resubmit and get rejected again
      await campaign.connect(founder).submitMilestone(2, `ipfs://still-bad-evidence`);
      
      for (let i = 0; i < 3; i++) {
        await campaign.connect(funders[i]).vote(2, false); // Vote NO again
      }

      await time.increase(8 * 24 * 60 * 60);
      await campaign.finalizeMilestone(2);

      // Campaign should be failed
      const campaignData = await campaign.getCampaignData();
      expect(campaignData.state).to.equal(2); // Failed

      // Calculate expected refunds for each risk profile
      const funder0Data = await campaign.getFunder(funders[0].address);
      const funder1Data = await campaign.getFunder(funders[1].address);
      const funder2Data = await campaign.getFunder(funders[2].address);

      // Milestones 0 (10%) and 1 (20%) were completed = 30% of committed released
      const releasedPercentage = 1000n + 2000n; // 30% in basis points

      // Conservative funder (50/50 split)
      const funder0ReleasedCommitted = (funder0Data.committedAmount * releasedPercentage) / 10000n;
      const funder0UnreleasedCommitted = funder0Data.committedAmount - funder0ReleasedCommitted;
      const funder0ExpectedRefund = funder0UnreleasedCommitted + funder0Data.reserveAmount;
      const funder0ExpectedRefundAfterFee = funder0ExpectedRefund - (funder0ExpectedRefund * 200n) / 10000n;

      // Balanced funder (70/30 split)
      const funder1ReleasedCommitted = (funder1Data.committedAmount * releasedPercentage) / 10000n;
      const funder1UnreleasedCommitted = funder1Data.committedAmount - funder1ReleasedCommitted;
      const funder1ExpectedRefund = funder1UnreleasedCommitted + funder1Data.reserveAmount;
      const funder1ExpectedRefundAfterFee = funder1ExpectedRefund - (funder1ExpectedRefund * 200n) / 10000n;

      // Aggressive funder (90/10 split)
      const funder2ReleasedCommitted = (funder2Data.committedAmount * releasedPercentage) / 10000n;
      const funder2UnreleasedCommitted = funder2Data.committedAmount - funder2ReleasedCommitted;
      const funder2ExpectedRefund = funder2UnreleasedCommitted + funder2Data.reserveAmount;
      const funder2ExpectedRefundAfterFee = funder2ExpectedRefund - (funder2ExpectedRefund * 200n) / 10000n;

      // Verify refund calculations
      const refund0 = await campaign.getRefundAmount(funders[0].address);
      const refund1 = await campaign.getRefundAmount(funders[1].address);
      const refund2 = await campaign.getRefundAmount(funders[2].address);

      expect(refund0).to.be.closeTo(funder0ExpectedRefundAfterFee, ethers.parseEther("0.01"));
      expect(refund1).to.be.closeTo(funder1ExpectedRefundAfterFee, ethers.parseEther("0.01"));
      expect(refund2).to.be.closeTo(funder2ExpectedRefundAfterFee, ethers.parseEther("0.01"));

      // Claim refunds
      const balances = [];
      for (let i = 0; i < 3; i++) {
        balances[i] = await ethers.provider.getBalance(funders[i].address);
      }

      for (let i = 0; i < 3; i++) {
        await campaign.connect(funders[i]).claimRefund();
      }

      // Verify refunds received
      for (let i = 0; i < 3; i++) {
        const newBalance = await ethers.provider.getBalance(funders[i].address);
        expect(newBalance).to.be.gt(balances[i]);
      }
    });
  });

  describe("Multi-Funder Complex Scenario", function () {
    it("Should handle 10 funders with mixed risk profiles and voting patterns", async function () {
      // Create campaign
      const tx = await campaignFactory.connect(founder).createCampaign(
        "Complex Campaign",
        "Testing complex funder interactions",
        FUNDING_GOAL,
        milestoneDescriptions,
        milestoneDeadlines,
        milestonePercentages,
        { value: CREATION_FEE }
      );

      const campaignAddress = await campaignFactory.campaigns(0);
      campaign = await ethers.getContractAt("Campaign", campaignAddress);

      // 10 funders with mixed profiles
      const funderProfiles = [0, 1, 2, 0, 1, 2, 0, 1, 2, 1]; // Mix of Conservative, Balanced, Aggressive
      const funderAmounts = [
        ethers.parseEther("5"),
        ethers.parseEther("8"),
        ethers.parseEther("12"),
        ethers.parseEther("6"),
        ethers.parseEther("10"),
        ethers.parseEther("15"),
        ethers.parseEther("7"),
        ethers.parseEther("9"),
        ethers.parseEther("11"),
        ethers.parseEther("17"),
      ];

      // All funders contribute
      for (let i = 0; i < 10; i++) {
        await campaign.connect(funders[i]).fund(funderProfiles[i], {
          value: funderAmounts[i]
        });
      }

      const fundersList = await campaign.getFundersList();
      expect(fundersList).to.have.lengthOf(10);

      // Milestone 0: Everyone votes
      await campaign.connect(founder).submitMilestone(0, "ipfs://evidence-0");
      
      for (let i = 0; i < 10; i++) {
        await campaign.connect(funders[i]).vote(0, true);
      }

      await time.increase(8 * 24 * 60 * 60);
      await campaign.finalizeMilestone(0);

      // Verify voting worked correctly
      const milestone0 = await campaign.getMilestone(0);
      expect(milestone0.state).to.equal(5); // Completed

      // Verify no one missed votes
      for (let i = 0; i < 10; i++) {
        const funderData = await campaign.getFunder(funders[i].address);
        expect(funderData.missedVotes).to.equal(0);
      }

      // Milestone 1: Some funders don't vote (test mandatory voting)
      await campaign.connect(founder).submitMilestone(1, "ipfs://evidence-1");
      
      // Only first 6 funders vote
      for (let i = 0; i < 6; i++) {
        await campaign.connect(funders[i]).vote(1, true);
      }

      await time.increase(8 * 24 * 60 * 60);
      await campaign.finalizeMilestone(1);

      // Verify missed votes tracked
      for (let i = 6; i < 10; i++) {
        const funderData = await campaign.getFunder(funders[i].address);
        expect(funderData.missedVotes).to.equal(1);
      }

      // Milestone 2: Non-voters from M1 miss again (should trigger auto-YES)
      await campaign.connect(founder).submitMilestone(2, "ipfs://evidence-2");
      
      // Only first 6 funders vote again
      for (let i = 0; i < 6; i++) {
        await campaign.connect(funders[i]).vote(2, true);
      }

      await time.increase(8 * 24 * 60 * 60);
      await campaign.finalizeMilestone(2);

      // Verify chronic non-voters are flagged
      for (let i = 6; i < 10; i++) {
        const funderData = await campaign.getFunder(funders[i].address);
        expect(funderData.missedVotes).to.equal(2);
        expect(funderData.isAutoYes).to.equal(true);
      }
    });
  });

  describe("Platform Statistics", function () {
    it("Should track platform-wide statistics correctly", async function () {
      // Create multiple campaigns
      for (let i = 0; i < 3; i++) {
        await campaignFactory.connect(founder).createCampaign(
          `Campaign ${i}`,
          `Description ${i}`,
          FUNDING_GOAL,
          milestoneDescriptions,
          milestoneDeadlines,
          milestonePercentages,
          { value: CREATION_FEE }
        );
      }

      // Check platform stats
      const stats = await campaignFactory.getPlatformStats();
      expect(stats.totalCampaigns).to.equal(3);
      expect(stats.activeCampaignsCount).to.equal(3);
      expect(stats.currentPlatformFee).to.equal(200); // 2%
      expect(stats.currentCreationFee).to.equal(CREATION_FEE);

      // Get all campaigns
      const allCampaigns = await campaignFactory.getAllCampaigns();
      expect(allCampaigns).to.have.lengthOf(3);

      // Get founder's campaigns
      const founderCampaigns = await campaignFactory.getFounderCampaigns(founder.address);
      expect(founderCampaigns).to.have.lengthOf(3);
    });
  });

  describe("Gas Optimization Tests", function () {
    it("Should handle 10+ funders without hitting gas limits", async function () {
      this.timeout(120000); // 2 minutes timeout for this test

      const tx = await campaignFactory.connect(founder).createCampaign(
        "Large Campaign",
        "Testing scalability",
        ethers.parseEther("1000"),
        milestoneDescriptions,
        milestoneDeadlines,
        milestonePercentages,
        { value: CREATION_FEE }
      );

      const campaignAddress = await campaignFactory.campaigns(0);
      campaign = await ethers.getContractAt("Campaign", campaignAddress);

      // Create 10 funder accounts (Hardhat provides 20 signers by default)
      const largeFunderCount = 10;
      const allSigners = await ethers.getSigners();
      const largeFunders: SignerWithAddress[] = [];
      
      for (let i = 0; i < largeFunderCount; i++) {
        largeFunders.push(allSigners[i + 10]);
      }

      // All funders contribute small amounts
      for (let i = 0; i < largeFunderCount; i++) {
        await campaign.connect(largeFunders[i]).fund(1, {
          value: ethers.parseEther("1")
        });
      }

      // Submit milestone
      await campaign.connect(founder).submitMilestone(0, "ipfs://evidence");

      // Half the funders vote
      for (let i = 0; i < 5; i++) {
        await campaign.connect(largeFunders[i]).vote(0, true);
      }

      // Finalize with 10 funders - this tests the loop in _finalizeMilestone
      await time.increase(8 * 24 * 60 * 60);
      
      // This should not revert due to gas limits
      const finalizeTx = await campaign.finalizeMilestone(0);
      const receipt = await finalizeTx.wait();
      
      // Verify it didn't use excessive gas
      expect(receipt!.gasUsed).to.be.lt(15000000); // Less than block gas limit
    });
  });

  describe("Edge Case: Whale Protection", function () {
    it("Should cap voting power of whale at 20%", async function () {
      const tx = await campaignFactory.connect(founder).createCampaign(
        "Whale Test Campaign",
        "Testing whale protection",
        ethers.parseEther("100"),
        milestoneDescriptions,
        milestoneDeadlines,
        milestonePercentages,
        { value: CREATION_FEE }
      );

      const campaignAddress = await campaignFactory.campaigns(0);
      campaign = await ethers.getContractAt("Campaign", campaignAddress);

      // Small funders
      await campaign.connect(funders[0]).fund(1, { value: ethers.parseEther("5") });
      await campaign.connect(funders[1]).fund(1, { value: ethers.parseEther("5") });

      // Whale funder (60% of total)
      await campaign.connect(funders[2]).fund(1, { value: ethers.parseEther("60") });

      // Small funders
      await campaign.connect(funders[3]).fund(1, { value: ethers.parseEther("5") });
      await campaign.connect(funders[4]).fund(1, { value: ethers.parseEther("5") });

      // Total: 80 ETH, whale has 60 ETH (75%)

      // Submit milestone
      await campaign.connect(founder).submitMilestone(0, "ipfs://evidence");

      // Whale votes YES
      await campaign.connect(funders[2]).vote(0, true);

      // Others vote NO
      await campaign.connect(funders[0]).vote(0, false);
      await campaign.connect(funders[1]).vote(0, false);
      await campaign.connect(funders[3]).vote(0, false);
      await campaign.connect(funders[4]).vote(0, false);

      await time.increase(8 * 24 * 60 * 60);
      await campaign.finalizeMilestone(0);

      const milestone = await campaign.getMilestone(0);
      const campaignData = await campaign.getCampaignData();

      // Whale's voting power should be capped at 20% of total
      const maxWhaleVotingPower = (campaignData.totalRaised * 2000n) / 10000n;
      
      // YES votes should be capped
      expect(milestone.yesVotes).to.be.lte(maxWhaleVotingPower);

      // NO votes should be full weight (20 ETH total)
      expect(milestone.noVotes).to.equal(ethers.parseEther("20"));

      // Since NO votes > capped YES votes, milestone should be rejected
      expect(milestone.state).to.equal(0); // Back to Pending
    });
  });
});

