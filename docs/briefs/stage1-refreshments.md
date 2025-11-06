# IDRX Crowdfunding Platform - Technical Specifications

## Document Information
- **Version**: 1.0
- **Date**: November 5, 2025
- **Author**: Blockchain/Web3 Consultant
- **Project**: Lisk IDRX Crowdfunding Platform MVP

---

## Executive Summary

This document outlines the technical architecture and implementation strategy for an IDRX-based crowdfunding platform on the Lisk network. The platform will use IDRX (Indonesian Rupiah stablecoin) as the primary funding mechanism, focusing on MVP core features with a phased development approach.

---

## Table of Contents
1. [Q1: IDRX Integration Approach](#q1-idrx-integration-approach)
2. [Q2: Project Scope - Core Features](#q2-project-scope---core-features)
3. [Q3: Testing Strategy](#q3-testing-strategy)
4. [Q4: Contract Architecture](#q4-contract-architecture)
5. [Implementation Roadmap](#implementation-roadmap)
6. [Risk Assessment](#risk-assessment)
7. [Success Metrics](#success-metrics)

---

## Q1: IDRX Integration Approach

### **Decision: Option A - Accept IDRX Tokens Only**

### Strategic Rationale

#### 1. Regulatory Alignment
- IDRX is a regulated stablecoin pegged to Indonesian Rupiah (IDR)
- Provides legal compliance for Indonesian market
- Reduces regulatory uncertainty compared to volatile cryptocurrencies

#### 2. Price Stability
- Eliminates volatility risks inherent in ETH-based crowdfunding
- 1 IDRX = 1 IDR peg ensures predictable funding goals
- Campaign creators can set realistic, stable funding targets

#### 3. User Experience
- Indonesian users think in Rupiah - IDRX maintains familiar denomination
- No mental conversion required (ETH → IDR)
- Simplified accounting and tax reporting

#### 4. Gas Optimization
- Single token logic reduces contract complexity
- Lower gas costs compared to multi-token support
- Simpler security audit surface area

---

### Technical Implementation

#### Smart Contract Pattern
```solidity
// Campaign.sol - IDRX Contribution Logic
function contribute(uint256 _amount) external nonReentrant {
    require(_amount >= minContribution, "Below minimum");
    require(block.timestamp < deadline, "Campaign ended");
    require(state == State.Active, "Campaign not active");
    
    // User must approve() IDRX contract first
    require(
        idrxToken.transferFrom(msg.sender, address(this), _amount),
        "IDRX transfer failed"
    );
    
    contributions[msg.sender] += _amount;
    totalRaised += _amount;
    
    emit Contributed(msg.sender, _amount, totalRaised);
}
```

#### Frontend Approval Flow
```javascript
// Two-step contribution process
async function contributeToCampaign(amount) {
  // Step 1: Approve IDRX spending
  const approveTx = await idrxContract.approve(
    campaignAddress, 
    amount
  );
  await approveTx.wait();
  
  // Step 2: Execute contribution
  const contributeTx = await campaignContract.contribute(amount);
  await contributeTx.wait();
  
  return contributeTx;
}
```

---

### Critical Considerations

#### 1. Approval Flow UX
- **Challenge**: Two-transaction process may confuse users
- **Solution**: Clear UI with progress indicators
- **Implementation**: Modal showing "Step 1/2: Approve IDRX" → "Step 2/2: Confirm Contribution"

#### 2. IDRX Liquidity
- Ensure users can easily acquire IDRX
- Integration with DEX/bridge for ETH → IDRX swap
- Provide clear instructions for IDRX acquisition

#### 3. Contract Addresses
- Must use official IDRX contract addresses per Lisk documentation
- Sepolia Testnet: `0x...` (reference from lisk-idrx docs)
- Mainnet: TBD (post-testnet validation)

#### 4. Allowance Management
- Check existing allowance before requesting approval
- Option to set unlimited allowance (with user consent)
- Handle allowance edge cases (partial allowances)

---

## Q2: Project Scope - Core Features

### **Decision: MVP Focus on Campaign Creation & Funding**

### Phase 1: MUST-HAVE Features (MVP)

#### 1. Campaign Creation
**Core Fields:**
- Title (string, max 100 chars)
- Description (string, max 1000 chars)
- Funding Goal (uint256, in IDRX wei)
- Deadline (uint256, Unix timestamp)
- Creator Address (address, immutable)

**Optional Metadata:**
- Category (enum: Tech, Social, Art, etc.)
- Image URL (IPFS hash or external URL)
- Beneficiary address (if different from creator)

**Smart Contract Structure:**
```solidity
struct CampaignData {
    string title;
    string description;
    uint256 goal;
    uint256 deadline;
    address creator;
    uint256 totalRaised;
    State state;
}
```

---

#### 2. Contribution Mechanism

**User Flow:**
1. User browses active campaigns
2. Selects campaign to fund
3. Enters contribution amount (IDRX)
4. Approves IDRX spending (MetaMask/wallet)
5. Confirms contribution transaction
6. Receives contribution confirmation

**Smart Contract Logic:**
```solidity
mapping(address => uint256) public contributions;
uint256 public totalRaised;
uint256 public minContribution = 10000 * 10**18; // 10,000 IDRX minimum

function contribute(uint256 _amount) external {
    require(_amount >= minContribution, "Below minimum");
    require(block.timestamp < deadline, "Campaign ended");
    
    idrxToken.transferFrom(msg.sender, address(this), _amount);
    
    contributions[msg.sender] += _amount;
    totalRaised += _amount;
    
    emit Contributed(msg.sender, _amount);
}
```

**Features:**
- Real-time tracking of total raised
- Individual contribution history per user
- Multiple contributions allowed per user
- Contribution limits (optional, for regulatory compliance)

---

#### 3. Fund Release Logic

**Simple All-or-Nothing Model:**

```solidity
enum State { Active, Successful, Failed }

function checkAndUpdateState() public {
    if (block.timestamp >= deadline) {
        if (totalRaised >= goal) {
            state = State.Successful;
        } else {
            state = State.Failed;
        }
    }
}

function withdraw() external {
    require(msg.sender == creator, "Only creator");
    require(state == State.Successful, "Campaign not successful");
    
    uint256 amount = totalRaised;
    totalRaised = 0;
    
    require(idrxToken.transfer(creator, amount), "Transfer failed");
    emit Withdrawn(creator, amount);
}

function refund() external {
    require(state == State.Failed, "Campaign not failed");
    
    uint256 contribution = contributions[msg.sender];
    require(contribution > 0, "No contribution");
    
    contributions[msg.sender] = 0;
    
    require(idrxToken.transfer(msg.sender, contribution), "Refund failed");
    emit Refunded(msg.sender, contribution);
}
```

**Rules:**
- If goal reached by deadline → Funds released to creator
- If goal NOT reached → Automatic refunds available
- No partial withdrawals in MVP

---

#### 4. Basic Security

**Security Measures:**

```solidity
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Campaign is ReentrancyGuard, Pausable, Ownable {
    // Reentrancy protection on all state-changing functions
    function contribute(uint256 _amount) external nonReentrant whenNotPaused {
        // ... contribution logic
    }
    
    // Emergency pause capability
    function pause() external onlyOwner {
        _pause();
    }
    
    // Access control for withdrawals
    function withdraw() external {
        require(msg.sender == creator, "Unauthorized");
        // ... withdrawal logic
    }
}
```

**Security Checklist:**
- ✅ Reentrancy guards on all external functions
- ✅ Pausable in emergencies
- ✅ Access control (only creator can withdraw)
- ✅ Check-effects-interactions pattern
- ✅ No delegatecall usage
- ✅ Integer overflow protection (Solidity 0.8+)

---

### Deferred to Phase 2 (Post-MVP)

#### ❌ Milestone-Based Releases
**Why Deferred:**
- Adds significant complexity (escrow logic, voting, dispute resolution)
- Requires off-chain coordination
- Better suited for mature platform with proven user base

**Future Implementation:**
```solidity
// Phase 2 structure (reference only)
struct Milestone {
    string description;
    uint256 amount;
    bool completed;
    uint256 votesFor;
    uint256 votesAgainst;
}
```

---

#### ❌ Voting Systems
**Why Deferred:**
- Your existing voting implementation is complex
- Requires token-weighted or reputation-based voting logic
- Governance overhead may slow MVP adoption

**Future Use Cases:**
- Vote on milestone completion
- Vote on fund allocation changes
- Vote on campaign extensions

---

#### ❌ Advanced Refund Mechanisms
**Why Deferred:**
- Simple binary refund (success/fail) sufficient for MVP
- Partial refunds add accounting complexity
- Dispute resolution requires manual intervention

**Future Features:**
- Partial refunds for milestone failures
- Timed refund windows
- Dispute arbitration system

---

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                 CampaignFactory.sol                      │
│  - createCampaign()                                      │
│  - getAllCampaigns()                                     │
│  - idrxToken address                                     │
└──────────────────┬──────────────────────────────────────┘
                   │ deploys
                   ▼
┌─────────────────────────────────────────────────────────┐
│                   Campaign.sol                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │  State: Active/Successful/Failed                  │  │
│  │  - title, description, goal, deadline             │  │
│  │  - creator, totalRaised                           │  │
│  └───────────────────────────────────────────────────┘  │
│                                                           │
│  Functions:                                              │
│  - contribute(amount) ──► transferFrom(user, this)      │
│  - withdraw() ──────────► transfer(creator, total)      │
│  - refund() ────────────► transfer(user, contribution)  │
│  - checkState() ────────► update state based on time    │
└──────────────────┬──────────────────────────────────────┘
                   │ interacts with
                   ▼
┌─────────────────────────────────────────────────────────┐
│              IDRX Token (ERC20)                          │
│  - approve(spender, amount)                              │
│  - transferFrom(from, to, amount)                        │
│  - transfer(to, amount)                                  │
└─────────────────────────────────────────────────────────┘
```

---

## Q3: Testing Strategy

### **Decision: Option C - Hybrid Testing Approach**

### Approach 1: Mock IDRX for Unit Tests

#### Use Case
Fast, isolated contract logic testing without external dependencies

#### Implementation

```solidity
// test/mocks/MockIDRX.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockIDRX is ERC20 {
    constructor() ERC20("Mock IDRX", "mIDRX") {
        // Mint 1 million tokens to deployer
        _mint(msg.sender, 1_000_000 * 10**18);
    }
    
    // Helper function for testing
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
    
    // Helper function for testing
    function burn(address from, uint256 amount) external {
        _burn(from, amount);
    }
}
```

#### Test Example

```javascript
// test/unit/Campaign.test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Campaign Unit Tests", function () {
  let mockIDRX, campaign, owner, contributor;
  
  beforeEach(async function () {
    [owner, contributor] = await ethers.getSigners();
    
    // Deploy mock IDRX
    const MockIDRX = await ethers.getContractFactory("MockIDRX");
    mockIDRX = await MockIDRX.deploy();
    
    // Deploy campaign
    const Campaign = await ethers.getContractFactory("Campaign");
    campaign = await Campaign.deploy(
      mockIDRX.address,
      owner.address,
      "Test Campaign",
      ethers.utils.parseEther("100000"), // 100k IDRX goal
      Math.floor(Date.now() / 1000) + 86400 // 1 day deadline
    );
    
    // Mint tokens to contributor
    await mockIDRX.mint(contributor.address, ethers.utils.parseEther("50000"));
  });
  
  it("Should accept contributions", async function () {
    const amount = ethers.utils.parseEther("10000");
    
    // Approve and contribute
    await mockIDRX.connect(contributor).approve(campaign.address, amount);
    await campaign.connect(contributor).contribute(amount);
    
    expect(await campaign.totalRaised()).to.equal(amount);
    expect(await campaign.contributions(contributor.address)).to.equal(amount);
  });
  
  it("Should reject contributions below minimum", async function () {
    const amount = ethers.utils.parseEther("5000"); // Below 10k minimum
    
    await mockIDRX.connect(contributor).approve(campaign.address, amount);
    
    await expect(
      campaign.connect(contributor).contribute(amount)
    ).to.be.revertedWith("Below minimum");
  });
});
```

#### Benefits
- ⚡ Instant test execution (no network calls)
- 🎯 Isolated contract logic testing
- 🔧 Easy balance manipulation for edge cases
- 💰 No testnet faucet requirements
- 🧪 Perfect for TDD (Test-Driven Development)

---

### Approach 2: Lisk Sepolia Fork for Integration Tests

#### Use Case
Pre-deployment validation with real IDRX contract behavior

#### Configuration

```javascript
// hardhat.config.js
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.20",
  networks: {
    hardhat: {
      forking: {
        url: "https://rpc.sepolia-api.lisk.com",
        blockNumber: 12345678, // Pin to specific block for consistency
        enabled: true
      }
    },
    liskSepolia: {
      url: "https://rpc.sepolia-api.lisk.com",
      accounts: [process.env.PRIVATE_KEY],
      chainId: 4202
    }
  }
};
```

#### Integration Test Example

```javascript
// test/integration/Campaign.fork.test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Campaign Integration Tests (Lisk Sepolia Fork)", function () {
  const IDRX_ADDRESS = "0x..."; // Real IDRX address from docs
  const IDRX_WHALE = "0x..."; // Address with IDRX balance
  
  let campaign, owner, idrxContract;
  
  before(async function () {
    // Impersonate IDRX whale for testing
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [IDRX_WHALE]
    });
    
    const whale = await ethers.getSigner(IDRX_WHALE);
    [owner] = await ethers.getSigners();
    
    // Connect to real IDRX contract
    idrxContract = await ethers.getContractAt(
      "IERC20",
      IDRX_ADDRESS
    );
    
    // Deploy campaign with real IDRX
    const Campaign = await ethers.getContractFactory("Campaign");
    campaign = await Campaign.deploy(
      IDRX_ADDRESS,
      owner.address,
      "Fork Test Campaign",
      ethers.utils.parseEther("100000"),
      Math.floor(Date.now() / 1000) + 86400
    );
  });
  
  it("Should work with real IDRX contract", async function () {
    const whale = await ethers.getSigner(IDRX_WHALE);
    const amount = ethers.utils.parseEther("10000");
    
    // Use real IDRX from whale account
    await idrxContract.connect(whale).approve(campaign.address, amount);
    await campaign.connect(whale).contribute(amount);
    
    expect(await campaign.totalRaised()).to.equal(amount);
  });
  
  it("Should calculate accurate gas costs", async function () {
    const whale = await ethers.getSigner(IDRX_WHALE);
    const amount = ethers.utils.parseEther("10000");
    
    await idrxContract.connect(whale).approve(campaign.address, amount);
    
    const tx = await campaign.connect(whale).contribute(amount);
    const receipt = await tx.wait();
    
    console.log("Gas used for contribution:", receipt.gasUsed.toString());
    expect(receipt.gasUsed).to.be.lessThan(150000);
  });
});
```

#### Test Scenarios
- ✅ Real IDRX contract interaction (actual ABI)
- ✅ Gas cost validation
- ✅ Multi-user funding flows
- ✅ Deadline/refund edge cases
- ✅ Network-specific behaviors

---

### Testing Workflow

#### NPM Scripts Configuration

```json
// package.json
{
  "scripts": {
    "test:unit": "hardhat test test/unit/**/*.test.js",
    "test:fork": "hardhat test test/integration/**/*.fork.test.js",
    "test:all": "npm run test:unit && npm run test:fork",
    "test:coverage": "hardhat coverage",
    "test:gas": "REPORT_GAS=true hardhat test"
  }
}
```

#### Development Workflow

```bash
# Quick development cycle (fast feedback)
npm run test:unit

