# Smart Contract Architecture - Deep Dive

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Campaign.sol - Core Logic](#campaignsol---core-logic)
3. [CampaignFactory.sol - Deployment](#campaignfactorysol---deployment)
4. [Governance.sol - Platform Management](#governancesol---platform-management)
5. [Data Structures](#data-structures)
6. [State Management](#state-management)
7. [Fund Flow](#fund-flow)
8. [Security Patterns](#security-patterns)

---

## 🏛️ Architecture Overview

### Three-Contract System

```
┌─────────────────────────────────────────────────────────┐
│                  CampaignFactory.sol                     │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Role: Factory & Registry                          │ │
│  │  - Creates new Campaign instances                  │ │
│  │  - Validates campaign parameters                   │ │
│  │  - Tracks all campaigns                            │ │
│  │  - Manages platform fees                           │ │
│  │  - Collects creation fees                          │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                           │
                           │ deploys via new Campaign(...)
                           ↓
┌─────────────────────────────────────────────────────────┐
│                     Campaign.sol                         │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Role: Individual Campaign Logic                   │ │
│  │  - Receives & manages funds                        │ │
│  │  - Splits funds by risk profile                    │ │
│  │  - Manages 5 milestones                            │ │
│  │  - Handles democratic voting                       │ │
│  │  - Releases funds to founder                       │ │
│  │  - Calculates & processes refunds                  │ │
│  │  - Enforces whale protection                       │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                   Governance.sol                         │
│  ┌────────────────────────────────────────────────────┐ │
│  │  Role: Platform Governance                         │ │
│  │  - Creates platform-wide proposals                 │ │
│  │  - Manages voting power                            │ │
│  │  - Executes approved proposals                     │ │
│  │  - Handles emergency actions                       │ │
│  │  - Resolves disputes                               │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Contract Sizes

| Contract | Size | Initcode | Optimization |
|----------|------|----------|--------------|
| Campaign | 9.0 KB | 11.7 KB | 200 runs |
| CampaignFactory | 16.3 KB | 16.5 KB | 200 runs |
| Governance | 7.3 KB | 7.5 KB | 200 runs |

**Note**: All contracts are under the 24 KB limit for deployment.

---

## 📜 Campaign.sol - Core Logic

### Contract Overview

```solidity
contract Campaign is Ownable, ReentrancyGuard, Pausable {
    // Inherits:
    // - Ownable: Access control for founder
    // - ReentrancyGuard: Prevents reentrancy attacks
    // - Pausable: Emergency stop mechanism
}
```

### Key Constants

```solidity
uint256 public constant VOTING_PERIOD = 7 days;
uint256 public constant APPROVAL_THRESHOLD = 6000; // 60%
uint256 public constant MAX_WHALE_POWER = 2000;    // 20%
uint256 public constant MIN_CONTRIBUTION = 0.001 ether;
```

### Enums

```solidity
enum CampaignState { 
    Active,      // 0 - Campaign is running
    Completed,   // 1 - All milestones approved
    Failed       // 2 - Campaign failed (deadline or 2 rejections)
}

enum MilestoneState { 
    Pending,     // 0 - Not yet submitted
    Submitted,   // 1 - Submitted but not in voting (unused)
    Voting,      // 2 - Currently being voted on
    Approved,    // 3 - Approved, funds released
    Rejected,    // 4 - Rejected, can resubmit
    Completed    // 5 - Fully completed
}

enum RiskProfile { 
    Conservative, // 0 - 50% committed, 50% reserve
    Balanced,     // 1 - 70% committed, 30% reserve
    Aggressive    // 2 - 90% committed, 10% reserve
}
```

### Core Data Structures

#### CampaignData
```solidity
struct CampaignData {
    string title;                    // Campaign title
    string description;              // Campaign description
    address founder;                 // Campaign creator
    uint256 fundingGoal;            // Target amount
    uint256 totalRaised;            // Current amount raised
    uint256 totalCommittedPool;     // Total committed funds
    uint256 totalReservePool;       // Total reserve funds
    uint256 currentMilestone;       // Current milestone index (0-4)
    CampaignState state;            // Campaign state
    uint256 createdAt;              // Creation timestamp
    uint256 platformFeePercentage;  // Platform fee (200 = 2%)
}
```

#### Milestone
```solidity
struct Milestone {
    string description;              // Milestone description
    uint256 releasePercentage;      // % of committed pool to release
    uint256 deadline;               // Deadline for submission
    MilestoneState state;           // Current state
    uint256 votingDeadline;         // When voting ends
    uint256 yesVotes;               // Total YES votes (weighted)
    uint256 noVotes;                // Total NO votes (weighted)
    uint256 totalVotingPower;       // Total voting power used
    string evidenceIPFS;            // IPFS hash of evidence
    uint256 rejectionCount;         // Times rejected (max 2)
    uint256 submittedAt;            // Submission timestamp
}
```

#### Funder
```solidity
struct Funder {
    uint256 totalContribution;      // Total amount contributed
    uint256 committedAmount;        // Amount in committed pool
    uint256 reserveAmount;          // Amount in reserve pool
    RiskProfile riskProfile;        // Chosen risk profile
    bool[5] hasVoted;              // Voted on each milestone
    uint256 missedVotes;           // Consecutive missed votes
    bool isAutoYes;                // Auto-YES mode (2+ misses)
    bool hasRefunded;              // Already claimed refund
    uint256 fundedAt;              // First funding timestamp
}
```

### Core Functions

#### 1. Funding

```solidity
function fund(RiskProfile riskProfile) 
    external 
    payable 
    nonReentrant 
    campaignActive 
    whenNotPaused 
{
    // Validation
    if (msg.value < MIN_CONTRIBUTION) revert BelowMinimumContribution();
    if (uint8(riskProfile) > 2) revert InvalidRiskProfile();
    if (campaignData.totalRaised + msg.value > campaignData.fundingGoal) {
        revert FundingGoalReached();
    }
    
    // Calculate split based on risk profile
    uint256 committedPercent;
    if (riskProfile == RiskProfile.Conservative) {
        committedPercent = 5000; // 50%
    } else if (riskProfile == RiskProfile.Balanced) {
        committedPercent = 7000; // 70%
    } else {
        committedPercent = 9000; // 90%
    }
    
    uint256 committedAmount = (msg.value * committedPercent) / 10000;
    uint256 reserveAmount = msg.value - committedAmount;
    
    // Update or create funder record
    if (funders[msg.sender].totalContribution == 0) {
        // New funder
        fundersList.push(msg.sender);
        funders[msg.sender] = Funder({
            totalContribution: msg.value,
            committedAmount: committedAmount,
            reserveAmount: reserveAmount,
            riskProfile: riskProfile,
            hasVoted: [false, false, false, false, false],
            missedVotes: 0,
            isAutoYes: false,
            hasRefunded: false,
            fundedAt: block.timestamp
        });
    } else {
        // Existing funder - must use same risk profile
        require(funders[msg.sender].riskProfile == riskProfile, 
                "Cannot change risk profile");
        
        funders[msg.sender].totalContribution += msg.value;
        funders[msg.sender].committedAmount += committedAmount;
        funders[msg.sender].reserveAmount += reserveAmount;
    }
    
    // Update campaign totals
    campaignData.totalRaised += msg.value;
    campaignData.totalCommittedPool += committedAmount;
    campaignData.totalReservePool += reserveAmount;
    
    emit FundReceived(msg.sender, msg.value, riskProfile, 
                     committedAmount, reserveAmount);
}
```

**Key Features:**
- ✅ Minimum contribution check (0.001 ETH)
- ✅ Risk profile validation
- ✅ Funding goal enforcement
- ✅ Risk profile locking (can't change after first contribution)
- ✅ Automatic fund splitting
- ✅ Reentrancy protection
- ✅ Pause protection

#### 2. Milestone Submission

```solidity
function submitMilestone(uint256 milestoneId, string calldata evidenceIPFS) 
    external 
    onlyFounder 
    campaignActive 
    whenNotPaused
{
    // Validation
    if (milestoneId != campaignData.currentMilestone) revert InvalidMilestone();
    if (milestones[milestoneId].state != MilestoneState.Pending) {
        revert MilestoneNotPending();
    }
    
    // Check deadline
    if (block.timestamp > milestones[milestoneId].deadline) {
        _failCampaign();
        return;
    }
    
    // Update milestone
    milestones[milestoneId].state = MilestoneState.Voting;
    milestones[milestoneId].evidenceIPFS = evidenceIPFS;
    milestones[milestoneId].votingDeadline = block.timestamp + VOTING_PERIOD;
    milestones[milestoneId].submittedAt = block.timestamp;
    
    // Reset voting data
    milestones[milestoneId].yesVotes = 0;
    milestones[milestoneId].noVotes = 0;
    milestones[milestoneId].totalVotingPower = 0;
    
    // Reset all funders' voting status for this milestone
    for (uint256 i = 0; i < fundersList.length; i++) {
        hasVotedOnMilestone[milestoneId][fundersList[i]] = false;
    }
    
    emit MilestoneSubmitted(milestoneId, evidenceIPFS, 
                           milestones[milestoneId].votingDeadline);
}
```

**Key Features:**
- ✅ Founder-only access
- ✅ Sequential milestone submission
- ✅ Deadline enforcement (fails campaign if exceeded)
- ✅ Voting period initialization (7 days)
- ✅ Vote reset for resubmissions
- ✅ IPFS evidence storage

#### 3. Voting

```solidity
function vote(uint256 milestoneId, bool support) 
    external 
    onlyFunder 
    campaignActive 
    whenNotPaused 
{
    // Validation
    if (milestones[milestoneId].state != MilestoneState.Voting) {
        revert VotingNotActive();
    }
    if (hasVotedOnMilestone[milestoneId][msg.sender]) revert AlreadyVoted();
    
    // Check if voting period expired
    if (block.timestamp > milestones[milestoneId].votingDeadline) {
        _finalizeMilestone(milestoneId);
        return;
    }
    
    // Calculate voting power with whale protection
    uint256 votingPower = funders[msg.sender].totalContribution;
    uint256 maxAllowedPower = (campaignData.totalRaised * MAX_WHALE_POWER) / 10000;
    
    if (votingPower > maxAllowedPower) {
        votingPower = maxAllowedPower; // Cap at 20%
    }
    
    // Record vote
    hasVotedOnMilestone[milestoneId][msg.sender] = true;
    funders[msg.sender].hasVoted[milestoneId] = true;
    funders[msg.sender].missedVotes = 0; // Reset missed votes counter
    
    // Update vote tallies
    if (support) {
        milestones[milestoneId].yesVotes += votingPower;
    } else {
        milestones[milestoneId].noVotes += votingPower;
    }
    
    milestones[milestoneId].totalVotingPower += votingPower;
    
    emit VoteCast(milestoneId, msg.sender, support, votingPower);
}
```

**Key Features:**
- ✅ Funder-only access
- ✅ One vote per milestone per funder
- ✅ Whale protection (20% max voting power)
- ✅ Weighted by contribution amount
- ✅ Automatic finalization if voting period expired
- ✅ Missed vote tracking reset on participation

#### 4. Milestone Finalization

```solidity
function _finalizeMilestone(uint256 milestoneId) internal {
    // Process non-voters (mandatory voting enforcement)
    for (uint256 i = 0; i < fundersList.length; i++) {
        address funder = fundersList[i];
        
        if (!funders[funder].hasVoted[milestoneId]) {
            funders[funder].missedVotes++;
            
            // Auto-YES for chronic non-voters (2+ consecutive misses)
            if (funders[funder].missedVotes >= 2) {
                funders[funder].isAutoYes = true;
                
                // Calculate their voting power and add as YES vote
                uint256 votingPower = funders[funder].totalContribution;
                uint256 maxAllowedPower = 
                    (campaignData.totalRaised * MAX_WHALE_POWER) / 10000;
                
                if (votingPower > maxAllowedPower) {
                    votingPower = maxAllowedPower;
                }
                
                milestones[milestoneId].yesVotes += votingPower;
                milestones[milestoneId].totalVotingPower += votingPower;
            }
        }
    }
    
    // Calculate approval
    uint256 totalVotes = milestones[milestoneId].yesVotes + 
                        milestones[milestoneId].noVotes;
    bool approved = false;
    
    if (totalVotes > 0) {
        uint256 approvalPercentage = 
            (milestones[milestoneId].yesVotes * 10000) / totalVotes;
        approved = approvalPercentage >= APPROVAL_THRESHOLD; // 60%
    }
    
    if (approved) {
        // Milestone approved - release funds
        milestones[milestoneId].state = MilestoneState.Approved;
        _releaseFunds(milestoneId);
        
        emit MilestoneCompleted(
            milestoneId,
            _calculateReleaseAmount(milestoneId),
            milestones[milestoneId].yesVotes,
            milestones[milestoneId].noVotes
        );
        
        // Move to next milestone or complete campaign
        if (milestoneId == 4) {
            campaignData.state = CampaignState.Completed;
            _releaseReserves(); // Release all reserves
            emit CampaignStateChanged(CampaignState.Active, 
                                     CampaignState.Completed);
        } else {
            campaignData.currentMilestone++;
        }
    } else {
        // Milestone rejected
        milestones[milestoneId].state = MilestoneState.Rejected;
        milestones[milestoneId].rejectionCount++;
        
        emit MilestoneRejected(
            milestoneId,
            milestones[milestoneId].yesVotes,
            milestones[milestoneId].noVotes,
            milestones[milestoneId].rejectionCount
        );
        
        // Fail campaign after 2 rejections
        if (milestones[milestoneId].rejectionCount >= 2) {
            _failCampaign();
        } else {
            // Allow resubmission
            milestones[milestoneId].state = MilestoneState.Pending;
        }
    }
}
```

**Key Features:**
- ✅ Mandatory voting enforcement (auto-YES after 2 misses)
- ✅ 60% approval threshold
- ✅ Automatic fund release on approval
- ✅ Campaign completion on final milestone
- ✅ Reserve release on completion
- ✅ 2-rejection failure rule
- ✅ Resubmission allowed after first rejection

#### 5. Fund Release (Secure)

```solidity
function _releaseFunds(uint256 milestoneId) internal {
    uint256 releaseAmount = _calculateReleaseAmount(milestoneId);
    
    if (releaseAmount > 0) {
        // EFFECTS: Update state FIRST (Checks-Effects-Interactions)
        milestones[milestoneId].state = MilestoneState.Completed;
        
        // INTERACTIONS: External call LAST
        (bool success, ) = payable(campaignData.founder).call{
            value: releaseAmount
        }("");
        require(success, "Fund transfer failed");
        
        emit FundsReleased(milestoneId, releaseAmount, campaignData.founder);
    } else {
        milestones[milestoneId].state = MilestoneState.Completed;
    }
}

function _calculateReleaseAmount(uint256 milestoneId) 
    internal 
    view 
    returns (uint256) 
{
    return (campaignData.totalCommittedPool * 
            milestones[milestoneId].releasePercentage) / 10000;
}
```

**Security Pattern:**
1. **CHECKS**: Calculate amount
2. **EFFECTS**: Update state (milestone.state = Completed)
3. **INTERACTIONS**: External call to founder

**Why This Matters:**
- Prevents reentrancy attacks
- State is updated before external call
- Even if founder's fallback function calls back, state is already updated

#### 6. Refund Mechanism

```solidity
function claimRefund() external nonReentrant onlyFunder {
    // Validation
    if (campaignData.state != CampaignState.Failed) {
        revert RefundNotAvailable();
    }
    if (funders[msg.sender].hasRefunded) revert AlreadyRefunded();
    
    Funder storage funder = funders[msg.sender];
    
    // Calculate refund
    uint256 refundAmount = _calculateRefund(msg.sender);
    
    if (refundAmount == 0) revert InsufficientFunds();
    
    // EFFECTS: Mark as refunded FIRST
    funder.hasRefunded = true;
    
    // INTERACTIONS: Transfer LAST
    (bool success, ) = payable(msg.sender).call{value: refundAmount}("");
    require(success, "Refund transfer failed");
    
    emit RefundClaimed(msg.sender, refundAmount, funder.totalContribution);
}

function _calculateRefund(address funderAddress) 
    internal 
    view 
    returns (uint256) 
{
    Funder memory funder = funders[funderAddress];
    
    // Calculate unreleased committed capital
    uint256 unreleasedCommitted = funder.committedAmount;
    
    for (uint256 i = 0; i < campaignData.currentMilestone; i++) {
        if (milestones[i].state == MilestoneState.Completed) {
            uint256 released = (funder.committedAmount * 
                               milestones[i].releasePercentage) / 10000;
            unreleasedCommitted -= released;
        }
    }
    
    // Total refund = unreleased committed + full reserve - platform fee
    uint256 totalRefund = unreleasedCommitted + funder.reserveAmount;
    uint256 platformFee = (totalRefund * 
                          campaignData.platformFeePercentage) / 10000;
    
    return totalRefund - platformFee;
}
```

**Refund Calculation Example:**
```
Funder contributed: 10 ETH (Balanced: 70/30)
- Committed: 7 ETH
- Reserve: 3 ETH

Campaign failed at milestone 2 (after 10% and 20% released)
- Released: 7 ETH * 30% = 2.1 ETH
- Unreleased committed: 7 ETH - 2.1 ETH = 4.9 ETH

Refund calculation:
- Unreleased committed: 4.9 ETH
- Full reserve: 3 ETH
- Total before fee: 7.9 ETH
- Platform fee (2%): 0.158 ETH
- Final refund: 7.742 ETH
```

#### 7. Pause/Unpause

```solidity
function pause() external onlyFounder {
    _pause();
}

function unpause() external onlyFounder {
    _unpause();
}

function emergencyPause() external {
    require(msg.sender == owner(), "Only owner can emergency pause");
    _pause();
}
```

**When Paused:**
- ❌ Cannot fund
- ❌ Cannot submit milestones
- ❌ Cannot vote
- ✅ CAN claim refunds (protects funders)

---

## 🏭 CampaignFactory.sol - Deployment

### Contract Overview

```solidity
contract CampaignFactory is Ownable, ReentrancyGuard {
    // Factory for creating and managing campaigns
}
```

### Key State Variables

```solidity
address[] public campaigns;              // All created campaigns
uint256 public campaignCount;           // Total campaigns created
uint256 public creationFee;             // Fee to create campaign
uint256 public platformFeePercentage;   // Fee on funds (200 = 2%)
uint256 public totalFeesCollected;      // Total fees collected

mapping(address => address[]) public founderCampaigns; // Founder → campaigns
mapping(address => bool) public isCampaign;            // Quick lookup
```

### Validation Constants

```solidity
uint256 public constant MIN_FUNDING_GOAL = 0.01 ether;
uint256 public constant MAX_FUNDING_GOAL = 10000 ether;
uint256 public constant MIN_TITLE_LENGTH = 3;
uint256 public constant MAX_TITLE_LENGTH = 100;
uint256 public constant MAX_DESCRIPTION_LENGTH = 1000;
uint256 public constant MIN_MILESTONE_PERCENTAGE = 500;  // 5%
uint256 public constant MAX_MILESTONE_PERCENTAGE = 5000; // 50%
uint256 public constant MIN_MILESTONE_DEADLINE = 7;      // days
uint256 public constant MAX_MILESTONE_DEADLINE = 365;    // days
uint256 public constant MAX_PLATFORM_FEE = 1000;         // 10%
```

### Core Function: createCampaign

```solidity
function createCampaign(
    string calldata title,
    string calldata description,
    uint256 fundingGoal,
    string[5] calldata milestoneDescriptions,
    uint256[5] calldata milestoneDeadlines,
    uint256[5] calldata milestonePercentages
) external payable nonReentrant returns (address campaignAddress) {
    // 1. Validate creation fee
    require(msg.value >= creationFee, "Insufficient creation fee");
    
    // 2. Validate title
    uint256 titleLength = bytes(title).length;
    require(
        titleLength >= MIN_TITLE_LENGTH && titleLength <= MAX_TITLE_LENGTH,
        "Invalid title length"
    );
    
    // 3. Validate description
    uint256 descLength = bytes(description).length;
    require(
        descLength > 0 && descLength <= MAX_DESCRIPTION_LENGTH,
        "Invalid description"
    );
    
    // 4. Validate funding goal
    require(
        fundingGoal >= MIN_FUNDING_GOAL && fundingGoal <= MAX_FUNDING_GOAL,
        "Invalid funding goal"
    );
    
    // 5. Validate milestone descriptions (not empty)
    for (uint256 i = 0; i < 5; i++) {
        require(
            bytes(milestoneDescriptions[i]).length > 0, 
            "Empty milestone description"
        );
    }
    
    // 6. Validate milestone deadlines (chronological and within range)
    for (uint256 i = 0; i < 5; i++) {
        require(
            milestoneDeadlines[i] >= MIN_MILESTONE_DEADLINE &&
            milestoneDeadlines[i] <= MAX_MILESTONE_DEADLINE,
            "Milestone deadline out of range"
        );
        
        // Check chronological order (except first)
        if (i > 0) {
            require(
                milestoneDeadlines[i] > milestoneDeadlines[i-1],
                "Deadlines must be chronological"
            );
        }
    }
    
    // 7. Validate milestone percentages (individual and total)
    uint256 totalPercentage = 0;
    for (uint256 i = 0; i < 5; i++) {
        require(
            milestonePercentages[i] >= MIN_MILESTONE_PERCENTAGE &&
            milestonePercentages[i] <= MAX_MILESTONE_PERCENTAGE,
            "Milestone percentage out of range"
        );
        totalPercentage += milestonePercentages[i];
    }
    
    // Ensure percentages sum to exactly 100%
    if (totalPercentage != 10000) {
        revert InvalidMilestoneCount();
    }
    
    // 8. Deploy new Campaign contract
    Campaign newCampaign = new Campaign(
        title,
        description,
        msg.sender,        // founder
        fundingGoal,
        milestoneDescriptions,
        milestoneDeadlines,
        milestonePercentages,
        platformFeePercentage
    );
    
    campaignAddress = address(newCampaign);
    
    // 9. Track campaign
    campaigns.push(campaignAddress);
    founderCampaigns[msg.sender].push(campaignAddress);
    isCampaign[campaignAddress] = true;
    campaignCount++;
    
    // 10. Track fees
    totalFeesCollected += msg.value;
    
    emit CampaignCreated(
        campaignAddress,
        msg.sender,
        title,
        fundingGoal,
        block.timestamp
    );
    
    return campaignAddress;
}
```

**Validation Summary:**
- ✅ Creation fee paid
- ✅ Title: 3-100 characters
- ✅ Description: 1-1000 characters
- ✅ Funding goal: 0.01-10000 ETH
- ✅ Milestone descriptions: not empty
- ✅ Milestone deadlines: 7-365 days, chronological
- ✅ Milestone percentages: 5-50% each, 100% total

---

## 🏛️ Governance.sol - Platform Management

### Contract Overview

```solidity
contract Governance is Ownable {
    // Platform-wide governance and dispute resolution
}
```

### Proposal Types

```solidity
enum ProposalType {
    UpdateFee,           // 0 - Update platform fee
    EmergencyPause,      // 1 - Pause a campaign
    DisputeResolution,   // 2 - Resolve dispute
    ParameterChange      // 3 - Change platform parameters
}

enum ProposalState {
    Active,     // 0 - Currently voting
    Passed,     // 1 - Approved, awaiting execution
    Failed,     // 2 - Rejected or no quorum
    Executed,   // 3 - Executed
    Cancelled   // 4 - Cancelled by owner
}
```

### Proposal Structure

```solidity
struct Proposal {
    uint256 id;
    ProposalType proposalType;
    string title;
    string description;
    address proposer;
    uint256 yesVotes;
    uint256 noVotes;
    uint256 totalVotingPower;
    uint256 createdAt;
    uint256 votingDeadline;
    uint256 executionTime;
    ProposalState state;
    bytes executionData;
    address targetContract;
}
```

### Key Constants

```solidity
uint256 public constant VOTING_PERIOD = 7 days;
uint256 public constant EXECUTION_DELAY = 2 days;
uint256 public constant QUORUM_PERCENTAGE = 3000;      // 30%
uint256 public constant APPROVAL_THRESHOLD = 6000;     // 60%
uint256 public constant MIN_PROPOSAL_POWER = 100000;   // Min voting power to propose
```

### Core Functions

```solidity
// Create proposal
function createProposal(
    ProposalType proposalType,
    string calldata title,
    string calldata description,
    bytes calldata executionData,
    address targetContract
) external returns (uint256)

// Vote on proposal
function vote(uint256 proposalId, bool support) external

// Finalize after voting period
function finalizeProposal(uint256 proposalId) external

// Execute passed proposal (after delay)
function executeProposal(uint256 proposalId) external

// Cancel proposal (owner only)
function cancelProposal(uint256 proposalId) external onlyOwner
```

---

## 📊 Data Structures

### Storage Layout

```
Campaign.sol Storage:
├── campaignData (CampaignData struct)
├── milestones[5] (Milestone[5] array)
├── funders (mapping: address => Funder)
├── fundersList (address[] array)
└── hasVotedOnMilestone (mapping: uint256 => mapping: address => bool)

CampaignFactory.sol Storage:
├── campaigns (address[] array)
├── campaignCount (uint256)
├── creationFee (uint256)
├── platformFeePercentage (uint256)
├── totalFeesCollected (uint256)
├── founderCampaigns (mapping: address => address[])
└── isCampaign (mapping: address => bool)

Governance.sol Storage:
├── proposals (mapping: uint256 => Proposal)
├── proposalCount (uint256)
├── activeProposals (uint256[] array)
├── votingPower (mapping: address => uint256)
├── hasVoted (mapping: uint256 => mapping: address => bool)
└── authorizedContracts (mapping: address => bool)
```

---

## 🔄 State Management

### Campaign State Transitions

```
Active (0)
    │
    ├─→ Completed (1)  [All milestones approved]
    │
    └─→ Failed (2)     [Deadline exceeded OR 2 rejections]
```

### Milestone State Transitions

```
Pending (0)
    │
    │ submitMilestone()
    ↓
Voting (2)
    │
    │ finalizeMilestone()
    ├─→ Approved (3) → Completed (5)  [>60% YES]
    │
    └─→ Rejected (4) → Pending (0)    [<60% YES, first rejection]
                    → Failed          [<60% YES, second rejection]
```

### Funder State Tracking

```
New Funder
    │ fund()
    ↓
Active Funder
    │
    ├─→ Voted on milestone    [missedVotes = 0]
    │
    ├─→ Missed 1 vote         [missedVotes = 1]
    │
    ├─→ Missed 2+ votes       [missedVotes >= 2, isAutoYes = true]
    │
    └─→ Claimed refund        [hasRefunded = true]
```

---

## 💰 Fund Flow

### Funding Flow

```
Funder sends 10 ETH (Balanced: 70/30)
    │
    ├─→ Committed Pool: 7 ETH
    │   └─→ Released per milestone:
    │       ├─→ M0 (10%): 0.7 ETH
    │       ├─→ M1 (20%): 1.4 ETH
    │       ├─→ M2 (25%): 1.75 ETH
    │       ├─→ M3 (25%): 1.75 ETH
    │       └─→ M4 (20%): 1.4 ETH
    │
    └─→ Reserve Pool: 3 ETH
        └─→ Released after final milestone
```

### Complete Campaign Fund Flow

```
Total Raised: 100 ETH
├─→ Conservative Funders (30 ETH)
│   ├─→ Committed: 15 ETH
│   └─→ Reserve: 15 ETH
│
├─→ Balanced Funders (50 ETH)
│   ├─→ Committed: 35 ETH
│   └─→ Reserve: 15 ETH
│
└─→ Aggressive Funders (20 ETH)
    ├─→ Committed: 18 ETH
    └─→ Reserve: 2 ETH

Total Committed Pool: 68 ETH
Total Reserve Pool: 32 ETH

Milestone Releases (from 68 ETH committed):
├─→ M0 (10%): 6.8 ETH
├─→ M1 (20%): 13.6 ETH
├─→ M2 (25%): 17 ETH
├─→ M3 (25%): 17 ETH
└─→ M4 (20%): 13.6 ETH

After M4 completion:
└─→ Reserve Release: 32 ETH

Total to Founder: 100 ETH (if all milestones approved)
```

### Refund Flow (Campaign Failed at M2)

```
Funder: 10 ETH (Balanced: 70/30)
├─→ Committed: 7 ETH
│   ├─→ Released M0 (10%): 0.7 ETH ❌ (lost)
│   ├─→ Released M1 (20%): 1.4 ETH ❌ (lost)
│   └─→ Unreleased: 4.9 ETH ✅ (refunded)
│
└─→ Reserve: 3 ETH ✅ (refunded)

Refund Calculation:
├─→ Unreleased committed: 4.9 ETH
├─→ Full reserve: 3 ETH
├─→ Subtotal: 7.9 ETH
├─→ Platform fee (2%): -0.158 ETH
└─→ Final refund: 7.742 ETH
```

---

## 🔒 Security Patterns

### 1. Checks-Effects-Interactions

**Pattern:**
```solidity
function secureFunction() external {
    // 1. CHECKS: Validate inputs and conditions
    require(condition, "Error message");
    
    // 2. EFFECTS: Update state
    state = newState;
    
    // 3. INTERACTIONS: External calls
    (bool success, ) = externalAddress.call{value: amount}("");
    require(success, "Transfer failed");
}
```

**Applied In:**
- `_releaseFunds()` - State updated before transfer to founder
- `_releaseReserves()` - Reserve cleared before transfer
- `claimRefund()` - Marked as refunded before sending ETH

### 2. ReentrancyGuard

**Usage:**
```solidity
function fund() external payable nonReentrant {
    // Protected from reentrancy
}
```

**Protected Functions:**
- `fund()` - Receiving funds
- `createCampaign()` - Creating campaigns
- `claimRefund()` - Claiming refunds

### 3. Access Control

**Modifiers:**
```solidity
modifier onlyFounder() {
    if (msg.sender != campaignData.founder) revert OnlyFounder();
    _;
}

modifier onlyFunder() {
    if (funders[msg.sender].totalContribution == 0) revert NotFunder();
    _;
}

modifier campaignActive() {
    if (campaignData.state != CampaignState.Active) {
        revert CampaignNotActive();
    }
    _;
}
```

### 4. Pausable Pattern

**Implementation:**
```solidity
function fund() external whenNotPaused {
    // Can be paused in emergency
}

function claimRefund() external {
    // Works even when paused (protects funders)
}
```

### 5. Input Validation

**Comprehensive Validation:**
- Length checks (strings)
- Range checks (amounts, percentages)
- Chronological checks (deadlines)
- Sum checks (percentages = 100%)
- Existence checks (not empty)

### 6. Custom Errors

**Gas-Efficient Errors:**
```solidity
error OnlyFounder();
error BelowMinimumContribution();
error InvalidRiskProfile();

// Instead of:
require(condition, "Long error string"); // Expensive

// Use:
if (!condition) revert CustomError(); // Cheaper
```

---

## 📚 Additional Resources

- **[INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)** - How to integrate with frontend
- **[API_REFERENCE.md](./API_REFERENCE.md)** - Complete function reference
- **[PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md)** - High-level overview

---

**Built with security and efficiency in mind** 🔒
