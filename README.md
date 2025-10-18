# 🚀 Web3 Milestone Crowdfunding Platform

A simplified, decentralized crowdfunding platform built on Base L2 that focuses on core milestone-based funding without unnecessary complexity.

## ✨ What This Solves

**Traditional Crowdfunding Problems:**
- ❌ All-or-nothing funding (no partial releases)
- ❌ No funder control after funding
- ❌ High platform fees (5-10%)
- ❌ Centralized control
- ❌ No transparency

**Our Solution:**
- ✅ Milestone-based releases (incremental funding)
- ✅ Simple milestone completion by founders
- ✅ Low platform fees (2%)
- ✅ Fully decentralized
- ✅ Complete transparency on blockchain

## 🎯 How It Works

### For Founders (Project Creators)
1. **Create Campaign** - Define 3 milestones with deadlines and funding percentages
2. **Set Funding Goal** - Choose target amount (0.01-10000 ETH)
3. **Complete Milestones** - Mark milestones as complete when done
4. **Receive Funds** - Get automatic releases upon completion

### For Contributors (Backers)
1. **Fund Campaign** - Contribute ETH (minimum 0.001 ETH)
2. **Track Progress** - See milestone completion
3. **Get Refunds** - If campaign fails, automatic refunds

## 🏗️ Project Structure

```
hackathon-project/
│
├── contracts/                      # Smart contracts (Solidity)
│   ├── Campaign.sol               # Core campaign logic (9.0 KB)
│   ├── CampaignFactory.sol        # Campaign deployment (16.3 KB)
│   └── Governance.sol              # Platform governance (7.3 KB)
│
├── test/                          # Test suites (113 tests)
│   ├── Campaign.test.ts           # 51 tests - funding, milestones, voting, refunds
│   ├── CampaignFactory.test.ts    # 15 tests - creation, validation, fees
│   ├── Governance.test.ts          # 35 tests - proposals, voting, execution
│   └── Integration.test.ts         # 6 tests - end-to-end scenarios
│
├── frontend/                      # Next.js frontend application
│   ├── src/app/                   # Next.js 14 app router
│   ├── src/components/            # React components
│   └── src/hooks/                 # Custom Web3 hooks
│
├── scripts/                       # Deployment scripts
├── deployments/                   # Deployment records
├── artifacts/                     # Compiled contracts (generated)
├── cache/                         # Build cache (generated)
├── typechain-types/              # TypeScript types (generated)
│
├── hardhat.config.ts             # Hardhat configuration
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
├── .env.example                  # Environment variables template
└── README.md                     # This file
```

## 🎯 Key Features

### 🎯 **Milestone-Based Funding**
- **3 Milestones**: Prototype → Beta → Launch
- **Progressive Release**: Funds released upon milestone completion
- **Founder Control**: Founders mark milestones as complete
- **Automatic Release**: Funds automatically released to founder

### 💰 **Simple Funding**
- **Direct Contributions**: Users fund campaigns with ETH
- **Goal Tracking**: Campaigns have funding goals
- **Refund Protection**: Refunds available if campaign fails

### 🛡️ **Basic Protection**
- **Campaign Failure**: Founders can mark campaigns as failed
- **Automatic Refunds**: Contributors can claim refunds
- **No Complex Voting**: Simplified decision making

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- MetaMask wallet
- Base Sepolia testnet ETH

### 1. Install Dependencies
```bash
npm install
cd frontend && npm install
```

### 2. Set Up Environment
```bash
# Copy environment template
cp .env.example .env

# Edit .env with your details:
# PRIVATE_KEY=your_private_key_here
# BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
# BASESCAN_API_KEY=your_api_key_here
```

### 3. Get Testnet ETH
- Visit: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet
- Connect wallet and claim free ETH

### 4. Deploy & Run
```bash
# Deploy contracts to Base Sepolia
npm run deploy:sepolia

# Start frontend
cd frontend && npm run dev
```

## 🧪 Testing

### Run All Tests
```bash
npm test
# Expected: 113 passing tests
```

### Test Coverage
- **Campaign**: 51 tests (funding, milestones, voting, refunds)
- **Factory**: 15 tests (creation, validation, fees)
- **Governance**: 35 tests (proposals, voting, execution)
- **Integration**: 6 tests (end-to-end scenarios)