# Pre-deployment validation (comprehensive)
npm run test:fork

# Full CI pipeline
npm run test:all

# Gas optimization analysis
npm run test:gas

# Security coverage report
npm run test:coverage
```

---

### Test Coverage Requirements

| Category | Unit Tests | Integration Tests |
|----------|-----------|-------------------|
| **Campaign Creation** | ✅ Valid params<br>✅ Invalid params<br>✅ Edge cases | ✅ Factory deployment<br>✅ Gas costs<br>✅ Event emission |
| **Contributions** | ✅ Min/max amounts<br>✅ Multiple contributions<br>✅ Approval failures | ✅ Real IDRX transfer<br>✅ Concurrent users<br>✅ Network latency |
| **Withdrawals** | ✅ Success conditions<br>✅ Access control<br>✅ State changes | ✅ Large amount transfers<br>✅ Gas optimization |
| **Refunds** | ✅ Failure conditions<br>✅ Partial refunds<br>✅ Reentrancy | ✅ Multi-user refunds<br>✅ Gas costs at scale |
| **State Management** | ✅ Deadline checks<br>✅ State transitions<br>✅ Time manipulation | ✅ Real block timestamps<br>✅ Network delays |

---

### Continuous Integration Setup

```yaml
# .github/workflows/test.yml
name: Smart Contract Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Run integration tests
        run: npm run test:fork
        env:
          LISK_RPC_URL: ${{ secrets.LISK_RPC_URL }}
      
      - name: Generate coverage report
        run: npm run test:coverage
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
```

---

## Q4: Contract Architecture

### **Decision: Option C - Use Danantiri-Style Patterns from Lisk IDRX Docs**

### Analysis of Existing Contracts

#### SimpleCampaign/SimpleFactory Assessment

**Keep (✅):**
- Factory deployment pattern
- Event structures (standard ERC20-style events)
- Access control patterns (Ownable)

**Adapt (🔄):**
- Replace `msg.value` with `idrxToken.transferFrom()`
- Replace `payable` addresses with standard addresses
- Replace `address.transfer()` with `idrxToken.transfer()`

**Remove (❌):**
- ETH-specific logic (`receive()`, `fallback()`)
- Unused voting mechanisms
- Milestone complexity (deferred to Phase 2)

---

### Recommended Contract Structure

#### 1. IDRX Interface

```solidity
// contracts/interfaces/IIDRX.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IIDRX is IERC20 {
    // Standard ERC20 interface inherited
    // Add any IDRX-specific functions if needed
}
```

---

#### 2. Campaign Contract (Danantiri-Inspired)

```solidity
// contracts/Campaign.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./interfaces/IIDRX.sol";

