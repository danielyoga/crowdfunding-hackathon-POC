import { expect } from "chai";
import { ethers } from "hardhat";
import { Governance } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { time } from "@nomicfoundation/hardhat-network-helpers";

describe("Governance", function () {
  let governance: Governance;
  let owner: SignerWithAddress;
  let proposer: SignerWithAddress;
  let voter1: SignerWithAddress;
  let voter2: SignerWithAddress;
  let voter3: SignerWithAddress;
  let targetContract: SignerWithAddress;

  beforeEach(async function () {
    [owner, proposer, voter1, voter2, voter3, targetContract] = await ethers.getSigners();

    const GovernanceContract = await ethers.getContractFactory("Governance");
    governance = await GovernanceContract.deploy(owner.address);
    await governance.waitForDeployment();

    // Set up voting power for participants
    await governance.connect(owner).updateVotingPower(proposer.address, 150000); // 15%
    await governance.connect(owner).updateVotingPower(voter1.address, 300000); // 30%
    await governance.connect(owner).updateVotingPower(voter2.address, 250000); // 25%
    await governance.connect(owner).updateVotingPower(voter3.address, 300000); // 30%
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await governance.owner()).to.equal(owner.address);
    });

    it("Should initialize with correct constants", async function () {
      expect(await governance.VOTING_PERIOD()).to.equal(7n * 24n * 60n * 60n); // 7 days
      expect(await governance.EXECUTION_DELAY()).to.equal(2n * 24n * 60n * 60n); // 2 days
      expect(await governance.QUORUM_THRESHOLD()).to.equal(3000); // 30%
      expect(await governance.APPROVAL_THRESHOLD()).to.equal(6000); // 60%
    });

    it("Should start with zero proposals", async function () {
      expect(await governance.proposalCount()).to.equal(0);
    });
  });

  describe("Voting Power Management", function () {
    it("Should allow owner to update voting power", async function () {
      const newPower = 100000;
      
      await expect(governance.connect(owner).updateVotingPower(voter1.address, newPower))
        .to.emit(governance, "VotingPowerUpdated")
        .withArgs(voter1.address, 300000, newPower);

      expect(await governance.votingPower(voter1.address)).to.equal(newPower);
    });

    it("Should allow authorized contracts to update voting power", async function () {
      // Authorize a contract
      await governance.connect(owner).setContractAuthorization(targetContract.address, true);

      // Authorized contract can update voting power
      await governance.connect(targetContract).updateVotingPower(voter1.address, 200000);
      expect(await governance.votingPower(voter1.address)).to.equal(200000);
    });

    it("Should prevent unauthorized users from updating voting power", async function () {
      await expect(
        governance.connect(voter1).updateVotingPower(voter2.address, 100000)
      ).to.be.revertedWith("Not authorized");
    });
  });

  describe("Contract Authorization", function () {
    it("Should allow owner to authorize contracts", async function () {
      await expect(governance.connect(owner).setContractAuthorization(targetContract.address, true))
        .to.emit(governance, "ContractAuthorized")
        .withArgs(targetContract.address, true);

      expect(await governance.authorizedContracts(targetContract.address)).to.equal(true);
    });

    it("Should allow owner to deauthorize contracts", async function () {
      await governance.connect(owner).setContractAuthorization(targetContract.address, true);
      await governance.connect(owner).setContractAuthorization(targetContract.address, false);

      expect(await governance.authorizedContracts(targetContract.address)).to.equal(false);
    });

    it("Should prevent non-owner from authorizing contracts", async function () {
      await expect(
        governance.connect(voter1).setContractAuthorization(targetContract.address, true)
      ).to.be.reverted;
    });
  });

  describe("Proposal Creation", function () {
    it("Should create a proposal with sufficient voting power", async function () {
      const tx = await governance.connect(proposer).createProposal(
        0, // PlatformFee type
        "Increase Platform Fee",
        "Proposal to increase platform fee to 3%",
        "0x",
        ethers.ZeroAddress
      );

      await expect(tx)
        .to.emit(governance, "ProposalCreated");

      expect(await governance.proposalCount()).to.equal(1);
    });

    it("Should reject proposal from user without sufficient voting power", async function () {
      // Create user with low voting power (less than 10% required)
      const lowPowerUser = voter3;
      await governance.connect(owner).updateVotingPower(lowPowerUser.address, 50000); // 5%

      await expect(
        governance.connect(lowPowerUser).createProposal(
          0,
          "Test Proposal",
          "Should fail",
          "0x",
          ethers.ZeroAddress
        )
      ).to.be.revertedWithCustomError(governance, "InsufficientVotingPower");
    });

    it("Should store proposal details correctly", async function () {
      await governance.connect(proposer).createProposal(
        1, // EmergencyPause type
        "Emergency Pause",
        "Pause all campaigns due to security issue",
        "0x",
        ethers.ZeroAddress
      );

      const proposal = await governance.getProposal(0);
      expect(proposal.proposalType).to.equal(1);
      expect(proposal.title).to.equal("Emergency Pause");
      expect(proposal.description).to.equal("Pause all campaigns due to security issue");
      expect(proposal.proposer).to.equal(proposer.address);
      expect(proposal.state).to.equal(0); // Active
    });

    it("Should set correct voting period", async function () {
      const tx = await governance.connect(proposer).createProposal(
        0,
        "Test",
        "Test",
        "0x",
        ethers.ZeroAddress
      );

      const receipt = await tx.wait();
      const blockTimestamp = (await ethers.provider.getBlock(receipt!.blockNumber))!.timestamp;

      const proposal = await governance.getProposal(0);
      const expectedEndTime = BigInt(blockTimestamp) + 7n * 24n * 60n * 60n;

      expect(proposal.endTime).to.equal(expectedEndTime);
    });

    it("Should add proposal to active proposals list", async function () {
      await governance.connect(proposer).createProposal(
        0,
        "Test",
        "Test",
        "0x",
        ethers.ZeroAddress
      );

      const activeProposals = await governance.getActiveProposals();
      expect(activeProposals.length).to.equal(1);
      expect(activeProposals[0]).to.equal(0);
    });
  });

  describe("Voting on Proposals", function () {
    beforeEach(async function () {
      // Create a proposal
      await governance.connect(proposer).createProposal(
        0,
        "Test Proposal",
        "Test Description",
        "0x",
        ethers.ZeroAddress
      );
    });

    it("Should allow voting on active proposal", async function () {
      await expect(governance.connect(voter1).vote(0, true))
        .to.emit(governance, "VoteCast")
        .withArgs(0, voter1.address, true, 300000);

      const proposal = await governance.getProposal(0);
      expect(proposal.yesVotes).to.equal(300000);
    });

    it("Should allow voting NO", async function () {
      await governance.connect(voter1).vote(0, false);

      const proposal = await governance.getProposal(0);
      expect(proposal.noVotes).to.equal(300000);
    });

    it("Should prevent double voting", async function () {
      await governance.connect(voter1).vote(0, true);

      await expect(
        governance.connect(voter1).vote(0, true)
      ).to.be.revertedWithCustomError(governance, "AlreadyVoted");
    });

    it("Should prevent voting without voting power", async function () {
      const signers = await ethers.getSigners();
      const noPowerUser = signers[5];

      await expect(
        governance.connect(noPowerUser).vote(0, true)
      ).to.be.revertedWith("No voting power");
    });

    it("Should prevent voting after voting period ends", async function () {
      // Fast forward past voting period
      await time.increase(8 * 24 * 60 * 60); // 8 days

      await expect(
        governance.connect(voter1).vote(0, true)
      ).to.not.emit(governance, "VoteCast");
    });

    it("Should accumulate votes correctly", async function () {
      await governance.connect(voter1).vote(0, true); // 300000
      await governance.connect(voter2).vote(0, true); // 250000
      await governance.connect(voter3).vote(0, false); // 300000

      const proposal = await governance.getProposal(0);
      expect(proposal.yesVotes).to.equal(550000);
      expect(proposal.noVotes).to.equal(300000);
      expect(proposal.totalVotingPower).to.equal(850000);
    });

    it("Should store vote details correctly", async function () {
      await governance.connect(voter1).vote(0, true);

      const voteData = await governance.getVote(0, voter1.address);
      expect(voteData.votingPower).to.equal(300000);
      expect(voteData.hasVoted).to.equal(true);
      expect(voteData.support).to.equal(true);
    });
  });

  describe("Proposal Finalization", function () {
    beforeEach(async function () {
      await governance.connect(proposer).createProposal(
        0,
        "Test Proposal",
        "Test Description",
        "0x",
        ethers.ZeroAddress
      );
    });

    it("Should finalize proposal after voting period", async function () {
      await governance.connect(voter1).vote(0, true);
      await governance.connect(voter2).vote(0, true);

      await time.increase(8 * 24 * 60 * 60); // 8 days

      await expect(governance.finalizeProposal(0))
        .to.emit(governance, "ProposalStateChanged");
    });

    it("Should prevent finalization before voting period ends", async function () {
      await governance.connect(voter1).vote(0, true);

      await expect(
        governance.finalizeProposal(0)
      ).to.be.revertedWith("Voting still active");
    });

    it("Should mark proposal as Passed with sufficient YES votes and quorum", async function () {
      // Get enough votes to meet quorum (30%) and approval (60%)
      await governance.connect(voter1).vote(0, true); // 300000 = 30%
      await governance.connect(voter2).vote(0, true); // 250000 = 25%
      // Total: 550000 = 55% (meets quorum)
      // Yes: 550000, No: 0 = 100% approval (meets 60% threshold)

      await time.increase(8 * 24 * 60 * 60);
      await governance.finalizeProposal(0);

      const proposal = await governance.getProposal(0);
      expect(proposal.state).to.equal(1); // Passed
    });

    it("Should mark proposal as Failed without quorum", async function () {
      // Only 15% votes (below 30% quorum)
      await governance.connect(proposer).vote(0, true); // 150000 = 15%

      await time.increase(8 * 24 * 60 * 60);
      await governance.finalizeProposal(0);

      const proposal = await governance.getProposal(0);
      expect(proposal.state).to.equal(2); // Failed
    });

    it("Should mark proposal as Failed with quorum but insufficient approval", async function () {
      // Meet quorum but not approval threshold
      await governance.connect(voter1).vote(0, true); // 300000
      await governance.connect(voter2).vote(0, false); // 250000
      await governance.connect(voter3).vote(0, false); // 300000
      // Total: 850000 (meets quorum)
      // Yes: 300000, No: 550000 = 35% approval (below 60% threshold)

      await time.increase(8 * 24 * 60 * 60);
      await governance.finalizeProposal(0);

      const proposal = await governance.getProposal(0);
      expect(proposal.state).to.equal(2); // Failed
    });

    it("Should set execution time for passed proposals", async function () {
      await governance.connect(voter1).vote(0, true);
      await governance.connect(voter2).vote(0, true);

      await time.increase(8 * 24 * 60 * 60);
      const tx = await governance.finalizeProposal(0);
      const receipt = await tx.wait();
      const blockTimestamp = (await ethers.provider.getBlock(receipt!.blockNumber))!.timestamp;

      const proposal = await governance.getProposal(0);
      const expectedExecutionTime = BigInt(blockTimestamp) + 2n * 24n * 60n * 60n; // 2 day delay

      expect(proposal.executionTime).to.equal(expectedExecutionTime);
    });

    it("Should remove from active proposals list", async function () {
      await governance.connect(voter1).vote(0, false);
      await governance.connect(voter2).vote(0, false);

      await time.increase(8 * 24 * 60 * 60);
      await governance.finalizeProposal(0);

      const activeProposals = await governance.getActiveProposals();
      expect(activeProposals.length).to.equal(0);
    });
  });

  describe("Proposal Execution", function () {
    beforeEach(async function () {
      await governance.connect(proposer).createProposal(
        1, // EmergencyPause - doesn't require target contract
        "Emergency Pause",
        "Test execution",
        "0x",
        ethers.ZeroAddress
      );

      // Pass the proposal
      await governance.connect(voter1).vote(0, true);
      await governance.connect(voter2).vote(0, true);
      await time.increase(8 * 24 * 60 * 60);
      await governance.finalizeProposal(0);
    });

    it("Should execute passed proposal after delay", async function () {
      await time.increase(3 * 24 * 60 * 60); // 3 days (past 2 day delay)

      await expect(governance.executeProposal(0))
        .to.emit(governance, "ProposalExecuted");

      const proposal = await governance.getProposal(0);
      expect(proposal.state).to.equal(3); // Executed
    });

    it("Should prevent execution before delay", async function () {
      await expect(
        governance.executeProposal(0)
      ).to.be.revertedWithCustomError(governance, "ExecutionDelayNotMet");
    });

    it("Should prevent execution of non-passed proposals", async function () {
      // Create and fail a proposal
      await governance.connect(proposer).createProposal(
        0,
        "Failed Proposal",
        "Will fail",
        "0x",
        ethers.ZeroAddress
      );

      await governance.connect(voter1).vote(1, false);
      await governance.connect(voter2).vote(1, false);
      await time.increase(8 * 24 * 60 * 60);
      await governance.finalizeProposal(1);

      await time.increase(3 * 24 * 60 * 60);

      await expect(
        governance.executeProposal(1)
      ).to.be.revertedWithCustomError(governance, "ProposalNotPassed");
    });

    it("Should check if proposal can be executed", async function () {
      // Before delay
      expect(await governance.canExecuteProposal(0)).to.equal(false);

      // After delay
      await time.increase(3 * 24 * 60 * 60);
      expect(await governance.canExecuteProposal(0)).to.equal(true);
    });

    it("Should require authorized contract for external calls", async function () {
      // Create proposal with target contract that's not authorized
      await governance.connect(proposer).createProposal(
        0,
        "Update Fee",
        "Test",
        "0x12345678", // Some execution data
        targetContract.address
      );

      await governance.connect(voter1).vote(1, true);
      await governance.connect(voter2).vote(1, true);
      await time.increase(8 * 24 * 60 * 60);
      await governance.finalizeProposal(1);
      await time.increase(3 * 24 * 60 * 60);

      await expect(
        governance.executeProposal(1)
      ).to.be.revertedWithCustomError(governance, "UnauthorizedContract");
    });
  });

  describe("Proposal Cancellation", function () {
    beforeEach(async function () {
      await governance.connect(proposer).createProposal(
        0,
        "Test Proposal",
        "Test",
        "0x",
        ethers.ZeroAddress
      );
    });

    it("Should allow owner to cancel active proposal", async function () {
      await expect(governance.connect(owner).cancelProposal(0))
        .to.emit(governance, "ProposalStateChanged")
        .withArgs(0, 0, 4); // Active -> Cancelled

      const proposal = await governance.getProposal(0);
      expect(proposal.state).to.equal(4); // Cancelled
    });

    it("Should allow owner to cancel passed proposal", async function () {
      await governance.connect(voter1).vote(0, true);
      await governance.connect(voter2).vote(0, true);
      await time.increase(8 * 24 * 60 * 60);
      await governance.finalizeProposal(0);

      await governance.connect(owner).cancelProposal(0);

      const proposal = await governance.getProposal(0);
      expect(proposal.state).to.equal(4); // Cancelled
    });

    it("Should prevent non-owner from cancelling proposal", async function () {
      await expect(
        governance.connect(voter1).cancelProposal(0)
      ).to.be.reverted;
    });

    it("Should remove cancelled proposal from active list", async function () {
      await governance.connect(owner).cancelProposal(0);

      const activeProposals = await governance.getActiveProposals();
      expect(activeProposals.length).to.equal(0);
    });
  });

  describe("Proposal Results", function () {
    beforeEach(async function () {
      await governance.connect(proposer).createProposal(
        0,
        "Test Proposal",
        "Test",
        "0x",
        ethers.ZeroAddress
      );
    });

    it("Should return correct proposal results", async function () {
      await governance.connect(voter1).vote(0, true); // 300000
      await governance.connect(voter2).vote(0, true); // 250000
      await governance.connect(voter3).vote(0, false); // 300000

      const results = await governance.getProposalResults(0);

      expect(results.yesVotes).to.equal(550000);
      expect(results.noVotes).to.equal(300000);
      expect(results.totalVotingPower).to.equal(850000);
      expect(results.quorumMet).to.equal(true); // 850000 > 300000 (30%)
      expect(results.approved).to.equal(true); // 550000/850000 = 64.7% > 60%
    });

    it("Should indicate quorum not met", async function () {
      await governance.connect(proposer).vote(0, true); // Only 150000 = 15%

      const results = await governance.getProposalResults(0);
      expect(results.quorumMet).to.equal(false);
      expect(results.approved).to.equal(false);
    });

    it("Should indicate not approved despite quorum", async function () {
      await governance.connect(voter1).vote(0, false); // 300000
      await governance.connect(voter2).vote(0, false); // 250000
      await governance.connect(voter3).vote(0, true); // 300000

      const results = await governance.getProposalResults(0);
      expect(results.quorumMet).to.equal(true);
      expect(results.approved).to.equal(false); // 300000/850000 = 35% < 60%
    });
  });

  describe("Multiple Proposals", function () {
    it("Should handle multiple proposals correctly", async function () {
      // Create multiple proposals
      await governance.connect(proposer).createProposal(0, "Proposal 1", "Test 1", "0x", ethers.ZeroAddress);
      await governance.connect(proposer).createProposal(1, "Proposal 2", "Test 2", "0x", ethers.ZeroAddress);
      await governance.connect(proposer).createProposal(2, "Proposal 3", "Test 3", "0x", ethers.ZeroAddress);

      expect(await governance.proposalCount()).to.equal(3);

      const activeProposals = await governance.getActiveProposals();
      expect(activeProposals.length).to.equal(3);
    });

    it("Should track votes independently per proposal", async function () {
      await governance.connect(proposer).createProposal(0, "Proposal 1", "Test 1", "0x", ethers.ZeroAddress);
      await governance.connect(proposer).createProposal(1, "Proposal 2", "Test 2", "0x", ethers.ZeroAddress);

      await governance.connect(voter1).vote(0, true);
      await governance.connect(voter1).vote(1, false);

      const vote0 = await governance.getVote(0, voter1.address);
      const vote1 = await governance.getVote(1, voter1.address);

      expect(vote0.support).to.equal(true);
      expect(vote1.support).to.equal(false);
    });
  });

  describe("Edge Cases", function () {
    it("Should handle zero voting power gracefully", async function () {
      const signers = await ethers.getSigners();
      const zeroVotingPower = signers[10];

      // Governance contract doesn't have a receive function, so sending ETH will revert
      // This test verifies that the contract properly rejects invalid transactions
      await expect(
        zeroVotingPower.sendTransaction({
          to: await governance.getAddress(),
          value: 0
        })
      ).to.be.reverted;
    });

    it("Should handle proposal with no votes", async function () {
      await governance.connect(proposer).createProposal(
        0,
        "No Votes Proposal",
        "Test",
        "0x",
        ethers.ZeroAddress
      );

      await time.increase(8 * 24 * 60 * 60);
      await governance.finalizeProposal(0);

      const proposal = await governance.getProposal(0);
      expect(proposal.state).to.equal(2); // Failed (no quorum)
    });
  });
});