## 📊 Example Campaign

**Goal**: 10 ETH
**Milestones**:
- M1: Prototype (30% release) - 30 days
- M2: Beta (40% release) - 90 days  
- M3: Launch (30% release) - 150 days

**Contributor workflow:**
1. Fund campaign with 1 ETH
2. Track milestone completion
3. Funds released automatically as milestones complete

## 🔧 Development

### Smart Contract Development
```bash
# Compile contracts
npm run compile

# Run tests
npm test

# Deploy to local network
npm run node
npm run deploy:local

# Deploy to Base Sepolia
npm run deploy:sepolia
```

### Frontend Development
```bash
cd frontend

# Start development server
npm run dev

# Build for production
npm run build
```

## 🚀 Deployment

### Base Sepolia Testnet
```bash
# Deploy contracts
npm run deploy:sepolia

# Verify contracts
npx hardhat verify --network baseSepolia <CONTRACT_ADDRESS>
```

### Base Mainnet
```bash
# Deploy to mainnet (after security audit)
npm run deploy:base
```

## 📈 Gas Costs

| Operation | Gas Cost | ETH Cost (Base) |
|-----------|----------|-----------------|
| Create Campaign | ~3.4M | ~0.04 ETH |
| Fund Campaign | ~100K | ~0.001 ETH |
| Complete Milestone | ~50K | ~0.001 ETH |
| Claim Refund | ~50K | ~0.001 ETH |

## 💻 Smart Contract Code Explanation

### Core Smart Contract Architecture

#### `contracts/Campaign.sol` - Individual Campaign Logic

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

