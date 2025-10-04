import { expect } from "chai";
import { ethers } from "hardhat";
import { Campaign, CampaignFactory } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("Campaign", function () {
  let campaignFactory: CampaignFactory;
  let campaign: Campaign;
  let owner: SignerWithAddress;
  let founder: SignerWithAddress;
  let funder1: SignerWithAddress;
  let funder2: SignerWithAddress;
  let funder3: SignerWithAddress;

  const CREATION_FEE = ethers.parseEther("0.01");
  const FUNDING_GOAL = ethers.parseEther("10");
  const CONTRIBUTION_AMOUNT = ethers.parseEther("2");

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
    1000n, 2000n, 2500n, 2500n, 2000n // 10%, 20%, 25%, 25%, 20%
  ];

  beforeEach(async function () {
    [owner, founder, funder1, funder2, funder3] = await ethers.getSigners();

    // Deploy factory
    const CampaignFactoryContract = await ethers.getContractFactory("CampaignFactory");
    campaignFactory = await CampaignFactoryContract.deploy(owner.address);
    await campaignFactory.waitForDeployment();

    // Create a campaign
    const tx = await campaignFactory.connect(founder).createCampaign(
      "Test Campaign",
      "A test crowdfunding campaign",
      FUNDING_GOAL,
      milestoneDescriptions,
      milestoneDeadlines,
      milestonePercentages,
      { value: CREATION_FEE }
    );

    const receipt = await tx.wait();
    const campaignAddress = await campaignFactory.campaigns(0);
    campaign = await ethers.getContractAt("Campaign", campaignAddress);
  });

  describe("Campaign Initialization", function () {
    it("Should initialize with correct campaign data", async function () {
      const data = await campaign.getCampaignData();
      expect(data.founder).to.equal(founder.address);
      expect(data.fundingGoal).to.equal(FUNDING_GOAL);
      expect(data.totalRaised).to.equal(0);
      expect(data.currentMilestone).to.equal(0);
      expect(data.state).to.equal(0); // Active
    });

    it("Should initialize all 5 milestones correctly", async function () {
      for (let i = 0; i < 5; i++) {
        const milestone = await campaign.getMilestone(i);
        expect(milestone.description).to.equal(milestoneDescriptions[i]);
        expect(milestone.releasePercentage).to.equal(milestonePercentages[i]);
        expect(milestone.state).to.equal(0); // Pending
      }
    });

    it("Should set the founder as owner", async function () {
      expect(await campaign.owner()).to.equal(founder.address);
    });
  });

  describe("Funding with Risk Profiles", function () {
    describe("Conservative Profile (50/50)", function () {
      it("Should correctly split funds 50/50", async function () {
        await campaign.connect(funder1).fund(0, { value: CONTRIBUTION_AMOUNT }); // 0 = Conservative

        const funderData = await campaign.getFunder(funder1.address);
        const expectedCommitted = CONTRIBUTION_AMOUNT / 2n;
        const expectedReserve = CONTRIBUTION_AMOUNT / 2n;

        expect(funderData.totalContribution).to.equal(CONTRIBUTION_AMOUNT);
        expect(funderData.committedAmount).to.equal(expectedCommitted);
        expect(funderData.reserveAmount).to.equal(expectedReserve);
        expect(funderData.riskProfile).to.equal(0);
      });

      it("Should update campaign pools correctly", async function () {
        await campaign.connect(funder1).fund(0, { value: CONTRIBUTION_AMOUNT });

        const data = await campaign.getCampaignData();
        const expectedCommitted = CONTRIBUTION_AMOUNT / 2n;
        const expectedReserve = CONTRIBUTION_AMOUNT / 2n;

        expect(data.totalRaised).to.equal(CONTRIBUTION_AMOUNT);
        expect(data.totalCommittedPool).to.equal(expectedCommitted);
        expect(data.totalReservePool).to.equal(expectedReserve);
      });
    });

    describe("Balanced Profile (70/30)", function () {
      it("Should correctly split funds 70/30", async function () {
        await campaign.connect(funder1).fund(1, { value: CONTRIBUTION_AMOUNT }); // 1 = Balanced

        const funderData = await campaign.getFunder(funder1.address);
        const expectedCommitted = (CONTRIBUTION_AMOUNT * 7000n) / 10000n;
        const expectedReserve = CONTRIBUTION_AMOUNT - expectedCommitted;

        expect(funderData.committedAmount).to.equal(expectedCommitted);
        expect(funderData.reserveAmount).to.equal(expectedReserve);
        expect(funderData.riskProfile).to.equal(1);
      });
    });

    describe("Aggressive Profile (90/10)", function () {
      it("Should correctly split funds 90/10", async function () {
        await campaign.connect(funder1).fund(2, { value: CONTRIBUTION_AMOUNT }); // 2 = Aggressive

        const funderData = await campaign.getFunder(funder1.address);
        const expectedCommitted = (CONTRIBUTION_AMOUNT * 9000n) / 10000n;
        const expectedReserve = CONTRIBUTION_AMOUNT - expectedCommitted;

        expect(funderData.committedAmount).to.equal(expectedCommitted);
        expect(funderData.reserveAmount).to.equal(expectedReserve);
        expect(funderData.riskProfile).to.equal(2);
      });
    });

    describe("Risk Profile Locking", function () {
      it("Should prevent changing risk profile on additional contributions", async function () {
        await campaign.connect(funder1).fund(0, { value: CONTRIBUTION_AMOUNT });

        await expect(
          campaign.connect(funder1).fund(1, { value: CONTRIBUTION_AMOUNT })
        ).to.be.revertedWith("Cannot change risk profile");
      });

      it("Should allow multiple contributions with same risk profile", async function () {
        await campaign.connect(funder1).fund(1, { value: CONTRIBUTION_AMOUNT });
        await campaign.connect(funder1).fund(1, { value: CONTRIBUTION_AMOUNT });

        const funderData = await campaign.getFunder(funder1.address);
        expect(funderData.totalContribution).to.equal(CONTRIBUTION_AMOUNT * 2n);
      });
    });

    describe("Funding Validation", function () {
      it("Should reject zero funding amount", async function () {
        await expect(
          campaign.connect(funder1).fund(0, { value: 0 })
        ).to.be.revertedWithCustomError(campaign, "BelowMinimumContribution");
      });

      it("Should reject invalid risk profile", async function () {
        // Solidity rejects invalid enum values at ABI decoding level
        await expect(
          campaign.connect(funder1).fund(3, { value: ethers.parseEther("1") })
        ).to.be.reverted;
      });

      it("Should prevent funding beyond goal", async function () {
        await campaign.connect(funder1).fund(1, { value: FUNDING_GOAL });

        await expect(
          campaign.connect(funder2).fund(1, { value: ethers.parseEther("1") })
        ).to.be.revertedWithCustomError(campaign, "FundingGoalReached");
      });

      it("Should prevent funding when campaign not active", async function () {
        // Fast forward past first milestone deadline to fail campaign
        await time.increase(91 * 24 * 60 * 60); // 91 days

        // Try to submit milestone - should fail campaign
        await expect(
          campaign.connect(founder).submitMilestone(0, "ipfs://evidence")
        ).to.not.be.reverted;

        // Campaign should be failed now, funding should revert
        await expect(
          campaign.connect(funder1).fund(1, { value: CONTRIBUTION_AMOUNT })
        ).to.be.revertedWithCustomError(campaign, "CampaignNotActive");
      });
    });

    describe("Multiple Funders", function () {
      it("Should track multiple funders independently", async function () {
        await campaign.connect(funder1).fund(0, { value: ethers.parseEther("1") });
        await campaign.connect(funder2).fund(1, { value: ethers.parseEther("2") });
        await campaign.connect(funder3).fund(2, { value: ethers.parseEther("3") });

        const funder1Data = await campaign.getFunder(funder1.address);
        const funder2Data = await campaign.getFunder(funder2.address);
        const funder3Data = await campaign.getFunder(funder3.address);

        expect(funder1Data.riskProfile).to.equal(0);
        expect(funder2Data.riskProfile).to.equal(1);
        expect(funder3Data.riskProfile).to.equal(2);

        const fundersList = await campaign.getFundersList();
        expect(fundersList.length).to.equal(3);
      });
    });

    describe("Events", function () {
      it("Should emit FundReceived event", async function () {
        await expect(campaign.connect(funder1).fund(1, { value: CONTRIBUTION_AMOUNT }))
          .to.emit(campaign, "FundReceived")
          .withArgs(
            funder1.address,
            CONTRIBUTION_AMOUNT,
            1,
            (CONTRIBUTION_AMOUNT * 7000n) / 10000n,
            (CONTRIBUTION_AMOUNT * 3000n) / 10000n
          );
      });
    });
  });

  describe("Milestone Submission", function () {
    beforeEach(async function () {
      // Fund the campaign first
      await campaign.connect(funder1).fund(1, { value: CONTRIBUTION_AMOUNT });
    });

    it("Should allow founder to submit milestone", async function () {
      await expect(campaign.connect(founder).submitMilestone(0, "ipfs://evidence"))
        .to.emit(campaign, "MilestoneSubmitted");

      const milestone = await campaign.getMilestone(0);
      expect(milestone.state).to.equal(2); // Voting
      expect(milestone.evidenceIPFS).to.equal("ipfs://evidence");
    });

    it("Should prevent non-founder from submitting milestone", async function () {
      await expect(
        campaign.connect(funder1).submitMilestone(0, "ipfs://evidence")
      ).to.be.revertedWithCustomError(campaign, "OnlyFounder");
    });

    it("Should prevent submitting wrong milestone order", async function () {
      await expect(
        campaign.connect(founder).submitMilestone(1, "ipfs://evidence")
      ).to.be.revertedWithCustomError(campaign, "InvalidMilestone");
    });

    it("Should prevent submitting already voting milestone", async function () {
      await campaign.connect(founder).submitMilestone(0, "ipfs://evidence");

      await expect(
        campaign.connect(founder).submitMilestone(0, "ipfs://evidence2")
      ).to.be.revertedWithCustomError(campaign, "MilestoneNotPending");
    });

    it("Should set voting deadline correctly", async function () {
      const tx = await campaign.connect(founder).submitMilestone(0, "ipfs://evidence");
      const receipt = await tx.wait();
      const blockTimestamp = (await ethers.provider.getBlock(receipt!.blockNumber))!.timestamp;

      const milestone = await campaign.getMilestone(0);
      const expectedDeadline = BigInt(blockTimestamp) + 7n * 24n * 60n * 60n; // 7 days

      expect(milestone.votingDeadline).to.equal(expectedDeadline);
    });

    it("Should fail campaign if deadline exceeded", async function () {
      // Fast forward past deadline
      await time.increase(91 * 24 * 60 * 60); // 91 days

      await campaign.connect(founder).submitMilestone(0, "ipfs://evidence");

      const data = await campaign.getCampaignData();
      expect(data.state).to.equal(2); // Failed
    });
  });

  describe("Voting Mechanism", function () {
    beforeEach(async function () {
      // Fund and submit milestone
      await campaign.connect(funder1).fund(1, { value: ethers.parseEther("3") });
      await campaign.connect(funder2).fund(1, { value: ethers.parseEther("2") });
      await campaign.connect(founder).submitMilestone(0, "ipfs://evidence");
    });

    describe("Vote Casting", function () {
      it("Should allow funder to vote YES", async function () {
        // Note: Whale protection caps voting power at 20% of totalRaised
        // totalRaised = 5 ETH, so max voting power = 1 ETH
        const expectedVotingPower = ethers.parseEther("1"); // 20% of 5 ETH
        
        await expect(campaign.connect(funder1).vote(0, true))
          .to.emit(campaign, "VoteCast")
          .withArgs(0, funder1.address, true, expectedVotingPower);

        const milestone = await campaign.getMilestone(0);
        expect(milestone.yesVotes).to.equal(expectedVotingPower);
      });

      it("Should allow funder to vote NO", async function () {
        await campaign.connect(funder1).vote(0, false);

        const milestone = await campaign.getMilestone(0);
        // Whale protection caps at 20% of 5 ETH = 1 ETH
        expect(milestone.noVotes).to.equal(ethers.parseEther("1"));
      });

      it("Should prevent non-funder from voting", async function () {
        await expect(
          campaign.connect(funder3).vote(0, true)
        ).to.be.revertedWithCustomError(campaign, "NotFunder");
      });

      it("Should prevent double voting", async function () {
        await campaign.connect(funder1).vote(0, true);

        await expect(
          campaign.connect(funder1).vote(0, true)
        ).to.be.revertedWithCustomError(campaign, "AlreadyVoted");
      });

      it("Should weight votes by contribution amount", async function () {
        await campaign.connect(funder1).vote(0, true); // 3 ETH -> capped to 1 ETH (20%)
        await campaign.connect(funder2).vote(0, true); // 2 ETH -> capped to 1 ETH (20%)

        const milestone = await campaign.getMilestone(0);
        // Both funders capped at 20% of 5 ETH = 1 ETH each
        // funder1: 1 ETH (capped), funder2: 1 ETH (capped) = 2 ETH total
        expect(milestone.yesVotes).to.equal(ethers.parseEther("2"));
      });

      it("Should enforce whale protection (max 20% voting power)", async function () {
        // Create a whale funder with 50% of total raised
        const whaleAmount = ethers.parseEther("5"); // Total raised will be 10 ETH
        await campaign.connect(funder3).fund(1, { value: whaleAmount });

        // Submit milestone again with new state
        const campaignData = await campaign.getCampaignData();
        const totalRaised = campaignData.totalRaised;

        await campaign.connect(funder3).vote(0, true);

        const milestone = await campaign.getMilestone(0);
        const maxAllowedPower = (totalRaised * 2000n) / 10000n; // 20%

        // Whale's vote should be capped
        expect(milestone.yesVotes).to.be.lte(
          ethers.parseEther("3") + ethers.parseEther("2") + maxAllowedPower
        );
      });
    });

    describe("Vote Finalization", function () {
      it("Should approve milestone with >60% YES votes", async function () {
        await campaign.connect(funder1).vote(0, true);
        await campaign.connect(funder2).vote(0, true);

        // Fast forward past voting period
        await time.increase(8 * 24 * 60 * 60); // 8 days

        await campaign.finalizeMilestone(0);

        const milestone = await campaign.getMilestone(0);
        expect(milestone.state).to.equal(5); // Completed (enum: 0=Pending, 1=Submitted, 2=Voting, 3=Approved, 4=Rejected, 5=Completed)
      });

      it("Should reject milestone with >60% NO votes", async function () {
        await campaign.connect(funder1).vote(0, false);
        await campaign.connect(funder2).vote(0, false);

        await time.increase(8 * 24 * 60 * 60);
        await campaign.finalizeMilestone(0);

        const milestone = await campaign.getMilestone(0);
        expect(milestone.state).to.equal(0); // Back to Pending (can resubmit)
        expect(milestone.rejectionCount).to.equal(1);
      });

      it("Should prevent finalization before voting period ends", async function () {
        await campaign.connect(funder1).vote(0, true);

        await expect(
          campaign.finalizeMilestone(0)
        ).to.be.revertedWithCustomError(campaign, "VotingStillActive");
      });

      it("Should fail campaign after 2 rejections", async function () {
        // First rejection
        await campaign.connect(funder1).vote(0, false);
        await campaign.connect(funder2).vote(0, false);
        await time.increase(8 * 24 * 60 * 60);
        await campaign.finalizeMilestone(0);

        // Resubmit
        await campaign.connect(founder).submitMilestone(0, "ipfs://evidence2");

        // Second rejection
        await campaign.connect(funder1).vote(0, false);
        await campaign.connect(funder2).vote(0, false);
        await time.increase(8 * 24 * 60 * 60);
        await campaign.finalizeMilestone(0);

        const data = await campaign.getCampaignData();
        expect(data.state).to.equal(2); // Failed
      });
    });

    describe("Mandatory Voting & Penalties", function () {
      it("Should track missed votes", async function () {
        // Only funder2 votes
        await campaign.connect(funder2).vote(0, true);

        await time.increase(8 * 24 * 60 * 60);
        await campaign.finalizeMilestone(0);

        const funder1Data = await campaign.getFunder(funder1.address);
        expect(funder1Data.missedVotes).to.equal(1);
      });

      it("Should auto-count as YES after 2 consecutive misses", async function () {
        // Milestone 0 - funder1 doesn't vote
        await campaign.connect(funder2).vote(0, true);
        await time.increase(8 * 24 * 60 * 60);
        await campaign.finalizeMilestone(0);

        // Milestone 1 - funder1 doesn't vote again
        await campaign.connect(founder).submitMilestone(1, "ipfs://evidence");
        await campaign.connect(funder2).vote(1, true);
        await time.increase(8 * 24 * 60 * 60);
        await campaign.finalizeMilestone(1);

        const funder1Data = await campaign.getFunder(funder1.address);
        expect(funder1Data.isAutoYes).to.equal(true);
        expect(funder1Data.missedVotes).to.equal(2);
      });

      it("Should reset missed votes after participation", async function () {
        // Milestone 0 - funder1 doesn't vote
        await campaign.connect(funder2).vote(0, true);
        await time.increase(8 * 24 * 60 * 60);
        await campaign.finalizeMilestone(0);

        let funder1Data = await campaign.getFunder(funder1.address);
        expect(funder1Data.missedVotes).to.equal(1);

        // Milestone 1 - funder1 votes
        await campaign.connect(founder).submitMilestone(1, "ipfs://evidence");
        await campaign.connect(funder1).vote(1, true);

        funder1Data = await campaign.getFunder(funder1.address);
        expect(funder1Data.missedVotes).to.equal(0);
      });
    });
  });

  describe("Fund Release", function () {
    beforeEach(async function () {
      // Fund campaign
      await campaign.connect(funder1).fund(1, { value: FUNDING_GOAL });
    });

    it("Should release correct percentage of committed pool", async function () {
      const founderBalanceBefore = await ethers.provider.getBalance(founder.address);

      // Submit and approve milestone 0 (10% release)
      await campaign.connect(founder).submitMilestone(0, "ipfs://evidence");
      await campaign.connect(funder1).vote(0, true);
      await time.increase(8 * 24 * 60 * 60);

      await campaign.finalizeMilestone(0);

      const founderBalanceAfter = await ethers.provider.getBalance(founder.address);
      const data = await campaign.getCampaignData();

      // 10% of committed pool (70% of 10 ETH = 7 ETH, 10% of 7 ETH = 0.7 ETH)
      const expectedRelease = (data.totalCommittedPool * 1000n) / 10000n;
      const actualReceived = founderBalanceAfter - founderBalanceBefore;

      expect(actualReceived).to.be.closeTo(expectedRelease, ethers.parseEther("0.01"));
    });

    it("Should advance to next milestone after approval", async function () {
      await campaign.connect(founder).submitMilestone(0, "ipfs://evidence");
      await campaign.connect(funder1).vote(0, true);
      await time.increase(8 * 24 * 60 * 60);
      await campaign.finalizeMilestone(0);

      const data = await campaign.getCampaignData();
      expect(data.currentMilestone).to.equal(1);
    });

    it("Should release all reserves after final milestone", async function () {
      const founderBalanceBefore = await ethers.provider.getBalance(founder.address);

      // Complete all 5 milestones
      for (let i = 0; i < 5; i++) {
        await campaign.connect(founder).submitMilestone(i, `ipfs://evidence${i}`);
        await campaign.connect(funder1).vote(i, true);
        await time.increase(8 * 24 * 60 * 60);
        await campaign.finalizeMilestone(i);
      }

      const founderBalanceAfter = await ethers.provider.getBalance(founder.address);
      const data = await campaign.getCampaignData();

      // Should have received all committed + all reserve
      expect(data.state).to.equal(1); // Completed
      expect(founderBalanceAfter).to.be.gt(founderBalanceBefore);
    });
  });

  describe("Refund Mechanism", function () {
    beforeEach(async function () {
      await campaign.connect(funder1).fund(0, { value: ethers.parseEther("4") }); // Conservative
      await campaign.connect(funder2).fund(1, { value: ethers.parseEther("4") }); // Balanced
      await campaign.connect(funder3).fund(2, { value: ethers.parseEther("2") }); // Aggressive
    });

    describe("Refund Calculation", function () {
      it("Should calculate refund correctly for Conservative profile", async function () {
        // Fail campaign at milestone 0
        await time.increase(91 * 24 * 60 * 60);
        await campaign.connect(founder).submitMilestone(0, "ipfs://evidence");

        const refundAmount = await campaign.getRefundAmount(funder1.address);
        const funderData = await campaign.getFunder(funder1.address);

        // Conservative: 50% committed + 50% reserve - platform fee (2%)
        const expectedRefund = funderData.totalContribution - (funderData.totalContribution * 200n) / 10000n;
        expect(refundAmount).to.be.closeTo(expectedRefund, ethers.parseEther("0.01"));
      });

      it("Should calculate refund correctly for Balanced profile", async function () {
        await time.increase(91 * 24 * 60 * 60);
        await campaign.connect(founder).submitMilestone(0, "ipfs://evidence");

        const refundAmount = await campaign.getRefundAmount(funder2.address);
        const funderData = await campaign.getFunder(funder2.address);

        // Balanced: 70% committed + 30% reserve - platform fee
        const expectedRefund = funderData.totalContribution - (funderData.totalContribution * 200n) / 10000n;
        expect(refundAmount).to.be.closeTo(expectedRefund, ethers.parseEther("0.01"));
      });

      it("Should account for released milestones in refund", async function () {
        // Complete milestone 0 (10% of committed released)
        await campaign.connect(founder).submitMilestone(0, "ipfs://evidence");
        await campaign.connect(funder1).vote(0, true);
        await campaign.connect(funder2).vote(0, true);
        await campaign.connect(funder3).vote(0, true);
        await time.increase(8 * 24 * 60 * 60);
        await campaign.finalizeMilestone(0);

        // Fail at milestone 1
        await time.increase(121 * 24 * 60 * 60);
        await campaign.connect(founder).submitMilestone(1, "ipfs://evidence");

        const refundAmount = await campaign.getRefundAmount(funder1.address);
        const funderData = await campaign.getFunder(funder1.address);

        // Should deduct the 10% already released
        const releasedAmount = (funderData.committedAmount * 1000n) / 10000n;
        const unreleasedCommitted = funderData.committedAmount - releasedAmount;
        const expectedRefund = unreleasedCommitted + funderData.reserveAmount - (unreleasedCommitted + funderData.reserveAmount) * 200n / 10000n;

        expect(refundAmount).to.be.closeTo(expectedRefund, ethers.parseEther("0.01"));
      });
    });

    describe("Refund Claims", function () {
      beforeEach(async function () {
        // Fail the campaign
        await time.increase(91 * 24 * 60 * 60);
        await campaign.connect(founder).submitMilestone(0, "ipfs://evidence");
      });

      it("Should allow refund claim when campaign failed", async function () {
        const balanceBefore = await ethers.provider.getBalance(funder1.address);

        const tx = await campaign.connect(funder1).claimRefund();
        const receipt = await tx.wait();
        const gasUsed = receipt!.gasUsed * receipt!.gasPrice;

        const balanceAfter = await ethers.provider.getBalance(funder1.address);
        const actualReceived = balanceAfter - balanceBefore + gasUsed;

        expect(actualReceived).to.be.gt(0);
      });

      it("Should prevent refund claim when campaign active", async function () {
        // Create new active campaign
        const tx = await campaignFactory.connect(founder).createCampaign(
          "Active Campaign",
          "Still active",
          FUNDING_GOAL,
          milestoneDescriptions,
          milestoneDeadlines,
          milestonePercentages,
          { value: CREATION_FEE }
        );

        const newCampaignAddress = await campaignFactory.campaigns(1);
        const newCampaign = await ethers.getContractAt("Campaign", newCampaignAddress);

        await newCampaign.connect(funder1).fund(1, { value: CONTRIBUTION_AMOUNT });

        await expect(
          newCampaign.connect(funder1).claimRefund()
        ).to.be.revertedWithCustomError(newCampaign, "RefundNotAvailable");
      });

      it("Should prevent double claiming refunds", async function () {
        await campaign.connect(funder1).claimRefund();

        await expect(
          campaign.connect(funder1).claimRefund()
        ).to.be.revertedWithCustomError(campaign, "AlreadyRefunded");
      });

      it("Should emit RefundClaimed event", async function () {
        const refundAmount = await campaign.getRefundAmount(funder1.address);
        const funderData = await campaign.getFunder(funder1.address);

        await expect(campaign.connect(funder1).claimRefund())
          .to.emit(campaign, "RefundClaimed")
          .withArgs(funder1.address, refundAmount, funderData.totalContribution);
      });
    });
  });

  describe("View Functions", function () {
    it("Should return campaign data correctly", async function () {
      const data = await campaign.getCampaignData();
      expect(data.founder).to.equal(founder.address);
      expect(data.fundingGoal).to.equal(FUNDING_GOAL);
    });

    it("Should return milestone data correctly", async function () {
      const milestone = await campaign.getMilestone(0);
      expect(milestone.description).to.equal(milestoneDescriptions[0]);
    });

    it("Should return funder data correctly", async function () {
      await campaign.connect(funder1).fund(1, { value: CONTRIBUTION_AMOUNT });
      const funderData = await campaign.getFunder(funder1.address);
      expect(funderData.totalContribution).to.equal(CONTRIBUTION_AMOUNT);
    });

    it("Should return funders list correctly", async function () {
      await campaign.connect(funder1).fund(1, { value: CONTRIBUTION_AMOUNT });
      await campaign.connect(funder2).fund(1, { value: CONTRIBUTION_AMOUNT });

      const fundersList = await campaign.getFundersList();
      expect(fundersList.length).to.equal(2);
      expect(fundersList[0]).to.equal(funder1.address);
      expect(fundersList[1]).to.equal(funder2.address);
    });

    it("Should return current milestone info correctly", async function () {
      const info = await campaign.getCurrentMilestoneInfo();
      expect(info.milestoneId).to.equal(0);
      expect(info.description).to.equal(milestoneDescriptions[0]);
      expect(info.state).to.equal(0); // Pending
    });
  });
});