contract Campaign is ReentrancyGuard, Pausable {
    // ============ State Variables ============
    
    IIDRX public immutable idrxToken;
    address public immutable creator;
    address public immutable factory;
    
    string public title;
    string public description;
    uint256 public goal;
    uint256 public deadline;
    uint256 public totalRaised;
    uint256 public constant MIN_CONTRIBUTION = 10_000 * 10**18; // 10k IDRX
    
    enum State { Active, Successful, Failed, Cancelled }
    State public state;
    
    mapping(address => uint256) public contributions;
    address[] public contributors;
    
    // ============ Events ============
    
    event Contributed(
        address indexed contributor,
        uint256 amount,
        uint256 totalRaised
    );
    
    event Withdrawn(
        address indexed creator,
        uint256 amount
    );
    
    event Refunded(
        address indexed contributor,
        uint256 amount
    );
    
    event StateChanged(
        State oldState,
        State newState
    );
    
    // ============ Modifiers ============
    
    modifier onlyCreator() {
        require(msg.sender == creator, "Only creator");
        _;
    }
    
    modifier onlyFactory() {
        require(msg.sender == factory, "Only factory");
        _;
    }
    
    modifier inState(State _state) {
        require(state == _state, "Invalid state");
        _;
    }
    
    // ============ Constructor ============
    
    constructor(
        address _idrxToken,
        address _creator,
        string memory _title,
        string memory _description,
        uint256 _goal,
        uint256 _duration
    ) {
        require(_idrxToken != address(0), "Invalid IDRX address");
        require(_creator != address(0), "Invalid creator");
        require(_goal > 0, "Goal must be positive");
        require(_duration > 0, "Duration must be positive");
        require(_duration <= 365 days, "Duration too long");
        
        idrxToken = IIDRX(_idrxToken);
        creator = _creator;
        factory = msg.sender;
        title = _title;
        description = _description;
        goal = _goal;
        deadline = block.timestamp + _duration;
        state = State.Active;
    }
    
    // ============ External Functions ============
    
    /**
     * @notice Contribute IDRX to the campaign
     * @param _amount Amount of IDRX to contribute (in wei)
     */
    function contribute(uint256 _amount) 
        external 
        nonReentrant 
        whenNotPaused 
        inState(State.Active) 
    {
        require(block.timestamp < deadline, "Campaign ended");
        require(_amount >= MIN_CONTRIBUTION, "Below minimum");
        require(
            idrxToken.balanceOf(msg.sender) >= _amount,
            "Insufficient balance"
        );
        
        // Transfer IDRX from contributor to campaign
        require(
            idrxToken.transferFrom(msg.sender, address(this), _amount),
            "Transfer failed"
        );
        
        // Track contribution
        if (contributions[msg.sender] == 0) {
            contributors.push(msg.sender);
        }
        contributions[msg.sender] += _amount;
        totalRaised += _amount;
        
        emit Contributed(msg.sender, _amount, totalRaised);
        
        // Auto-check if goal reached
        if (totalRaised >= goal) {
            _updateState(State.Successful);
        }
    }
    
    /**
     * @notice Creator withdraws funds after successful campaign
     */
    function withdraw() 
        external 
        onlyCreator 
        nonReentrant 
        inState(State.Successful) 
    {
        uint256 amount = totalRaised;
        totalRaised = 0;
        
        require(
            idrxToken.transfer(creator, amount),
            "Withdrawal failed"
        );
        
        emit Withdrawn(creator, amount);
    }
    
    /**
     * @notice Contributors get refund if campaign fails
     */
    function refund() 
        external 
        nonReentrant 
    {
        require(
            state == State.Failed || state == State.Cancelled,
            "Cannot refund"
        );
        
        uint256 contribution = contributions[msg.sender];
        require(contribution > 0, "No contribution");
        
        contributions[msg.sender] = 0;
        
        require(
            idrxToken.transfer(msg.sender, contribution),
            "Refund failed"
        );
        
        emit Refunded(msg.sender, contribution);
    }
    
    /**
     * @notice Check and update campaign state based on deadline
     */
    function checkState() external {
        require(state == State.Active, "Campaign not active");
        require(block.timestamp >= deadline, "Deadline not reached");
        
        if (totalRaised >= goal) {
            _updateState(State.Successful);
        } else {
            _updateState(State.Failed);
        }
    }
    
    /**
     * @notice Creator can cancel campaign before any contributions
     */
    function cancel() 
        external 
        onlyCreator 
        inState(State.Active) 
    {
        require(totalRaised == 0, "Cannot cancel with contributions");
        _updateState(State.Cancelled);
    }
    
    /**
     * @notice Emergency pause (factory only)
     */
    function pause() external onlyFactory {
        _pause();
    }
    
    /**
     * @notice Unpause (factory only)
     */
    function unpause() external onlyFactory {
        _unpause();
    }
    
    // ============ View Functions ============
    
    function getContributors() external view returns (address[] memory) {
        return contributors;
    }
    
    function getContributorCount() external view returns (uint256) {
        return contributors.length;
    }
    
    function getTimeRemaining() external view returns (uint256) {
        if (block.timestamp >= deadline) {
            return 0;
        }
        return deadline - block.timestamp;
    }
    
    function getProgress() external view returns (uint256) {
        if (goal == 0) return 0;
        return (totalRaised * 100) / goal;
    }
    
    // ============ Internal Functions ============
    
    function _updateState(State _newState) internal {
        State oldState = state;
        state = _newState;
        emit StateChanged(oldState, _newState);
    }
}
```

---

#### 3. Campaign Factory Contract

```solidity
// contracts/CampaignFactory.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./Campaign.sol";