contract Campaign is Ownable, ReentrancyGuard, Pausable {
    // Campaign data structure
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
    
    // Milestone structure
    struct Milestone {
        string description;
        uint256 releasePercentage;
        uint256 deadline;
        MilestoneState state;
        bool completed;
    }
    
    // Funder information
    struct Funder {
        uint256 totalContribution;
        bool hasRefunded;
        uint256 fundedAt;
    }
    
    // State variables
    CampaignData public campaignData;
    Milestone[3] public milestones;
    mapping(address => Funder) public funders;
    address[] public fundersList;
    
    // Events
    event CampaignCreated(string title, uint256 fundingGoal);
    event FundReceived(address indexed funder, uint256 amount);
    event MilestoneCompleted(uint256 indexed milestoneId, uint256 releaseAmount);
    event RefundClaimed(address indexed funder, uint256 amount);
}
```

**Key Functions Explained:**

#### 1. **Funding Function**
```solidity
function fund() external payable nonReentrant campaignActive whenNotPaused {
    // Validate minimum contribution
    require(msg.value >= MIN_CONTRIBUTION, "Below minimum contribution");
    require(msg.value > 0, "Must send ETH");
    
    // Check if campaign is still active
    require(campaignData.state == CampaignState.Active, "Campaign not active");
    
    // Check if funding goal not exceeded
    require(campaignData.totalRaised + msg.value <= campaignData.fundingGoal, "Goal exceeded");
    
    // Update funder information
    if (funders[msg.sender].totalContribution == 0) {
        fundersList.push(msg.sender);
    }
    
    funders[msg.sender].totalContribution += msg.value;
    funders[msg.sender].fundedAt = block.timestamp;
    
    // Update campaign totals
    campaignData.totalRaised += msg.value;
    
    emit FundReceived(msg.sender, msg.value);
}
```

#### 2. **Milestone Completion**
```solidity
function completeMilestone(uint256 milestoneId) external onlyFounder {
    require(milestoneId < 3, "Invalid milestone");
    require(milestones[milestoneId].state == MilestoneState.Pending, "Already completed");
    require(block.timestamp <= milestones[milestoneId].deadline, "Deadline passed");
    
    // Mark milestone as completed
    milestones[milestoneId].state = MilestoneState.Completed;
    milestones[milestoneId].completed = true;
    
    // Calculate release amount
    uint256 releaseAmount = (campaignData.totalRaised * milestones[milestoneId].releasePercentage) / 100;
    
    // Update current milestone
    campaignData.currentMilestone = milestoneId + 1;
    
    // Release funds to founder
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

#### 3. **Refund System**
```solidity
function claimRefund() external nonReentrant {
    require(campaignData.state == CampaignState.Failed, "Campaign not failed");
    require(funders[msg.sender].totalContribution > 0, "Not a funder");
    require(!funders[msg.sender].hasRefunded, "Already refunded");
    
    // Calculate refund amount
    uint256 refundAmount = funders[msg.sender].totalContribution;
    
    // Mark as refunded
    funders[msg.sender].hasRefunded = true;
    
    // Transfer refund
    (bool success, ) = payable(msg.sender).call{value: refundAmount}("");
    require(success, "Refund failed");
    
    emit RefundClaimed(msg.sender, refundAmount);
}
```

#### `contracts/CampaignFactory.sol` - Campaign Creation

```solidity
contract CampaignFactory is Ownable {
    address[] public campaigns;
    mapping(address => address[]) public founderCampaigns;
    uint256 public campaignCount;
    uint256 public creationFee = 0.01 ether;
    
    function createCampaign(
        string memory title,
        string memory description,
        uint256 fundingGoal,
        string[3] memory milestoneDescriptions,
        uint256[3] memory milestoneDeadlines,
        uint256[3] memory milestonePercentages
    ) external payable returns (address) {
        
        // Validate creation fee
        require(msg.value >= creationFee, "Insufficient creation fee");
        
        // Validate inputs
        require(bytes(title).length >= 3 && bytes(title).length <= 100, "Invalid title");
        require(bytes(description).length > 0 && bytes(description).length <= 1000, "Invalid description");
        require(fundingGoal >= 0.01 ether && fundingGoal <= 10000 ether, "Invalid funding goal");
        
        // Validate milestone percentages sum to 100%
        uint256 totalPercentage = 0;
        for (uint256 i = 0; i < 3; i++) {
            totalPercentage += milestonePercentages[i];
        }
        require(totalPercentage == 100, "Percentages must sum to 100");
        
        // Deploy new campaign
        Campaign newCampaign = new Campaign(
            title,
            description,
            msg.sender,
            fundingGoal,
            milestoneDescriptions,
            milestoneDeadlines,
            milestonePercentages
        );
        
        // Track campaign
        campaigns.push(address(newCampaign));
        founderCampaigns[msg.sender].push(address(newCampaign));
        campaignCount++;
        
        emit CampaignCreated(address(newCampaign), msg.sender, title, fundingGoal);
        
        return address(newCampaign);
    }
}
```

## 🎨 Frontend Integration Code

### React Components with Web3 Integration

#### 1. **Campaign Card Component**
```typescript
// components/CampaignCard.tsx
import { useContractRead } from 'wagmi';
import { formatEther } from 'ethers';

interface CampaignCardProps {
  address: string;
}

export function CampaignCard({ address }: CampaignCardProps) {
  // Fetch campaign data with automatic updates
  const { data: campaignData, isLoading } = useContractRead({
    address: address,
    abi: CAMPAIGN_ABI,
    functionName: 'getCampaignData',
    watch: true, // Auto-refresh on blockchain changes
  });

  // Fetch milestone data
  const { data: milestones } = useContractRead({
    address: address,
    abi: CAMPAIGN_ABI,
    functionName: 'getMilestones',
    watch: true,
  });

  if (isLoading) {
    return <div className="animate-pulse bg-gray-200 h-48 rounded-lg" />;
  }

  // Calculate progress
  const progress = (Number(campaignData.totalRaised) / 
                   Number(campaignData.fundingGoal)) * 100;

  return (
    <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow">
      <h3 className="text-xl font-bold">{campaignData.title}</h3>
      <p className="text-gray-600 mt-2">{campaignData.description}</p>
      
      {/* Progress Bar */}
      <div className="mt-4">
        <div className="flex justify-between text-sm mb-1">
          <span>Progress</span>
          <span>{progress.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-sm">
          <span className="font-semibold text-blue-600">
            {formatEther(campaignData.totalRaised)} ETH
          </span>
          <span className="text-gray-500">
            of {formatEther(campaignData.fundingGoal)} ETH
          </span>
        </div>
      </div>

      {/* Milestone Progress */}
      <div className="mt-4">
        <h4 className="font-semibold mb-2">Milestones</h4>
        {milestones?.map((milestone, index) => (
          <div key={index} className="flex items-center mb-2">
            <div className={`w-3 h-3 rounded-full mr-2 ${
              milestone.completed ? 'bg-green-500' : 'bg-gray-300'
            }`} />
            <span className="text-sm">{milestone.description}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### 2. **Funding Form Component**
```typescript
// components/FundingForm.tsx
import { useContractWrite, usePrepareContractWrite } from 'wagmi';
import { parseEther } from 'ethers';
import { useState } from 'react';

interface FundingFormProps {
  campaignAddress: string;
}

export function FundingForm({ campaignAddress }: FundingFormProps) {
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Prepare funding transaction
  const { config } = usePrepareContractWrite({
    address: campaignAddress,
    abi: CAMPAIGN_ABI,
    functionName: 'fund',
    value: amount ? parseEther(amount) : undefined,
    enabled: !!amount && parseFloat(amount) >= 0.001,
  });

  // Execute funding transaction
  const { write: fund, data, isLoading: isPending } = useContractWrite({
    ...config,
    onSuccess: () => {
      setIsLoading(false);
      alert('Campaign funded successfully!');
    },
    onError: (error) => {
      setIsLoading(false);
      alert(`Funding failed: ${error.message}`);
    },
  });

  const handleFund = async () => {
    if (!amount || parseFloat(amount) < 0.001) {
      alert('Minimum contribution is 0.001 ETH');
      return;
    }
    
    setIsLoading(true);
    fund?.();
  };

  return (
    <div className="border rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">Fund This Campaign</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Amount (ETH)
          </label>
          <input
            type="number"
            step="0.001"
            min="0.001"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0.001"
          />
          <p className="text-xs text-gray-500 mt-1">
            Minimum: 0.001 ETH
          </p>
        </div>

        <button
          onClick={handleFund}
          disabled={!amount || parseFloat(amount) < 0.001 || isPending}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isPending ? 'Processing...' : 'Fund Campaign'}
        </button>
      </div>
    </div>
  );
}
```

#### 3. **Custom Web3 Hooks**
```typescript
// hooks/useCampaign.ts
import { useContractRead } from 'wagmi';
import { useContractWrite, usePrepareContractWrite } from 'wagmi';
import { parseEther } from 'ethers';

