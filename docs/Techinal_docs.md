# 🚀 Web3 Milestone Crowdfunding Platform - Technical Specification

**Version:** 1.0 MVP  
**Target Chain:** Base L2  
**Hackathon Timeline:** 48-72 hours  
**Last Updated:** October 2025

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Core Concepts](#core-concepts)
3. [System Architecture](#system-architecture)
4. [Smart Contract Specifications](#smart-contract-specifications)
5. [Milestone & Voting Logic](#milestone--voting-logic)
6. [Risk/Refund Ratio System](#riskrefund-ratio-system)
7. [User Flows](#user-flows)
8. [Technical Stack](#technical-stack)
9. [Security Considerations](#security-considerations)
10. [MVP Implementation Roadmap](#mvp-implementation-roadmap)

---

## Executive Summary

### Problem Statement
Traditional crowdfunding lacks:
- **Accountability:** Founders receive all funds upfront with no obligation to deliver
- **Protection:** Funders cannot recover funds if projects fail
- **Governance:** Funders have no voice in project direction despite financial commitment

### Solution
A blockchain-based crowdfunding platform that:
- Releases funds progressively through **5 validated milestones**
- Splits contributions into **committed capital (70%)** and **protection reserve (30%)**
- Enables **funder governance** through milestone approval voting
- Provides **automatic refunds** when projects fail consensus validation

### Key Differentiators
- ✅ Progressive fund release tied to objective milestones
- ✅ Risk-protected capital through reserve pools
- ✅ Democratic governance without securities law complications
- ✅ Transparent on-chain verification

---

## Core Concepts

### 1. Risk Tranching Model (User-Defined)

**Key Innovation:** Each funder chooses their own risk/refund ratio when contributing.

Every funder contribution is split into two distinct pools based on **individual risk preference**:

```
FUNDER CONTRIBUTION = COMMITTED CAPITAL + PROTECTION RESERVE

Example: $1,000 contribution with DIFFERENT risk profiles

Conservative Funder:
├─ Committed Capital: $500 (50%)
│  └─ Released progressively through milestones
│  └─ Non-refundable once released to founder
│
└─ Protection Reserve: $500 (50%)
   └─ Held in smart contract escrow
   └─ Refundable if project fails
   └─ Released to founder only upon full project completion

Balanced Funder:
├─ Committed Capital: $700 (70%)
└─ Protection Reserve: $300 (30%)

Aggressive Funder:
├─ Committed Capital: $900 (90%)
└─ Protection Reserve: $100 (10%)
```

**Risk Profile Options:**

| Profile | Committed | Protected | Funder Type | Benefits |
|---------|-----------|-----------|-------------|----------|
| **Conservative** | 50% | 50% | Risk-averse, first-time | Maximum downside protection |
| **Balanced** | 70% | 30% | Standard investor | Good balance |
| **Aggressive** | 90% | 10% | High-conviction believer | More capital to founder = faster progress |

**Important Mechanics:**
- Each funder's ratio is **independent** - doesn't affect others
- Founder receives **weighted average** of all committed capital
- Voting power remains based on **total contribution** (not just committed)
- Refunds calculated **per funder** based on their chosen ratio

**Rationale:**
- ✅ Democratizes risk - investors self-select comfort level
- ✅ Attracts diverse funder base (conservative + aggressive)
- ✅ Founder gets signal of community confidence (more aggressive = higher trust)
- ✅ Fair: those who risk more aren't penalized by cautious funders

---

### 2. Five-Milestone Framework

Based on standard startup validation stages:

| # | Milestone | Deliverable | Fund Release | Time Limit | Reasoning |
|---|-----------|-------------|--------------|------------|-----------|
| **M1** | Prototype/Concept Validation | Demo product + pitch deck | 10% | 90 days | Validates founder execution capability |
| **M2** | Early Traction/Pilot Users | 200+ users + feedback | 20% | 120 days | Proves market demand exists |
| **M3** | Strategic Partnership | 1-2 partnerships + MoU | 25% | 90 days | External validation & scaling readiness |
| **M4** | Revenue/Impact Proof | First revenue OR measurable impact | 25% | 120 days | Business model viability |
| **M5** | Public Launch & Growth | 1000+ users + public dashboard | 20% | 60 days | Market readiness confirmation |

**Total Timeline:** ~15 months (480 days)

**Note:** Percentages refer to the **committed capital pool (70%)**, not total funds.

---

### 3. Voting Mechanism

#### Voting Trigger
- Founder submits milestone completion evidence (IPFS-stored documents)
- 7-day voting window opens automatically
- All funders can vote weighted by contribution amount

#### Voting Rules

**CRITICAL: Mandatory Voting Participation**

Every funder MUST vote on every milestone. Non-participation has consequences.

| Vote Outcome | Threshold | Action |
|--------------|-----------|--------|
| **Approved** | ≥60% YES votes | Funds released within 24 hours |
| **Rejected** | ≥60% NO votes | Founder can revise & resubmit (1 retry per milestone) |
| **Disputed** | 40-60% split | Extended 3-day discussion period, then re-vote |
| **Abstain Penalty** | Funder doesn't vote | Loses voting power on NEXT milestone (punishment for apathy) |
| **Chronic Non-Voter** | Misses 2+ consecutive votes | Counted as "YES" automatically (can't block progress) |

**Mandatory Voting Enforcement:**

```
Voting Period: 7 days from milestone submission

Day 0-5:   Normal voting (funders vote YES/NO)
Day 6:     Reminder sent to non-voters
Day 7:     Final 24 hours
End Day 7: Auto-finalize

Non-voter penalties:
- 1st miss: Warning + lose voting power on next milestone
- 2nd consecutive miss: Future votes auto-counted as YES
- 3rd consecutive miss: Flagged as "inactive funder"
```

#### Vote Weighting

```
Voting Power = Total Contribution Amount (regardless of risk profile chosen)

Example:
- Funder A: $5,000 contribution (90% aggressive) = 5,000 voting power
- Funder B: $5,000 contribution (50% conservative) = 5,000 voting power
  ↑ Same voting power despite different risk profiles

WHY: Voting rights based on capital at risk, not risk tolerance
```

**Anti-Whale Protection:** Single funder cannot exceed 20% of total voting power (governance parameter)

**Anti-Gaming Measures:**
- Cannot change risk profile after funding (locked at contribution time)
- Cannot withdraw vote once cast
- Cannot transfer voting rights separately from capital stake

---

### 4. Failure & Refund Logic

#### Project Failure Triggers

**Automatic Failures:**
1. Milestone deadline exceeded with no submission
2. Milestone rejected twice consecutively
3. Founder voluntary cancellation

**Consensus Failures:**
1. ≥60% of funders vote "Project Failed" via emergency governance
2. 3+ consecutive months of no activity/updates

#### Refund Calculation (Per-Funder Risk Profile)

```
REFUND = (UNRELEASED COMMITTED CAPITAL + FULL PROTECTION RESERVE) - PLATFORM FEE

Each funder's refund is calculated INDIVIDUALLY based on their chosen risk ratio.
```

**Example Scenario: Project fails at Milestone 3**

**Campaign Overview:**
- Total raised: $100,000 from 3 funders
- Milestones completed: M1 (10%) + M2 (20%) = 30% of committed capital released

**Individual Funder Refunds:**

```
Funder A: $40,000 contribution (50/50 Conservative)
├─ Committed: $20,000
│  └─ Released: 30% × $20,000 = $6,000 (gone, paid to founder)
│  └─ Unreleased: $14,000 (refundable)
├─ Protected: $20,000 (fully refundable)
├─ Total Refundable: $14,000 + $20,000 = $34,000
├─ Platform Fee (2%): $680
└─ NET REFUND: $33,320 (83.3% of original contribution)

Funder B: $40,000 contribution (70/30 Balanced)
├─ Committed: $28,000
│  └─ Released: 30% × $28,000 = $8,400 (gone)
│  └─ Unreleased: $19,600
├─ Protected: $12,000
├─ Total Refundable: $19,600 + $12,000 = $31,600
├─ Platform Fee (2%): $632
└─ NET REFUND: $30,968 (77.4% of original contribution)

Funder C: $20,000 contribution (90/10 Aggressive)
├─ Committed: $18,000
│  └─ Released: 30% × $18,000 = $5,400 (gone)
│  └─ Unreleased: $12,600
├─ Protected: $2,000
├─ Total Refundable: $12,600 + $2,000 = $14,600
├─ Platform Fee (2%): $292
└─ NET REFUND: $14,308 (71.5% of original contribution)
```

**Key Insight:** Conservative funders get more back (83%), aggressive funders accept more risk (71%). This is fair and self-selected.

**Founder Perspective:**
- Founder received total: $6,000 + $8,400 + $5,400 = $19,800
- This compensates for work completed (M1 + M2)
- Not a "free ride" - founder earned this portion

---

## System Architecture

### High-Level Components

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                     │
│  - Campaign Creation UI                                 │
│  - Funding Interface                                    │
│  - Milestone Submission Dashboard                       │
│  - Voting Portal                                        │
│  - Analytics & Progress Tracking                        │
└────────────────────┬────────────────────────────────────┘
                     │
                     │ Web3 Provider (Wagmi/Ethers.js)
                     │
┌────────────────────▼────────────────────────────────────┐
│              SMART CONTRACTS (Base L2)                  │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  CampaignFactory.sol                           │    │
│  │  - Creates new campaigns                       │    │
│  │  - Campaign registry                           │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  Campaign.sol (Instance per campaign)          │    │
│  │  - Fund reception & splitting (70/30)          │    │
│  │  - Milestone state management                  │    │
│  │  - Escrow logic                                │    │
│  │  - Fund release automation                     │    │
│  │  - Refund distribution                         │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │  Governance.sol                                │    │
│  │  - Voting mechanism                            │    │
│  │  - Vote tallying                               │    │
│  │  - Quorum validation                           │    │
│  │  - Time-lock enforcement                       │    │
│  └────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
                     │
                     │ Event Emissions
                     │
┌────────────────────▼────────────────────────────────────┐
│                  IPFS (Pinata/Web3.Storage)             │
│  - Milestone evidence documents                         │
│  - Project updates                                      │
│  - Voting discussion threads                            │
└─────────────────────────────────────────────────────────┘
```

---

## Smart Contract Specifications

### Contract 1: CampaignFactory.sol

**Purpose:** Deploys and tracks all crowdfunding campaigns

**Key Functions:**
```
createCampaign()
  ├─ Inputs: fundingGoal, milestoneDetails[], founder address
  ├─ Deploys new Campaign.sol instance
  ├─ Registers in campaignRegistry
  └─ Emits: CampaignCreated event

getCampaign(campaignId)
  └─ Returns: Campaign contract address

getAllActiveCampaigns()
  └─ Returns: Array of active campaign addresses
```

**State Variables:**
- `campaignCount`: Total campaigns created
- `campaignRegistry`: Mapping of ID → Campaign address
- `founderCampaigns`: Mapping of founder → campaign IDs

---

### Contract 2: Campaign.sol

**Purpose:** Manages individual campaign lifecycle

**Key State Variables:**
```solidity
struct CampaignData {
    address founder;
    uint256 fundingGoal;
    uint256 totalRaised;
    uint256 committedPool;      // 70% of total
    uint256 reservePool;        // 30% of total
    uint8 currentMilestone;     // 0-4 (5 milestones)
    bool isActive;
    bool hasFailed;
    uint256 createdAt;
}

struct Milestone {
    string description;
    uint256 releasePercentage;  // % of committed pool
    uint256 deadline;
    bool isCompleted;
    bool votingActive;
    uint256 votingDeadline;
    uint256 yesVotes;
    uint256 noVotes;
    string evidenceIPFS;
    uint8 rejectionCount;       // Track resubmissions
}

struct Funder {
    uint256 totalContribution;
    uint256 committedAmount;    // User-chosen % (50-90%)
    uint256 reserveAmount;      // User-chosen % (10-50%)
    uint8 riskProfile;          // 0=Conservative(50/50), 1=Balanced(70/30), 2=Aggressive(90/10)
    bool hasVoted[5];           // Voted per milestone
    uint8 missedVotes;          // Track consecutive non-votes
    bool isAutoYes;             // Flagged for auto-YES after 2 misses
    bool hasRefunded;
}
```

**Critical Functions:**

```
fund(riskProfile)
  ├─ Accept ETH/stablecoin
  ├─ Validate riskProfile: 0 (50/50), 1 (70/30), or 2 (90/10)
  ├─ Split based on chosen profile into committed/reserve pools
  ├─ Update funder records with chosen ratio
  ├─ Lock ratio (cannot change after funding)
  └─ Emit: FundReceived(funder, amount, riskProfile)

submitMilestone(milestoneId, evidenceIPFS)
  ├─ Validate: correct milestone, before deadline, founder only
  ├─ Store evidence hash
  ├─ Activate voting period (7 days)
  ├─ Reset all funders' vote status for this milestone
  └─ Emit: MilestoneSubmitted

vote(milestoneId, support)
  ├─ Validate: is funder, voting active, hasn't voted THIS milestone
  ├─ Weight vote by total contribution amount
  ├─ Mark funder.hasVoted[milestoneId] = true
  ├─ Reset funder.missedVotes counter (they participated)
  ├─ Record vote
  └─ Emit: VoteCast

finalizeMilestone(milestoneId)
  ├─ Validate: voting period ended (7 days)
  ├─ Process non-voters:
  │  ├─ Increment missedVotes counter
  │  ├─ If missedVotes >= 2: set isAutoYes = true, count as YES vote
  │  └─ If missedVotes == 1: lose voting power on NEXT milestone
  ├─ Calculate result (including auto-YES votes)
  ├─ IF approved (≥60%): release funds, advance milestone
  ├─ IF rejected (≥60% NO): allow resubmission or fail project
  └─ Emit: MilestoneCompleted OR MilestoneRejected

claimRefund()
  ├─ Validate: project failed, hasn't claimed
  ├─ Calculate proportional refund BASED ON FUNDER'S RISK PROFILE:
  │  ├─ Unreleased committed capital (funder-specific)
  │  └─ Full protection reserve (funder-specific)
  ├─ Transfer funds
  └─ Emit: RefundClaimed(funder, amount, originalContribution)

emergencyFailVote()
  ├─ Allow funders to trigger failure vote
  ├─ Requires 60% consensus
  └─ Mark project as failed
```

---

### Contract 3: Governance.sol

**Purpose:** Encapsulates all voting logic (optional modular design)

**Key Functions:**
```
calculateVotingPower(funder)
  └─ Returns weighted voting power

tallyVotes(milestoneId)
  └─ Returns approval percentage

checkQuorum(milestoneId)
  └─ Returns boolean if minimum participation met

extendVotingPeriod(milestoneId)
  └─ One-time 3-day extension if quorum not met
```

---

## Milestone & Voting Logic

### Milestone State Machine

```
PENDING → SUBMITTED → VOTING → APPROVED/REJECTED → COMPLETED/RESUBMIT
```

**State Definitions:**

1. **PENDING**: Milestone not yet reached, founder building
2. **SUBMITTED**: Founder uploaded evidence, voting opens
3. **VOTING**: 7-day voting window active
4. **APPROVED**: ≥60% YES, funds releasing
5. **REJECTED**: ≥60% NO, founder can resubmit once
6. **COMPLETED**: Funds released, move to next milestone
7. **FAILED**: Exceeded deadline OR rejected twice → project fails

### Voting Edge Cases

| Scenario | Handling |
|----------|----------|
| No votes cast | Auto-approve after 7 days (avoids deadlock) |
| 50/50 split | 3-day extension + re-vote |
| Founder doesn't submit | Deadline expires → auto-fail |
| Funder votes then refunds | Vote remains valid (prevents manipulation) |
| Large whale voter | Optional cap at 20% voting power |

---

## Risk/Refund Ratio System

### Configurable Ratios (User-Selected)

Platform supports three risk profiles that funders choose at funding time:

| Profile | Committed | Protected | Use Case |
|---------|-----------|-----------|----------|
| **Conservative** | 50% | 50% | First-time funders, high-risk projects |
| **Balanced (Default)** | 70% | 30% | Standard investors, prototype stage |
| **Aggressive** | 90% | 10% | High-conviction believers, late-stage projects |

**Implementation Details:**

```javascript
// Funder selects during funding transaction
enum RiskProfile {
  Conservative,  // 0: 50/50 split
  Balanced,      // 1: 70/30 split  
  Aggressive     // 2: 90/10 split
}

// Cannot change after funding (immutable choice)
function fund(RiskProfile profile) payable {
  require(profile <= RiskProfile.Aggressive, "Invalid profile");
  
  uint256 committedPercent;
  if (profile == RiskProfile.Conservative) committedPercent = 50;
  else if (profile == RiskProfile.Balanced) committedPercent = 70;
  else committedPercent = 90;
  
  uint256 committed = (msg.value * committedPercent) / 100;
  uint256 reserve = msg.value - committed;
  
  // Store funder's chosen profile (locked forever)
  funders[msg.sender].riskProfile = profile;
  funders[msg.sender].committedAmount = committed;
  funders[msg.sender].reserveAmount = reserve;
}
```

**Why User-Defined Ratios?**
- ✅ Democratizes risk - not one-size-fits-all
- ✅ Attracts broader funder base
- ✅ Conservative funders don't block aggressive ones
- ✅ Founder sees community confidence level
- ✅ Fair refunds - you get back what you protected

### Reserve Release Conditions

Protection reserve is released to founder ONLY when:

1. ✅ All 5 milestones completed successfully
2. ✅ Project marked "successful" by final vote
3. ✅ 30-day post-launch stability period passes (anti-rug pull)

**Each funder's reserve (10-50%) releases based on THEIR profile:**
```
Conservative funder: 50% reserve → Released to founder at M5
Aggressive funder: 10% reserve → Released to founder at M5
```

**Alternative trigger:** If project generates 2x funding goal in revenue, all reserves auto-release early.

---

## User Flows

### Flow 1: Founder Creates Campaign

```
1. Connect wallet
2. Fill campaign form:
   - Project description
   - Funding goal
   - 5 milestone descriptions
   - Milestone deadlines
   - Evidence requirements per milestone
3. Review risk ratio (70/30 displayed)
4. Pay campaign creation fee (~$20 in ETH)
5. Sign transaction
6. Campaign deployed on-chain
7. Receive shareable campaign URL
```

---

### Flow 2: Funder Backs Project

```
1. Browse campaigns or receive direct link
2. Review project details:
   - Founder profile
   - Milestone roadmap
   - Current progress
   - Risk breakdown (70% committed, 30% protected)
3. Enter funding amount
4. Approve spending (if ERC20)
5. Confirm transaction
6. Receive confirmation:
   - "You funded $X (70% committed, 30% protected)"
   - Voting rights activated
   - Can track progress in dashboard
```

---

### Flow 3: Milestone Completion Cycle (MANDATORY VOTING)

```
FOUNDER SIDE:
1. Complete milestone work
2. Upload evidence (pitch deck, user data, partnerships) to IPFS
3. Submit milestone via dashboard
4. Wait for voting (7 days)
5. Monitor vote participation
6. IF approved: Funds auto-released
7. IF rejected: Review feedback, revise, resubmit (1 retry)

FUNDER SIDE (CRITICAL - MUST PARTICIPATE):
1. Receive notification: "🚨 Milestone X submitted - YOU MUST VOTE"
2. Review evidence (download from IPFS)
3. **VOTE within 7 days (mandatory):**
   - Day 0-5: Normal voting period
   - Day 6: "⚠️ LAST 24 HOURS TO VOTE"
   - Day 7: Final reminder
4. Cast vote: YES/NO (no abstain option)
5. Monitor vote progress
6. IF you don't vote:
   - 1st miss: ⚠️ Warning + lose next milestone vote
   - 2nd miss: ⚠️ Future votes auto-counted as YES
   - 3rd miss: 🚫 Flagged as inactive funder
7. IF approved: Watch funds release on-chain
8. IF rejected: Opportunity to provide feedback

VOTING DASHBOARD SHOWS:
├─ Your voting history: ✅ ✅ ⚠️ (missed) ✅
├─ Penalty status: "Next vote disabled" or "Auto-YES mode"
├─ Other funders' participation rate
└─ Time remaining to vote
```

---

### Flow 4: Project Failure & Refund

```
AUTOMATIC FAILURE:
1. Deadline passes with no submission
2. Smart contract marks project as FAILED
3. Refund pool calculated automatically

CONSENSUS FAILURE:
1. Funders trigger emergency vote
2. 7-day voting period
3. If ≥60% vote "project failed"
4. Contract marks failed, calculates refunds

CLAIMING REFUND:
1. Funder visits campaign page
2. Sees "Refund Available: $XXX"
3. Click "Claim Refund"
4. Transaction processes
5. Funds returned to wallet
```

---

## Technical Stack

### Blockchain Layer
- **Network:** Base L2 (Ethereum L2)
- **Language:** Solidity ^0.8.20
- **Framework:** Hardhat
- **Libraries:** 
  - OpenZeppelin Contracts (security)
  - Chainlink (price feeds - optional)

### Frontend
- **Framework:** React 18+ with TypeScript
- **Web3 Integration:** Wagmi + Viem
- **Wallet:** RainbowKit or ConnectKit
- **Styling:** TailwindCSS
- **State Management:** Zustand or React Context
- **Charts:** Recharts (milestone progress)

### Storage
- **On-Chain:** Contract state (funds, votes, milestones)
- **Off-Chain:** IPFS via Pinata or Web3.Storage
  - Milestone evidence documents
  - Project descriptions
  - Update posts

### Development Tools
- **Testing:** Hardhat tests (Mocha/Chai)
- **Security:** Slither, Mythril
- **Deployment:** Hardhat Deploy scripts
- **Monitoring:** Tenderly or Etherscan

---

## Security Considerations

### Smart Contract Risks

| Risk | Mitigation |
|------|------------|
| **Reentrancy attacks** | Use OpenZeppelin's ReentrancyGuard on all fund transfer functions |
| **Integer overflow** | Solidity 0.8+ has built-in checks |
| **Unauthorized access** | Strict `onlyFounder`, `onlyFunder` modifiers |
| **Funds stuck in contract** | Emergency withdrawal with timelock (after 365 days inactivity) |
| **Vote manipulation** | Weight by contribution, cap whale power, mandatory participation |
| **Front-running** | Use commit-reveal for sensitive votes (future) |

### Best Practices

1. **Audit Before Mainnet:** Get professional audit for production
2. **Timelocks:** 48-hour delay on governance changes
3. **Pausability:** Emergency pause function (founder + 60% funders)
4. **Upgradability:** Proxy pattern for bug fixes (careful with funds safety)
5. **Gas Optimization:** Batch operations, efficient storage

### Frontend Security

- **Phishing Protection:** Verify contract addresses
- **HTTPS Only:** Enforce SSL
- **Input Validation:** Sanitize all user inputs
- **Rate Limiting:** Prevent spam voting
- **Wallet Security:** Never store private keys

---

## MVP Implementation Roadmap

### Phase 0: Pre-Hackathon Setup (Do Before Event)

**Duration:** 2-4 hours before hackathon

- [ ] Install Hardhat: `npm install --save-dev hardhat`
- [ ] Install OpenZeppelin: `npm install @openzeppelin/contracts`
- [ ] Set up Base testnet RPC in Hardhat config
- [ ] Get testnet ETH from Base faucet
- [ ] Create React app with Wagmi template
- [ ] Register Pinata account for IPFS
- [ ] Set up GitHub repo
- [ ] Prepare demo data (3 mock campaigns)

---

### Phase 1: Core Smart Contracts (Day 1)

**Duration:** 12-16 hours

#### Morning (4 hours)
- [ ] Create `CampaignFactory.sol`
  - [ ] `createCampaign()` function
  - [ ] Campaign registry mapping
  - [ ] Events
- [ ] Create `Campaign.sol` skeleton
  - [ ] State variables
  - [ ] Constructor
  - [ ] Basic modifiers (onlyFounder, etc.)

#### Afternoon (4 hours)
- [ ] Implement funding logic
  - [ ] `fund()` function with 70/30 split
  - [ ] Funder tracking
  - [ ] Events
- [ ] Write unit tests
  - [ ] Test campaign creation
  - [ ] Test funding and pool splitting
  - [ ] Test access controls

#### Evening (4-8 hours)
- [ ] Implement milestone submission
  - [ ] `submitMilestone()` function
  - [ ] IPFS hash storage
  - [ ] Voting activation
- [ ] Implement basic voting
  - [ ] `vote()` function
  - [ ] Vote tallying
  - [ ] Weighted voting
- [ ] Test milestone flow
  - [ ] Submit → Vote → Approve
  - [ ] Edge cases (no quorum, etc.)

**Deliverable:** Working smart contracts on Base testnet

---

### Phase 2: Fund Release & Refund Logic (Day 2 Morning)

**Duration:** 4-6 hours

- [ ] Implement `finalizeMilestone()`
  - [ ] Calculate vote results
  - [ ] Release committed capital percentage
  - [ ] Advance to next milestone
  - [ ] Handle rejections
- [ ] Implement failure detection
  - [ ] Deadline checking
  - [ ] Project failure marking
- [ ] Implement refund system
  - [ ] Calculate refund amounts
  - [ ] Proportional distribution
  - [ ] `claimRefund()` function
- [ ] Comprehensive testing
  - [ ] Happy path: all milestones pass
  - [ ] Failure path: refunds work
  - [ ] Edge cases: partial completion

**Deliverable:** Complete contract logic tested

---

### Phase 3: Frontend MVP (Day 2 Afternoon - Day 3 Morning)

**Duration:** 8-10 hours

#### Campaign Creation (2 hours)
- [ ] Form for campaign details
- [ ] Milestone input (5 milestones)
- [ ] Transaction submission
- [ ] Success confirmation

#### Campaign Discovery (2 hours)
- [ ] List active campaigns
- [ ] Campaign detail page
- [ ] Progress visualization (progress bars)
- [ ] Funding statistics

#### Funding Interface (3 hours)
- [ ] Risk profile selector (Conservative/Balanced/Aggressive)
- [ ] Amount input with live split preview
- [ ] Visual breakdown: "You commit $X, protect $Y"
- [ ] Wallet connection
- [ ] Transaction confirmation
- [ ] Mandatory voting reminder displayed

#### Voting Dashboard (3 hours)
- [ ] Active votes list
- [ ] Evidence viewer (IPFS links)
- [ ] Vote buttons (YES/NO) with countdown timer
- [ ] **Voting status tracker:**
  - [ ] "You MUST vote" warning
  - [ ] Missed vote counter
  - [ ] Penalty status display
- [ ] Vote results display
- [ ] Other funders' participation rate

#### Milestone Management (2 hours)
- [ ] Founder dashboard
- [ ] Evidence upload to IPFS
- [ ] Milestone submission
- [ ] Status tracking

**Deliverable:** Functional web app

---

### Phase 4: Integration & Polish (Day 3)

**Duration:** 4-6 hours

- [ ] Connect frontend to smart contracts
- [ ] Test end-to-end flows
- [ ] Fix bugs
- [ ] Responsive design polish
- [ ] Add loading states
- [ ] Error handling
- [ ] Deploy frontend (Vercel)
- [ ] Create demo video (2-3 minutes)
- [ ] Prepare pitch deck

**Deliverable:** Demo-ready MVP

---

### Phase 5: Demo Preparation (Day 3 Final Hours)

**Duration:** 2-3 hours

- [ ] Populate 3 demo campaigns
- [ ] Create test accounts (founder + 5 funders)
- [ ] Record demo walkthrough
- [ ] Write README with:
  - [ ] Problem/solution
  - [ ] How it works
  - [ ] Tech stack
  - [ ] Contract addresses
  - [ ] Live demo link
- [ ] Practice pitch (3 minutes max)

**Deliverable:** Hackathon submission package

---

## Post-Hackathon Roadmap

### Month 1: Security & Audit
- [ ] Professional smart contract audit
- [ ] Bug bounty program
- [ ] Gas optimization
- [ ] Mainnet deployment

### Month 2: Feature Expansion
- [ ] Stablecoin support (USDC, DAI)
- [ ] Email notifications
- [ ] Reputation system
- [ ] Analytics dashboard
- [ ] Mobile responsive refinement

### Month 3: Advanced Governance
- [ ] Quadratic voting option
- [ ] Dispute resolution mechanism
- [ ] Founder KYC integration
- [ ] Multi-signature for large campaigns

### Month 4-6: Ecosystem Growth
- [ ] Secondary marketplace (NFT-based positions)
- [ ] Cross-chain support
- [ ] Platform DAO
- [ ] API for integrations

---

## Key Metrics to Track

### Smart Contract Metrics
- Total campaigns created
- Total funds raised
- Success rate (% of campaigns completing M5)
- Average time per milestone
- Refund distribution statistics

### User Engagement
- Funders per campaign (avg)
- Voting participation rate
- Milestone approval rate
- Repeat funders

### Platform Health
- Gas costs per operation
- Failed transactions
- Contract upgrade incidents
- Security incidents

---

## FAQ for Developers

**Q: Why 70/30 split instead of 80/20 or 50/50?**  
A: Trick question! There's no single split - each funder chooses their own (50/50, 70/30, or 90/10). This democratizes risk and attracts diverse funders.

**Q: What if I forget to vote on a milestone?**  
A: First miss: You lose voting power on the NEXT milestone. Second consecutive miss: Your future votes are auto-counted as YES. Third miss: You're flagged as inactive. We enforce mandatory participation to prevent apathy.

**Q: Can I change my risk profile after funding?**  
A: No. Your choice is locked at funding time to prevent gaming the system. You commit to your risk tolerance upfront.

**Q: If I choose aggressive (90/10), do I get more voting power?**  
A: No. Voting power is based on total contribution amount, not risk profile. A $1,000 conservative funder has the same voting power as a $1,000 aggressive funder. This ensures fairness.

**Q: What prevents a whale from choosing conservative (50/50) and blocking progress?**  
A: Mandatory voting + auto-YES after 2 misses. Plus, single funders capped at 20% voting power. Also, conservative funders still have skin in the game (50% committed).

**Q: Can aggressive funders (90/10) get more refund by lying about their profile?**  
A: No. Your profile determines your refund. Aggressive = more committed = less refundable. It's self-enforcing. Can't game it.

---

## Success Criteria for MVP

### Must Have (Hackathon Judging)
- ✅ Working smart contracts on testnet
- ✅ At least 1 complete funding → milestone → voting → release cycle
- ✅ Refund calculation working
- ✅ Basic UI (doesn't need to be pretty)
- ✅ Demo video showing value proposition

### Nice to Have
- ⭐ IPFS integration working
- ⭐ Responsive design
- ⭐ Multiple test campaigns
- ⭐ Real-time progress tracking

### Future Enhancements (Not for Hackathon)
- Secondary marketplace
- Mobile app
- Multi-chain support
- KYC integration
- Advanced analytics

---

## Resources & References

### Documentation
- Base L2 Docs: https://docs.base.org
- OpenZeppelin Contracts: https://docs.openzeppelin.com
- Hardhat: https://hardhat.org/docs
- Wagmi: https://wagmi.sh

### Similar Projects (Study These)
- Gitcoin Grants: Quadratic funding model
- Juicebox: Treasury management
- Mirror: Token-gated crowdfunding
- AngelBlock: Web3 fundraising (from your docs)

### Tools
- Remix IDE: Quick contract testing
- Tenderly: Transaction debugging
- Etherscan: Contract verification
- Pinata: IPFS pinning service

---

## Contact & Support

For implementation questions during hackathon:
- Check this spec first
- Review example contracts in `/examples` (create these)
- Use CursorAI for boilerplate generation
- Discord/Telegram for team coordination

---

**Good luck with your hackathon! This spec gives you everything needed to build a competitive MVP. Focus on core functionality first, polish later.** 🚀

<!-- need to discuss and determine:
**Vote Weighting**

```
Voting Power = Total Contribution Amount (regardless of risk profile chosen)

Example:
- Funder A: $5,000 contribution (90% aggressive) = 5,000 voting power
- Funder B: $5,000 contribution (50% conservative) = 5,000 voting power
  ↑ Same voting power despite different risk profiles

WHY: Voting rights based on capital at risk, not risk tolerance

```

**Anti-Whale Protection:** Single funder cannot exceed 20% of total voting power (governance parameter)
**Anti-Gaming Measures:**
* Cannot change risk profile after funding (locked at contribution time)
* Cannot withdraw vote once cast
* Cannot transfer voting rights separately from capital stake

doesnt this one is unfair? since riskier risk profile will risk more allocated coins? -->