contract CampaignFactory is Ownable {
    // ============ State Variables ============
    
    address public immutable idrxToken;
    Campaign[] public campaigns;
    mapping(address => Campaign[]) public campaignsByCreator;
    
    uint256 public totalCampaigns;
    uint256 public constant MAX_DURATION = 365 days;
    uint256 public constant MIN_GOAL = 1_000 * 10**18; // 1k IDRX minimum
    
    // ============ Events ============
    
    event CampaignCreated(
        address indexed campaign,
        address indexed creator,
        string title,
        uint256 goal,
        uint256 deadline
    );
    
    event CampaignPaused(address indexed campaign);
    event CampaignUnpaused(address indexed campaign);
    
    // ============ Constructor ============
    
    constructor(address _idrxToken) {
        require(_idrxToken != address(0), "Invalid IDRX address");
        idrxToken = _idrxToken;
    }
    
    // ============ External Functions ============
    
    /**
     * @notice Create a new crowdfunding campaign
     * @param _title Campaign title
     * @param _description Campaign description
     * @param _goal Funding goal in IDRX
     * @param _duration Campaign duration in seconds
     * @return campaignAddress Address of deployed campaign
     */
    function createCampaign(
        string memory _title,
        string memory _description,
        uint256 _goal,
        uint256 _duration
    ) external returns (address campaignAddress) {
        require(_goal >= MIN_GOAL, "Goal too low");
        require(_duration <= MAX_DURATION, "Duration too long");
        require(bytes(_title).length > 0, "Title required");
        
        Campaign newCampaign = new Campaign(
            idrxToken,
            msg.sender,
            _title,
            _description,
            _goal,
            _duration
        );
        
        campaigns.push(newCampaign);
        campaignsByCreator[msg.sender].push(newCampaign);
        totalCampaigns++;
        
        emit CampaignCreated(
            address(newCampaign),
            msg.sender,
            _title,
            _goal,
            block.timestamp + _duration
        );
        
        return address(newCampaign);
    }
    
    // ============ View Functions ============
    
    function getAllCampaigns() external view returns (Campaign[] memory) {
        return campaigns;
    }
    
    function getCampaignsByCreator(address _creator) 
        external 
        view 
        returns (Campaign[] memory) 
    {
        return campaignsByCreator[_creator];
    }
}
```

---

### Migration Strategy from Existing Contracts

#### Analyze SimpleCampaign/SimpleFactory

**✅ Keep:**
- Factory deployment pattern
- Event structures

**🔄 Adapt:**
- Replace native ETH logic with ERC20 transferFrom()

**❌ Remove:**
- Unused voting/milestone complexity

---

### Integration with Lisk IDRX Documentation

```javascript
// Reference official IDRX contract address
const IDRX_SEPOLIA = "0x..."; // From lisk-idrx docs

// Use provided ABI for interface
import IDRX_ABI from './abis/IDRX.json';
```

---

## Implementation Roadmap

### Week 1: Foundation
- Deploy MockIDRX for local testing
- Create Campaign.sol with IDRX integration
- Implement CampaignFactory.sol
- Write unit tests (MockIDRX)

### Week 2: Integration
- Configure Hardhat Lisk Sepolia fork
- Test with real IDRX contract
- Frontend: Approve + Contribute flow
- Deploy to Lisk Sepolia testnet

### Week 3: Polish
- Security audit (reentrancy, access control)
- Gas optimization
- UI/UX refinements
- Documentation

---

## Risk Assessment

| Risk | Mitigation |
|------|-----------|
| IDRX Approval UX confusion | Clear 2-step UI flow with wallet prompts |
| Deadline enforcement | Use block.timestamp with buffer periods |
| Failed campaign refunds | Automated refund function with gas subsidies |
| Contract upgradability | Use proxy pattern if post-launch changes likely |

---

## Success Metrics

✅ 100% test coverage (unit + integration)
✅ Gas cost < 150k per contribution
✅ < 5 clicks from campaign view → contribution complete
✅ Zero security vulnerabilities (Slither/Mythril scan)