export function useCampaign(campaignAddress: string) {
  // Read campaign data
  const { data: campaignData, isLoading, refetch } = useContractRead({
    address: campaignAddress,
    abi: CAMPAIGN_ABI,
    functionName: 'getCampaignData',
    watch: true,
  });

  // Read milestones
  const { data: milestones } = useContractRead({
    address: campaignAddress,
    abi: CAMPAIGN_ABI,
    functionName: 'getMilestones',
    watch: true,
  });

  // Read funder data
  const { data: funderData } = useContractRead({
    address: campaignAddress,
    abi: CAMPAIGN_ABI,
    functionName: 'getFunder',
    args: [userAddress],
    watch: true,
  });

  return {
    campaignData,
    milestones,
    funderData,
    isLoading,
    refetch,
  };
}

// hooks/useFunding.ts
export function useFunding(campaignAddress: string, amount: string) {
  const { config } = usePrepareContractWrite({
    address: campaignAddress,
    abi: CAMPAIGN_ABI,
    functionName: 'fund',
    value: amount ? parseEther(amount) : undefined,
    enabled: !!amount && parseFloat(amount) >= 0.001,
  });

  const { write: fund, data, isLoading, isSuccess, error } = useContractWrite(config);

  return {
    fund,
    transaction: data,
    isLoading,
    isSuccess,
    error,
  };
}
```

#### 4. **Event Listening**
```typescript
// hooks/useCampaignEvents.ts
import { useEffect } from 'react';
import { useContractEvent } from 'wagmi';

