# 🚀 Lisk Crowdfunding Platform - Complete Documentation

**A Comprehensive Guide to the Decentralized Milestone-Based Crowdfunding Platform**

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Quick Start Guide](#quick-start-guide)
3. [Platform Overview](#platform-overview)
4. [Technical Architecture](#technical-architecture)
5. [Smart Contracts Deep Dive](#smart-contracts-deep-dive)
6. [Milestone Voting System](#milestone-voting-system)
7. [Founder Submission Guide](#founder-submission-guide)
8. [User Flows & Interactions](#user-flows--interactions)
9. [Frontend Implementation](#frontend-implementation)
10. [Deployment Guide](#deployment-guide)
11. [Testing & Development](#testing--development)
12. [API Reference](#api-reference)

---

## 1. Executive Summary

### What is This Platform?

The **Lisk Crowdfunding Platform** is a decentralized, milestone-based crowdfunding solution built on Lisk L2 that revolutionizes project funding through:

- ✅ **Milestone-Based Fund Release** - Funds released incrementally as projects complete 3 milestones
- ✅ **Simplified Model** - No complex voting or risk profiles (removed for simplicity)
- ✅ **Founder Control** - Founders mark milestones as complete to release funds
- ✅ **Automatic Refunds** - Failed campaigns trigger automatic refund calculations
- ✅ **Low Fees** - 2% platform fee, significantly cheaper on Lisk L2
- ✅ **Full Transparency** - All transactions on-chain and verifiable

### Key Innovations

**Simplification from Original Design:**
- ❌ Removed complex voting mechanisms
- ❌ Removed risk profiles (Conservative/Balanced/Aggressive)
- ❌ Removed governance system
- ❌ Removed whale protection
- ✅ Kept core milestone-based funding
- ✅ Kept automatic refund system
- ✅ Simplified to 3 milestones instead of 5

**Result:** 73% smaller codebase, easier to use, faster to deploy

### Technology Stack

**Blockchain:**
- Solidity 0.8.26
- Lisk L2 (Ethereum Layer 2)
- OpenZeppelin contracts
- Deployed on Lisk Sepolia testnet

**Frontend:**
- Next.js 14 with App Router
- TypeScript
- TailwindCSS + shadcn/ui
- Wagmi + RainbowKit for Web3
- Responsive mobile-first design

**Development:**
- Hardhat development environment
- Comprehensive test suite (113 tests)
- TypeScript for testing
- Ethers.js v6

### Platform Metrics

| Metric | Value |
|--------|-------|
| **Contract Size** | Campaign: 9.0 KB, Factory: 16.3 KB |
| **Test Coverage** | 113 passing tests |
| **Gas Optimization** | Tested with 10+ concurrent funders |
| **Deployment** | Lisk Sepolia testnet ready |
| **Documentation** | 13 comprehensive guides |

---

## 2. Quick Start Guide

### 🚀 5-Minute Setup (Local Development)

#### Prerequisites
- Node.js 18+
- npm or yarn
- MetaMask browser extension

#### Terminal 1: Start Hardhat Node
```bash
npx hardhat node
```

Keep this running! You'll see 20 test accounts with 10,000 ETH each.

#### Terminal 2: Deploy Contracts
```bash
npx hardhat run scripts/deploy-and-save.ts --network localhost
```

Note the deployed Factory address (e.g., `0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0`)

#### Terminal 3: Start Frontend
```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000`

#### MetaMask Setup

**Add Hardhat Network:**
- Network Name: `Hardhat Local`
- RPC URL: `http://127.0.0.1:8545`
- Chain ID: `31337`
- Currency Symbol: `ETH`

**Import Test Account:**
```
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

You should now see 10,000 ETH!

### 🌐 Deploy to Lisk Sepolia

```bash
# 1. Get testnet ETH
# Visit: https://sepolia-faucet.lisk.com/

# 2. Set up environment
cp .env.example .env
# Edit .env with your PRIVATE_KEY

# 3. Deploy
npm run deploy:lisk-sepolia

# 4. Update frontend
cd frontend
# Update contracts.ts with deployed addresses

# 5. Start frontend
npm run dev
```

---

## 3. Platform Overview

### Core Concepts

#### Milestone-Based Funding

Unlike traditional crowdfunding where founders receive all funds upfront, this platform releases funds progressively:

```
Campaign Created
    ↓
Funding Phase (Contributors fund the campaign)
    ↓
Milestone 1: Prototype (30% of goal)
    ↓ Founder completes → Funds released
Milestone 2: Beta (40% of goal)
    ↓ Founder completes → Funds released
Milestone 3: Launch (30% of goal)
    ↓ Founder completes → Funds released
    ↓
Campaign Completed!
```

#### Key Features

**1. Simple Campaign Creation**
- Title: 3-100 characters
- Description: 1-1000 characters
- Funding Goal: 0.01-10000 ETH
- 3 Milestones: Each with description, deadline, and release percentage

**2. Direct Funding**
- Contributors fund campaigns directly with ETH
- Minimum contribution: 0.001 ETH
- No complex risk profiles or voting
- Funds held in smart contract escrow

**3. Founder-Controlled Milestones**
- Founders mark milestones as complete
- Funds automatically released to founder
- Simple, straightforward process
- No voting or approval needed

**4. Automatic Refunds**
- Campaign fails if funding goal not reached
- Campaign fails if founder marks it as failed
- All contributors can claim refunds
- 2% platform fee deducted from refunds

### How It Works

#### For Founders (Project Creators)

1. **Create Campaign**
   - Define project details
   - Set funding goal
   - Create 3 milestones with deadlines
   - Pay creation fee (~0.001 ETH)

2. **Raise Funds**
   - Share campaign link
   - Wait for contributions
   - Track progress

3. **Deliver Milestones**
   - Work on project
   - Complete milestone
   - Mark milestone as complete
   - Receive funds automatically

4. **Complete Project**
   - Complete all 3 milestones
   - Receive 100% of funds
   - Campaign marked as successful

#### For Contributors (Backers)

1. **Browse Projects**
   - View all active campaigns
   - Read project descriptions
   - Check milestone roadmap

2. **Fund Campaign**
   - Choose amount (min 0.001 ETH)
   - Confirm transaction
   - Contribution recorded on-chain

3. **Track Progress**
   - Monitor milestone completion
   - See funds released to founder
   - View campaign status

4. **Get Refunds (if needed)**
   - If campaign fails
   - Claim refund with one click
   - Receive remaining funds (minus 2% fee)

### Simplification Benefits

**Original Design Had:**
- 5 milestones
- Complex voting mechanism (60% approval)
- Risk profiles (Conservative/Balanced/Aggressive)
- Anti-whale protection
- Mandatory voting enforcement
- Auto-YES for non-voters
- Governance system
- Total: 1317 lines of Solidity

**Simplified Design Has:**
- 3 milestones
- Founder-controlled completion
- Direct funding (no profiles)
- Simple refund system
- Total: 350 lines of Solidity

**Result:** 73% smaller, easier to use, faster to deploy!

---

## 4. Technical Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                   │
│  - Campaign browsing & creation                          │
│  - Wallet connection (RainbowKit)                        │
│  - Fund campaigns                                        │
│  - Track milestones                                      │
│  - Claim refunds                                         │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ Web3 Provider (Wagmi/Ethers.js)
                     │
┌────────────────────▼────────────────────────────────────┐
│              Smart Contracts (Lisk L2)                   │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  SimpleFactory.sol                             │    │
│  │  - Creates campaigns                           │    │
│  │  - Validates inputs                            │    │
│  │  - Tracks all campaigns                        │    │
│  │  - Collects creation fees                      │    │
│  └────────────────────────────────────────────────┘    │
│                         │                               │
│                         │ deploys                       │
│                         ↓                               │
│  ┌────────────────────────────────────────────────┐    │
│  │  SimpleCampaign.sol (per campaign)             │    │
│  │  - Receives contributions                      │    │
│  │  - Manages 3 milestones                        │    │
│  │  - Releases funds to founder                   │    │
│  │  - Processes refunds                           │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### Contract Architecture

#### SimpleFactory.sol

**Purpose:** Deploy and manage campaigns

**Key Functions:**
- `createCampaign()` - Deploy new campaign contract
- `getCampaigns()` - List all campaigns
- `getFounderCampaigns()` - Get campaigns by founder

**State Variables:**
- `campaigns[]` - Array of campaign addresses
- `campaignCount` - Total campaigns created
- `creationFee` - Fee to create campaign (0.001 ETH)
- `platformFeePercentage` - Platform fee (200 = 2%)

#### SimpleCampaign.sol

**Purpose:** Individual campaign logic

**Key Functions:**
- `fund()` - Contribute ETH to campaign
- `completeMilestone()` - Mark milestone as complete (founder only)
- `markCampaignFailed()` - Mark campaign as failed (founder only)
- `claimRefund()` - Claim refund (if campaign failed)

**Data Structures:**
```solidity
struct CampaignData {
    string title;
    string description;
    address founder;
    uint256 fundingGoal;
    uint256 totalRaised;
    uint256 currentMilestone;  // 0, 1, or 2
    CampaignState state;       // Active, Completed, Failed
    uint256 createdAt;
}

struct Milestone {
    string description;
    uint256 releasePercentage;  // 30%, 40%, 30%
    uint256 deadline;
    bool completed;
}

struct Funder {
    uint256 totalContribution;
    bool hasRefunded;
    uint256 fundedAt;
}
```

### State Management

**Campaign States:**
```
Active (0)
    ├─→ Completed (1)  [All milestones complete]
    └─→ Failed (2)     [Founder marks failed]
```

**Milestone Flow:**
```
Pending → Founder works on it
    ↓
Complete → Founder marks complete
    ↓
Funds Released → Automatically sent to founder
```

### Fund Flow

**Example: 10 ETH Campaign**

```
Campaign Goal: 10 ETH
├─→ Funder A contributes: 4 ETH
├─→ Funder B contributes: 3 ETH
└─→ Funder C contributes: 3 ETH
Total: 10 ETH (100%)

Milestone 1 (30%): Completed
    → Release: 3 ETH to founder
    → Remaining: 7 ETH

Milestone 2 (40%): Completed
    → Release: 4 ETH to founder
    → Remaining: 3 ETH

Milestone 3 (30%): Completed
    → Release: 3 ETH to founder
    → Remaining: 0 ETH

Campaign Completed! Founder received 10 ETH
```

**Refund Scenario:**

```
Campaign Goal: 10 ETH
Total Raised: 6 ETH (60%)
Milestones: None completed

Founder marks campaign as FAILED

Funder A (4 ETH):
    → Refund calculation: 4 ETH - 2% fee
    → Receives: 3.92 ETH

Funder B (2 ETH):
    → Refund calculation: 2 ETH - 2% fee
    → Receives: 1.96 ETH
```

---

## 5. Smart Contracts Deep Dive

### SimpleFactory.sol

**Contract Size:** 16.3 KB

#### Key Constants
```solidity
uint256 public constant MIN_FUNDING_GOAL = 0.01 ether;
uint256 public constant MAX_FUNDING_GOAL = 10000 ether;
uint256 public constant MIN_TITLE_LENGTH = 3;
uint256 public constant MAX_TITLE_LENGTH = 100;
uint256 public constant MAX_DESCRIPTION_LENGTH = 1000;
```

#### Create Campaign Function

```solidity
function createCampaign(
    string calldata title,
    string calldata description,
    uint256 fundingGoal,
    string[3] calldata milestoneDescriptions,
    uint256[3] calldata milestoneDeadlines,
    uint256[3] calldata milestonePercentages
) external payable returns (address)
```

**Validation:**
1. Creation fee paid (msg.value >= creationFee)
2. Title: 3-100 characters
3. Description: 1-1000 characters
4. Funding goal: 0.01-10000 ETH
5. Milestone descriptions: not empty
6. Milestone deadlines: chronological
7. Milestone percentages: sum to 100%

**Process:**
1. Validate all inputs
2. Deploy new SimpleCampaign contract
3. Record campaign address
4. Track founder campaigns
5. Emit CampaignCreated event

### SimpleCampaign.sol

**Contract Size:** 9.0 KB

#### Fund Function

```solidity
function fund() external payable nonReentrant campaignActive whenNotPaused {
    require(msg.value >= MIN_CONTRIBUTION, "Below minimum");
    require(campaignData.state == CampaignState.Active, "Not active");
    
    // Update funder record
    if (funders[msg.sender].totalContribution == 0) {
        fundersList.push(msg.sender);
    }
    
    funders[msg.sender].totalContribution += msg.value;
    funders[msg.sender].fundedAt = block.timestamp;
    
    // Update campaign total
    campaignData.totalRaised += msg.value;
    
    emit FundReceived(msg.sender, msg.value);
}
```

**Security Features:**
- ✅ ReentrancyGuard
- ✅ Pausable
- ✅ Minimum contribution check
- ✅ State validation
- ✅ Event emission

#### Complete Milestone Function

```solidity
function completeMilestone(uint256 milestoneId) external onlyFounder {
    require(milestoneId < 3, "Invalid milestone");
    require(!milestones[milestoneId].completed, "Already completed");
    require(block.timestamp <= milestones[milestoneId].deadline, "Deadline passed");
    
    // Mark as completed
    milestones[milestoneId].completed = true;
    
    // Calculate release amount
    uint256 releaseAmount = (campaignData.totalRaised * 
                             milestones[milestoneId].releasePercentage) / 100;
    
    // Update current milestone
    campaignData.currentMilestone = milestoneId + 1;
    
    // Release funds
    if (releaseAmount > 0) {
        (bool success, ) = payable(campaignData.founder).call{value: releaseAmount}("");
        require(success, "Transfer failed");
    }
    
    // Check if all milestones completed
    if (milestoneId == 2) {
        campaignData.state = CampaignState.Completed;
    }
    
    emit MilestoneCompleted(milestoneId, releaseAmount);
}
```

**Checks-Effects-Interactions Pattern:**
1. **CHECKS:** Validate milestone, deadline, state
2. **EFFECTS:** Update state (milestone.completed, currentMilestone)
3. **INTERACTIONS:** External call to send funds

#### Refund Function

```solidity
function claimRefund() external nonReentrant {
    require(campaignData.state == CampaignState.Failed, "Not failed");
    require(funders[msg.sender].totalContribution > 0, "Not funder");
    require(!funders[msg.sender].hasRefunded, "Already refunded");
    
    // Calculate refund
    uint256 refundAmount = funders[msg.sender].totalContribution;
    uint256 platformFee = (refundAmount * platformFeePercentage) / 10000;
    uint256 finalRefund = refundAmount - platformFee;
    
    // Mark as refunded
    funders[msg.sender].hasRefunded = true;
    
    // Transfer refund
    (bool success, ) = payable(msg.sender).call{value: finalRefund}("");
    require(success, "Refund failed");
    
    emit RefundClaimed(msg.sender, finalRefund);
}
```

### Security Implementation

**1. Reentrancy Protection**
- OpenZeppelin ReentrancyGuard
- Checks-Effects-Interactions pattern
- State updates before external calls

**2. Access Control**
- `onlyFounder` modifier
- `campaignActive` modifier
- `whenNotPaused` modifier

**3. Input Validation**
- Length checks
- Range checks
- Sum validation
- Existence checks

**4. Emergency Controls**
- Pausable by founder
- Emergency pause by platform owner
- Refunds work when paused

---

## 6. Milestone Voting System

### Overview

A comprehensive voting system has been implemented to allow investors to validate milestone submissions before funds are released. This ensures accountability and gives contributors control over fund distribution.

### Smart Contract Implementation (SimpleCampaign.sol)

#### Voting Data in Milestones
Each milestone now tracks:
- `submittedAt`: Timestamp when milestone was submitted
- `votingDeadline`: 7 days after submission
- `yesVotes`: Total ETH weight voting YES
- `noVotes`: Total ETH weight voting NO

#### Vote Tracking
- `hasVoted[milestoneId][contributor]`: Tracks who has voted
- `voteChoice[milestoneId][contributor]`: Records vote (YES/NO)

#### Key Functions

**`vote(uint256 milestoneId, bool voteYes)`**
- Allows contributors to vote on submitted milestones
- Votes are weighted by contribution amount
- Each contributor can only vote once per milestone
- Must be called during the 7-day voting period

**`finalizeVoting(uint256 milestoneId)`**
- Called by founder after voting period ends
- Requires >50% YES votes to approve
- If approved: Milestone is completed and funds are released
- If rejected: Milestone reverts to Pending state for resubmission

**`getHasVoted(uint256 milestoneId, address contributor)`**
- Check if a contributor has voted on a milestone

**`getVotingStats(uint256 milestoneId)`**
- Returns comprehensive voting statistics:
  - yesVotes: Total ETH voting YES
  - noVotes: Total ETH voting NO
  - totalVotes: Sum of all votes
  - yesPercentage: Percentage voting YES
  - votingDeadline: When voting ends
  - isActive: Whether voting is currently active

### Voting Constants
- `VOTING_PERIOD`: 7 days (604800 seconds)
- `APPROVAL_THRESHOLD`: 50% (requires >50% YES votes to pass)

### Voting Workflow

```
1. Founder Submits Milestone
   ├─→ Calls submitMilestone(milestoneId)
   ├─→ Milestone state changes to "Submitted"
   ├─→ Voting period starts (7 days)
   └─→ Event: MilestoneSubmitted(milestoneId, votingDeadline)
       ↓
2. Contributors Vote
   ├─→ Call vote(milestoneId, voteYes)
   ├─→ Vote weighted by contribution amount
   ├─→ Can only vote once per milestone
   └─→ Event: VoteCast(milestoneId, voter, voteYes, weight)
       ↓
3. Founder Finalizes
   ├─→ After 7 days, calls finalizeVoting(milestoneId)
   ├─→ Smart contract calculates vote percentage
   ├─→ If >50% YES: Milestone approved and funds released
   ├─→ If ≤50% YES: Milestone rejected, can be resubmitted
   └─→ Events: MilestoneApproved or MilestoneRejected
```

### Frontend Integration

#### Campaign Details Page (Investor View)

**Voting Section** appears when milestone is in `Submitted` state:
- Shows milestone information
- Displays voting statistics:
  - YES/NO vote percentages with progress bars
  - Total votes in ETH
  - Time remaining
- Provides YES/NO voting buttons
- Shows if user has already voted
- Indicates when voting period has ended

**Location**: Right sidebar of campaign details page

#### Milestone Timeline Component

**Enhanced Voting Display**:
- "Voting in Progress" badge for submitted milestones
- YES/NO vote percentages
- Vote amounts in ETH
- Time remaining indicator
- "Cast Your Vote" button (if applicable)
- Visual progress bars for vote distribution

#### Founder Campaign Management Page

**New Actions**:

**Submit Milestone Button**
- Available when milestone is in `Pending` state
- Triggers 7-day voting period
- Shows in both Milestones section and Quick Actions

**Finalize Voting Button**
- Available when milestone is in `Submitted` state
- Processes vote results
- Can be called after voting deadline
- Shows voting result in toast notification

**Visual Indicators**:
- "Voting Active" badge on submitted milestones
- Status badges for all milestone states
- Quick action buttons based on current state

### Mock Mode Support

The voting system fully supports mock mode (localStorage-based):

**Mock Data Structure:**
```javascript
milestone: {
  state: MilestoneState,
  submittedAt: timestamp,
  votingDeadline: timestamp,
  yesVotes: number (ETH),
  noVotes: number (ETH),
  voters: [address1, address2, ...]
}
```

**Mock Functions:**
- Vote tracking in localStorage
- Vote weight calculation based on contribution
- Voting period simulation
- Vote finalization with approval/rejection

### Security Features

1. **One Vote Per Contributor**: Each address can only vote once per milestone
2. **Weighted Voting**: Votes weighted by contribution prevents Sybil attacks
3. **Time-Locked**: Voting period cannot be bypassed
4. **Founder Cannot Vote**: Only contributors can cast votes
5. **Transparent Results**: All votes recorded on-chain
6. **No Vote Changes**: Votes are final once cast

### Voting Events

```solidity
event MilestoneSubmitted(uint256 indexed milestoneId, uint256 votingDeadline);
event VoteCast(uint256 indexed milestoneId, address indexed voter, bool voteYes, uint256 weight);
event MilestoneApproved(uint256 indexed milestoneId);
event MilestoneRejected(uint256 indexed milestoneId);
event MilestoneCompleted(uint256 indexed milestoneId, uint256 fundsReleased);
```

### Usage Guide

#### For Founders

1. **Submit a Milestone**
   - Navigate to founder campaign page
   - Click "Submit Milestone" button for current milestone
   - Confirm transaction
   - 7-day voting period begins

2. **Monitor Voting**
   - View voting stats on milestone timeline
   - Check vote percentages in real-time
   - Wait for voting period to end

3. **Finalize Results**
   - After 7 days, click "Finalize Voting"
   - If approved: Funds are released, move to next milestone
   - If rejected: Improve work and resubmit

#### For Investors

1. **View Active Voting**
   - Visit campaign details page
   - Voting section appears in sidebar when milestone is submitted
   - Review milestone details and current vote stats

2. **Cast Your Vote**
   - Click "Vote YES" to approve milestone
   - Click "Vote NO" to reject milestone
   - Your vote weight equals your contribution amount
   - You can only vote once per milestone

3. **Track Results**
   - View real-time voting statistics
   - See time remaining before deadline
   - Check if you've already voted
   - Monitor vote percentages

---

## 7. Founder Submission Guide

### Overview
As a founder, you need to submit evidence of completed work for each milestone. This guide explains what to submit, how to submit it, and what happens next.

### What to Submit

#### 1. Evidence (IPFS Hash)
Upload proof of your work to IPFS (InterPlanetary File System) for permanent, decentralized storage.

**Examples of Evidence:**
- Screenshots or demo videos of your work
- Source code (ZIP file) or GitHub repository link
- Documentation (PDF, Markdown files)
- Design files or prototypes
- Test results or performance metrics
- Any tangible deliverables

**Tips:**
- Compress multiple files into a ZIP to keep everything organized
- Make sure files are accessible and well-structured
- Test the IPFS link before submitting

#### 2. Description (Required)
Provide a detailed explanation of what you've completed. Minimum 10 characters, maximum 500 characters.

**What to Include:**
- **Summary of completed work**: Brief overview of what was accomplished
- **Key features or deliverables**: Specific items you've delivered
- **How to access/verify your work**: Instructions for reviewers
- **Any challenges overcome**: Context about the development process
- **Next steps** (if applicable): What comes next

**Example Description:**
```
I have successfully completed the initial prototype development. The key features include 
user authentication, database integration, and responsive UI. You can verify the work by 
accessing the IPFS link above which contains screenshots, source code, and a demo video. 
The prototype is fully functional and ready for testing. Next milestone will focus on 
adding advanced features and optimizations.
```

### Submission Process

#### Step 1: Navigate to Submission Page
1. Go to your campaign management page: `/founder/campaign/[your-campaign-address]`
2. Click "Submit Milestone [X]" button when the milestone is ready

#### Step 2: Upload Evidence
**Option A: Upload File to IPFS**
- Click the upload area or drag and drop your file
- Supported formats: Images, PDFs, ZIP files (max 100MB)
- Wait for upload to complete and IPFS hash to be generated

**Option B: Provide IPFS Hash**
- If you've already uploaded to IPFS externally, paste the hash
- Format: `Qm...` (IPFS hash format)
- Test the link to verify it works

#### Step 3: Write Description
- Provide a detailed description (min 10 characters)
- Follow the guidelines above for what to include
- Use the provided example as reference

#### Step 4: Review Checklist
Before submitting, verify:
- ✅ Evidence uploaded to IPFS
- ✅ IPFS link is working and accessible
- ✅ Detailed description provided
- ✅ Ready for community voting

#### Step 5: Submit for Voting
- Click "Submit for Voting" button
- In mock mode: Submission happens instantly
- In Web3 mode: Confirm the transaction in your wallet
- You'll be redirected to your campaign management page

### What Happens After Submission

#### Voting Period (7 Days)
Once you submit a milestone:
1. **Voting begins immediately** - Contributors have 7 days to vote
2. **Votes are weighted** - Each vote is weighted by contribution amount
3. **Threshold: >50% YES votes** - Milestone needs majority approval
4. **Investors review your evidence** - They can view your IPFS link and description

#### Voting Outcomes

**If Approved (>50% YES):**
- ✅ Milestone is marked as completed
- 💰 Funds are released to your wallet (according to release percentage)
- 📈 You can proceed to the next milestone
- 🎉 If all milestones completed, campaign is marked as completed

**If Rejected (≤50% YES):**
- ❌ Milestone is reset to "Pending" state
- 🔄 You need to improve your work and resubmit
- 💡 Review the feedback (if any) from investors
- 🛠️ Make necessary improvements before resubmitting

#### Finalizing Voting
After the 7-day voting period ends:
1. Go to your campaign management page
2. Click "Finalize Voting" button for the milestone
3. The system will calculate results and either approve or reject
4. If approved, funds are automatically released

### Milestone Structure

For SimpleCampaign contracts, there are 3 milestones with equal fund distribution:

| Milestone | Release % | Description |
|-----------|-----------|-------------|
| Milestone 0 | 33.33% | First major deliverable |
| Milestone 1 | 33.33% | Second major deliverable |
| Milestone 2 | 33.34% | Final deliverable |

**Total: 100% of raised funds**

### Best Practices

#### Do's ✅
- Provide comprehensive evidence
- Write clear, detailed descriptions
- Submit on time when work is complete
- Be transparent about what was delivered
- Respond to investor questions (if possible)
- Test your IPFS links before submitting

#### Don'ts ❌
- Don't submit incomplete work
- Don't provide broken or inaccessible IPFS links
- Don't write vague descriptions
- Don't rush submissions without proper documentation
- Don't ignore investor feedback

### Technical Details

#### IPFS (InterPlanetary File System)
- Decentralized storage protocol
- Content-addressed: Files are identified by their hash
- Permanent: Cannot be deleted or modified
- Accessible: Anyone can view the content via IPFS gateways

#### Voting Mechanism
- **Weighted Voting**: Vote power = contribution amount
- **Time-bound**: Exactly 7 days from submission
- **On-chain**: All votes recorded on blockchain (in Web3 mode)
- **Transparent**: Vote counts are publicly visible

#### Smart Contract Function
```solidity
function submitMilestone(uint256 milestoneId) external onlyFounder
```
- Only the campaign founder can submit milestones
- Must submit milestones in order (0, 1, 2)
- Starts a 7-day voting period
- Emits `MilestoneSubmitted` event

### FAQs

**Q: Can I edit my submission after submitting?**
A: No, submissions are immutable. However, if rejected, you can resubmit with improvements.

**Q: What if I miss the deadline?**
A: SimpleCampaign doesn't have hard deadlines on milestones, but delays may concern investors.

**Q: Can I submit multiple files?**
A: Yes, compress them into a ZIP file and upload that to IPFS.

**Q: What if my IPFS file is too large?**
A: Consider compressing files or splitting into multiple submissions. Max size is 100MB.

**Q: Can I see who voted YES or NO?**
A: In Web3 mode, votes are recorded on-chain and can be queried. In mock mode, votes are stored in localStorage.

**Q: What happens if no one votes?**
A: After 7 days, you can finalize voting. The outcome depends on the votes cast. No votes = no approval.

### Summary

The milestone submission process ensures transparency and accountability:
1. **Upload evidence** to IPFS
2. **Write detailed description** of your work
3. **Submit for voting** to start 7-day period
4. **Wait for votes** from investors
5. **Finalize after 7 days** to get results
6. **Receive funds** if approved, or improve and resubmit if rejected

Good luck with your submissions! 🚀

---

## 8. User Flows & Interactions

### Founder Flow

```
1. CREATE CAMPAIGN
   ├─→ Connect wallet
   ├─→ Fill campaign form:
   │   ├─→ Title (3-100 chars)
   │   ├─→ Description (1-1000 chars)
   │   ├─→ Funding goal (0.01-10000 ETH)
   │   └─→ 3 Milestones:
   │       ├─→ Descriptions
   │       ├─→ Deadlines
   │       └─→ Percentages (must sum to 100%)
   ├─→ Pay creation fee (~0.001 ETH)
   └─→ Campaign deployed!
       ↓
2. WAIT FOR FUNDING
   ├─→ Share campaign link
   ├─→ Monitor contributions
   └─→ Track progress to goal
       ↓
3. DELIVER MILESTONE 1
   ├─→ Work on prototype
   ├─→ Complete milestone
   ├─→ Mark as complete in app
   └─→ Receive 30% of funds
       ↓
4. DELIVER MILESTONE 2
   ├─→ Work on beta version
   ├─→ Complete milestone
   ├─→ Mark as complete
   └─→ Receive 40% of funds
       ↓
5. DELIVER MILESTONE 3
   ├─→ Complete final launch
   ├─→ Mark as complete
   └─→ Receive final 30% of funds
       ↓
6. CAMPAIGN COMPLETED! 🎉
   └─→ Received 100% of raised funds
```

### Contributor Flow

```
1. BROWSE PROJECTS
   ├─→ View all campaigns
   ├─→ Filter by status
   └─→ Search by name
       ↓
2. SELECT PROJECT
   ├─→ Read description
   ├─→ Check funding progress
   ├─→ Review milestones
   └─→ Verify founder info
       ↓
3. FUND PROJECT
   ├─→ Enter amount (min 0.001 ETH)
   ├─→ Confirm transaction
   └─→ Receive confirmation
       ↓
4. TRACK PROGRESS
   ├─→ Monitor milestone completion
   ├─→ See funds released
   └─→ View campaign status
       ↓
5. OUTCOME:
   ├─→ SUCCESS: Campaign completes
   │   └─→ Your contribution helped!
   │
   └─→ FAILURE: Campaign fails
       └─→ Claim refund (minus 2% fee)
```

### Campaign Lifecycle

```
┌─────────────────────────────────────────┐
│       CAMPAIGN CREATED                   │
│  - State: Active                         │
│  - Total Raised: 0 ETH                   │
│  - Current Milestone: 0                  │
└─────────────────┬───────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────┐
│       FUNDING PHASE                      │
│  - Contributors fund campaign            │
│  - Track progress to goal                │
│  - No time limit                         │
└─────────────────┬───────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────┐
│       MILESTONE 1: PROTOTYPE             │
│  - Founder works on it                   │
│  - Founder marks complete                │
│  - Release: 30% of total raised          │
│  - Current Milestone: 1                  │
└─────────────────┬───────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────┐
│       MILESTONE 2: BETA                  │
│  - Founder continues work                │
│  - Founder marks complete                │
│  - Release: 40% of total raised          │
│  - Current Milestone: 2                  │
└─────────────────┬───────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────┐
│       MILESTONE 3: LAUNCH                │
│  - Founder completes project             │
│  - Founder marks complete                │
│  - Release: 30% of total raised          │
│  - State: Completed                      │
└─────────────────┬───────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────┐
│       CAMPAIGN COMPLETED! ✅             │
│  - All funds released to founder         │
│  - Campaign marked successful            │
│  - Contributors see completion           │
└─────────────────────────────────────────┘
```

---

## 7. Frontend Implementation

### Required Pages

#### 1. Landing Page (`/`)
- Hero section
- Feature highlights
- How it works
- Platform statistics
- Call-to-action buttons

#### 2. Browse Campaigns (`/browse`)
- Campaign cards grid
- Search functionality
- Filter by status
- Sort options

#### 3. Campaign Details (`/campaign/[address]`)
- Campaign information
- Funding progress
- Milestone timeline
- Funding form
- Funder list

#### 4. Create Campaign (`/create`)
- Multi-step form
- Input validation
- Preview mode
- Transaction confirmation

#### 5. My Campaigns (`/my-campaigns`)
- Founder dashboard
- Campaign list
- Quick actions
- Statistics

#### 6. My Investments (`/my-investments`)
- Investor dashboard
- Investment portfolio
- Refund management
- History

### Key Components

#### CampaignCard
```typescript
export function CampaignCard({ address }: { address: string }) {
  const { data: campaignData } = useContractRead({
    address: address,
    abi: CAMPAIGN_ABI,
    functionName: 'getCampaignData',
  });

  const progress = (Number(campaignData.totalRaised) / 
                   Number(campaignData.fundingGoal)) * 100;

  return (
    <div className="border rounded-lg p-6">
      <h3>{campaignData.title}</h3>
      <p>{campaignData.description}</p>
      
      {/* Progress Bar */}
      <div className="progress-bar">
        <div style={{ width: `${progress}%` }} />
      </div>
      
      {/* Milestone Status */}
      <div>
        Milestone {campaignData.currentMilestone + 1}/3
      </div>
    </div>
  );
}
```

#### FundingForm
```typescript
export function FundingForm({ campaignAddress }: Props) {
  const [amount, setAmount] = useState('');
  
  const { write: fund } = useContractWrite({
    address: campaignAddress,
    abi: CAMPAIGN_ABI,
    functionName: 'fund',
  });

  const handleFund = () => {
    fund({
      value: parseEther(amount),
    });
  };

  return (
    <form>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        min="0.001"
      />
      <button onClick={handleFund}>
        Fund Campaign
      </button>
    </form>
  );
}
```

### Web3 Integration

#### Wallet Connection (RainbowKit)
```typescript
import { ConnectButton } from '@rainbow-me/rainbowkit';

export function Navigation() {
  return (
    <nav>
      <ConnectButton />
    </nav>
  );
}
```

#### Contract Interaction (Wagmi)
```typescript
import { useContractRead, useContractWrite } from 'wagmi';

// Read data
const { data } = useContractRead({
  address: FACTORY_ADDRESS,
  abi: FACTORY_ABI,
  functionName: 'getCampaigns',
});

// Write transaction
const { write } = useContractWrite({
  address: campaignAddress,
  abi: CAMPAIGN_ABI,
  functionName: 'completeMilestone',
});
```

### Responsive Design

**Mobile-First Approach:**
- Touch-friendly buttons
- Collapsible sections
- Bottom sheet modals
- Optimized layouts

**Breakpoints:**
- Mobile: < 640px
- Tablet: 640-1024px
- Desktop: > 1024px

---

## 8. Deployment Guide

### Local Development

**1. Start Hardhat Node**
```bash
npx hardhat node
```

**2. Deploy Contracts**
```bash
npx hardhat run scripts/deploy-and-save.ts --network localhost
```

**3. Start Frontend**
```bash
cd frontend
npm run dev
```

### Lisk Sepolia Testnet

**1. Get Testnet ETH**
- Visit: https://sepolia-faucet.lisk.com/
- Visit: https://console.optimism.io/faucet

**2. Set Up Environment**
```bash
cp .env.example .env
```

Edit `.env`:
```
PRIVATE_KEY=your_private_key_here
LISK_SEPOLIA_RPC_URL=https://rpc.sepolia-api.lisk.com
```

**3. Deploy Contracts**
```bash
npm run deploy:lisk-sepolia
```

**4. Verify Contracts**
```bash
npx hardhat verify --network liskSepolia <CONTRACT_ADDRESS>
```

**5. Update Frontend**
Edit `frontend/lib/contracts.ts`:
```typescript
export const CONTRACTS = {
  liskSepolia: {
    factoryAddress: '0x...', // Your deployed address
  },
};
```

### Lisk Mainnet

⚠️ **Only after security audit!**

**1. Final Checklist**
- [ ] Professional audit completed
- [ ] All tests passing
- [ ] Testnet testing (2+ weeks)
- [ ] Multi-sig wallet set up
- [ ] Emergency procedures documented

**2. Deploy**
```bash
npm run deploy:lisk
```

**3. Verify**
```bash
npx hardhat verify --network lisk <CONTRACT_ADDRESS>
```

---

## 9. Testing & Development

### Test Suite

**Total: 113 Tests Passing**

| Suite | Tests | Coverage |
|-------|-------|----------|
| Campaign | 51 | Funding, milestones, refunds |
| Factory | 15 | Creation, validation, fees |
| Governance | 35 | Proposals, voting, execution |
| Integration | 6 | End-to-end scenarios |
| Init | 6 | Deployment & setup |

### Run Tests

```bash
# All tests
npm test

# Specific suite
npm test -- --grep "Campaign"

# With gas reporting
npm run gas-report

# With coverage
npm run coverage
```

### Test Accounts

**Account #0 - Founder**
```
Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
Balance: 10,000 ETH
```

**Account #1 - Investor**
```
Address: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
Balance: 10,000 ETH
```

**Security Note:** ⚠️ Only use on local Hardhat network!

### Development Commands

```bash
# Compile contracts
npm run compile

# Clean artifacts
npx hardhat clean

# Run local node
npx hardhat node

# Deploy locally
npm run deploy:local

# Format code
npm run format

# Lint code
npm run lint
```

---

## 10. API Reference

### SimpleFactory

#### Write Functions

**createCampaign**
```solidity
function createCampaign(
    string calldata title,
    string calldata description,
    uint256 fundingGoal,
    string[3] calldata milestoneDescriptions,
    uint256[3] calldata milestoneDeadlines,
    uint256[3] calldata milestonePercentages
) external payable returns (address)
```

**Parameters:**
- `title` - Campaign title (3-100 chars)
- `description` - Campaign description (1-1000 chars)
- `fundingGoal` - Target amount (0.01-10000 ETH)
- `milestoneDescriptions` - Array of 3 milestone descriptions
- `milestoneDeadlines` - Array of 3 deadlines (in days)
- `milestonePercentages` - Array of 3 percentages (must sum to 100)

**Returns:** Address of deployed campaign

**Events:**
```solidity
event CampaignCreated(
    address indexed campaignAddress,
    address indexed founder,
    string title,
    uint256 fundingGoal
);
```

#### Read Functions

**getCampaigns**
```solidity
function getCampaigns() external view returns (address[] memory)
```

Returns: Array of all campaign addresses

**getFounderCampaigns**
```solidity
function getFounderCampaigns(address founder) external view returns (address[] memory)
```

Returns: Array of campaigns created by founder

**campaignCount**
```solidity
function campaignCount() external view returns (uint256)
```

Returns: Total number of campaigns created

### SimpleCampaign

#### Write Functions

**fund**
```solidity
function fund() external payable nonReentrant campaignActive whenNotPaused
```

Contribute ETH to campaign. Minimum: 0.001 ETH

**Events:**
```solidity
event FundReceived(address indexed funder, uint256 amount);
```

**completeMilestone**
```solidity
function completeMilestone(uint256 milestoneId) external onlyFounder
```

Mark milestone as complete and release funds.

**Parameters:**
- `milestoneId` - Milestone index (0, 1, or 2)

**Events:**
```solidity
event MilestoneCompleted(uint256 indexed milestoneId, uint256 releaseAmount);
```

**markCampaignFailed**
```solidity
function markCampaignFailed() external onlyFounder
```

Mark campaign as failed. Enables refunds for all contributors.

**Events:**
```solidity
event CampaignStateChanged(CampaignState oldState, CampaignState newState);
```

**claimRefund**
```solidity
function claimRefund() external nonReentrant
```

Claim refund after campaign failure. 2% platform fee deducted.

**Events:**
```solidity
event RefundClaimed(address indexed funder, uint256 amount, uint256 originalContribution);
```

#### Read Functions

**getCampaignData**
```solidity
function getCampaignData() external view returns (CampaignData memory)
```

Returns:
```solidity
struct CampaignData {
    string title;
    string description;
    address founder;
    uint256 fundingGoal;
    uint256 totalRaised;
    uint256 currentMilestone;
    CampaignState state;
    uint256 createdAt;
}
```

**getMilestone**
```solidity
function getMilestone(uint256 index) external view returns (Milestone memory)
```

Returns:
```solidity
struct Milestone {
    string description;
    uint256 releasePercentage;
    uint256 deadline;
    bool completed;
}
```

**getFunder**
```solidity
function getFunder(address funderAddress) external view returns (Funder memory)
```

Returns:
```solidity
struct Funder {
    uint256 totalContribution;
    bool hasRefunded;
    uint256 fundedAt;
}
```

**getFundersList**
```solidity
function getFundersList() external view returns (address[] memory)
```

Returns: Array of all funder addresses

**getRefundAmount**
```solidity
function getRefundAmount(address funderAddress) external view returns (uint256)
```

Returns: Available refund amount for funder

### Enums

**CampaignState**
```solidity
enum CampaignState {
    Active,     // 0 - Campaign is running
    Completed,  // 1 - All milestones completed
    Failed      // 2 - Campaign failed
}
```

### Constants

**SimpleFactory**
```solidity
uint256 public constant MIN_FUNDING_GOAL = 0.01 ether;
uint256 public constant MAX_FUNDING_GOAL = 10000 ether;
uint256 public constant MIN_TITLE_LENGTH = 3;
uint256 public constant MAX_TITLE_LENGTH = 100;
uint256 public constant MAX_DESCRIPTION_LENGTH = 1000;
```

**SimpleCampaign**
```solidity
uint256 public constant MIN_CONTRIBUTION = 0.001 ether;
```

### Error Types

```solidity
error OnlyFounder();
error CampaignNotActive();
error BelowMinimumContribution();
error FundingGoalReached();
error InvalidMilestone();
error MilestoneAlreadyCompleted();
error DeadlineExceeded();
error RefundNotAvailable();
error AlreadyRefunded();
error NotFunder();
```

---

## 📊 Additional Information

### Gas Costs (Lisk L2)

| Operation | Gas Cost | ETH Cost (approx) |
|-----------|----------|-------------------|
| Create Campaign | ~3.4M | ~0.004 ETH |
| Fund Campaign | ~100K | ~0.0001 ETH |
| Complete Milestone | ~50K | ~0.001 ETH |
| Claim Refund | ~50K | ~0.001 ETH |

### Network Information

**Lisk Sepolia Testnet:**
- Chain ID: 4202
- RPC URL: https://rpc.sepolia-api.lisk.com
- Explorer: https://sepolia-blockscout.lisk.com

**Lisk Mainnet:**
- Chain ID: 1135
- RPC URL: https://rpc.api.lisk.com
- Explorer: https://blockscout.lisk.com

### Resources

- **Lisk Faucet:** https://sepolia-faucet.lisk.com/
- **Lisk Documentation:** https://docs.lisk.com/
- **OpenZeppelin Contracts:** https://docs.openzeppelin.com
- **Hardhat:** https://hardhat.org/docs
- **Wagmi:** https://wagmi.sh

---

## 🎯 Project Status

### ✅ Completed
- Smart contract development (simplified model)
- Comprehensive testing (113 tests passing)
- Frontend development (Next.js + Web3)
- Security implementations
- Full documentation suite
- Local development setup
- Lisk Sepolia deployment ready

### 🔄 In Progress
- Testnet deployment
- User testing
- Community feedback
- UI/UX improvements

### 📋 Roadmap
- Professional security audit
- Mainnet deployment
- Mobile app
- Analytics dashboard
- Multi-chain support

---

## 🤝 Contributing

We welcome contributions! Please:

1. Read the documentation
2. Check existing issues
3. Follow code style
4. Add tests for new features
5. Update documentation

---

## 📄 License

MIT License - See LICENSE file for details

---

## 📞 Support

- **Documentation:** This file and `/docs` directory
- **Issues:** GitHub Issues
- **Discussions:** GitHub Discussions
- **Security:** Report vulnerabilities privately

---

**Built with ❤️ for the Web3 community**

*Simple, effective milestone crowdfunding on Lisk L2*

**Last Updated:** October 2025  
**Version:** 1.0  
**Status:** ✅ Production-Ready (pending security audit)

---

## 🎓 Quick Reference

### For Developers
1. Read this document first
2. Follow Quick Start guide
3. Review contract architecture
4. Explore API reference
5. Study example code
6. Run tests locally

### For Users
1. Connect wallet to Lisk
2. Browse active campaigns
3. Fund projects you believe in
4. Track milestone progress
5. Claim refunds if needed

### For Founders
1. Create compelling campaign
2. Set realistic milestones
3. Promote your project
4. Deliver on promises
5. Complete milestones
6. Receive funds progressively

---

## 📈 Success Metrics

| Metric | Target |
|--------|--------|
| Campaign Creation Time | < 5 minutes |
| Funding Transaction | < 30 seconds |
| Milestone Completion | Instant release |
| Refund Processing | < 1 minute |
| Platform Uptime | 99.9% |
| User Satisfaction | > 4.5/5 |

---

*Thank you for using the Lisk Crowdfunding Platform!*