export function useCampaignEvents(campaignAddress: string) {
  // Listen for funding events
  useContractEvent({
    address: campaignAddress,
    abi: CAMPAIGN_ABI,
    eventName: 'FundReceived',
    onLogs: (logs) => {
      logs.forEach((log) => {
        console.log('New funding:', {
          funder: log.args.funder,
          amount: formatEther(log.args.amount),
        });
        // Show notification
        toast.success(`${formatEther(log.args.amount)} ETH received!`);
      });
    },
  });

  // Listen for milestone completion
  useContractEvent({
    address: campaignAddress,
    abi: CAMPAIGN_ABI,
    eventName: 'MilestoneCompleted',
    onLogs: (logs) => {
      logs.forEach((log) => {
        console.log('Milestone completed:', {
          milestoneId: log.args.milestoneId,
          releaseAmount: formatEther(log.args.releaseAmount),
        });
        // Show celebration
        confetti();
        toast.success(`Milestone ${Number(log.args.milestoneId) + 1} completed!`);
      });
    },
  });
}
```

#### 5. **Main App Integration**
```typescript
// app/page.tsx
import { useAccount, useConnect } from 'wagmi';
import { CampaignCard } from '@/components/CampaignCard';
import { FundingForm } from '@/components/FundingForm';

export default function Home() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();

  // Fetch all campaigns from factory
  const { data: campaigns } = useContractRead({
    address: CAMPAIGN_FACTORY_ADDRESS,
    abi: CAMPAIGN_FACTORY_ABI,
    functionName: 'getCampaigns',
    watch: true,
  });

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Web3 Crowdfunding</h1>
          <p className="text-gray-600 mb-6">Connect your wallet to start</p>
          <button
            onClick={() => connect({ connector: connectors[0] })}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Web3 Crowdfunding</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {address?.slice(0, 6)}...{address?.slice(-4)}
              </span>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg">
                Create Campaign
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Active Campaigns</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns?.map((campaignAddress) => (
            <CampaignCard key={campaignAddress} address={campaignAddress} />
          ))}
        </div>
      </main>
    </div>
  );
}
```

## 🛠️ Technology Stack

### Blockchain
- **Solidity** 0.8.26
- **Hardhat** for development
- **OpenZeppelin** for security
- **Base L2** for deployment

### Frontend
- **Next.js** 14 with App Router
- **TypeScript** for type safety
- **TailwindCSS** for styling
- **Wagmi** + **RainbowKit** for Web3 integration

### Testing
- **Mocha** + **Chai** for testing
- **Hardhat** for local development
- **Ethers.js** v6 for blockchain interaction

## 🎯 Simplification Benefits

### ✅ **Removed Complex Features**
- ❌ Risk profiles (Conservative/Balanced/Aggressive)
- ❌ Complex voting mechanisms
- ❌ Advanced governance
- ❌ Whale protection systems
- ❌ Auto-voting penalties
- ❌ Platform governance

### ✅ **Kept Core Features**
- ✅ Milestone-based funding
- ✅ Progressive fund release
- ✅ Basic refund system
- ✅ Campaign creation
- ✅ Simple funding

### 📊 **Contract Size Reduction**
| Contract | Before | After | Reduction |
|----------|--------|-------|-----------|
| Campaign | 590 lines | 200 lines | 66% smaller |
| Factory | 315 lines | 150 lines | 52% smaller |
| Governance | 412 lines | 0 lines | 100% removed |
| **Total** | **1317 lines** | **350 lines** | **73% smaller** |

## 🔗 Useful Links

- **Base Sepolia Faucet**: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet
- **BaseScan Testnet**: https://sepolia.basescan.org/
- **Base Documentation**: https://docs.base.org
- **OpenZeppelin**: https://docs.openzeppelin.com

## 🎯 Project Status

### ✅ Completed
- Smart contract development (3 contracts)
- Comprehensive testing (113 tests)
- Frontend development (Next.js)
- Security implementations
- Documentation

### 🔄 In Progress
- Testnet deployment
- Frontend integration
- User testing

### 📋 Next Steps
- Security audit
- Mainnet deployment
- Community feedback

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

- **Issues**: Open a GitHub issue
- **Documentation**: Check this README
- **Security**: Report privately to security contact

---

**Built with ❤️ for the Web3 community**

*Simple, effective milestone crowdfunding that focuses on core functionality*

**Version**: 1.0  
**Last Updated**: January 2025  
**Status**: ✅ Production-Ready (pending security audit)