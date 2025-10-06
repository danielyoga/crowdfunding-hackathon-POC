# Smart Contract Integration Guide

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Setup & Installation](#setup--installation)
3. [Contract Connection](#contract-connection)
4. [Common Operations](#common-operations)
5. [React Integration](#react-integration)
6. [Event Listening](#event-listening)
7. [Error Handling](#error-handling)
8. [Best Practices](#best-practices)
9. [Example Applications](#example-applications)

---

## 🚀 Quick Start

### 5-Minute Integration

```typescript
import { ethers } from 'ethers';

// 1. Connect to wallet
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

// 2. Connect to factory
const factory = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, signer);

// 3. Create campaign
const tx = await factory.createCampaign(
  "My Project",
  "Description",
  ethers.parseEther("10"),
  ["M1", "M2", "M3", "M4", "M5"],
  [30, 90, 150, 240, 330],
  [1000, 2000, 2500, 2500, 2000],
  { value: await factory.creationFee() }
);

await tx.wait();
console.log("Campaign created!");
```

---

## 📦 Setup & Installation

### 1. Install Dependencies

```bash
npm install ethers@6 wagmi viem @rainbow-me/rainbowkit
```

### 2. Get Contract ABIs

```bash
# After compiling contracts
npm run compile

# ABIs are in:
# artifacts/contracts/Campaign.sol/Campaign.json
# artifacts/contracts/CampaignFactory.sol/CampaignFactory.json
# artifacts/contracts/Governance.sol/Governance.json
```

### 3. Get Contract Addresses

```typescript
// deployments/localhost-31337.json (or your network)
{
  "CampaignFactory": "0x...",
  "Governance": "0x..."
}
```

### 4. Create Config File

```typescript
// src/lib/contracts.ts
import CampaignFactoryABI from '../artifacts/CampaignFactory.json';
import CampaignABI from '../artifacts/Campaign.json';
import GovernanceABI from '../artifacts/Governance.json';

export const CONTRACTS = {
  // Base Sepolia Testnet
  baseSepolia: {
    campaignFactory: {
      address: '0x...',
      abi: CampaignFactoryABI.abi,
    },
    governance: {
      address: '0x...',
      abi: GovernanceABI.abi,
    },
  },
  
  // Base Mainnet
  base: {
    campaignFactory: {
      address: '0x...',
      abi: CampaignFactoryABI.abi,
    },
    governance: {
      address: '0x...',
      abi: GovernanceABI.abi,
    },
  },
};

export const CAMPAIGN_ABI = CampaignABI.abi;
```

---

## 🔌 Contract Connection

### Using Ethers.js

```typescript
import { ethers } from 'ethers';
import { CONTRACTS, CAMPAIGN_ABI } from './lib/contracts';

// Connect to provider
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

// Get network
const network = await provider.getNetwork();
const chainId = network.chainId;

// Select correct addresses
const config = chainId === 84532n 
  ? CONTRACTS.baseSepolia 
  : CONTRACTS.base;

// Connect to CampaignFactory
const factory = new ethers.Contract(
  config.campaignFactory.address,
  config.campaignFactory.abi,
  signer
);

// Connect to specific Campaign
const campaign = new ethers.Contract(
  campaignAddress,
  CAMPAIGN_ABI,
  signer
);

// Connect to Governance
const governance = new ethers.Contract(
  config.governance.address,
  config.governance.abi,
  signer
);
```

### Using Wagmi (React)

```typescript
// src/lib/wagmi-config.ts
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { base, baseSepolia } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'Web3 Crowdfunding',
  projectId: 'YOUR_WALLET_CONNECT_PROJECT_ID',
  chains: [base, baseSepolia],
});
```

```typescript
// src/app/layout.tsx
'use client';

import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { config } from '@/lib/wagmi-config';

const queryClient = new QueryClient();

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <RainbowKitProvider>
              {children}
            </RainbowKitProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </body>
    </html>
  );
}
```

---

## 🎯 Common Operations

### 1. Create Campaign

```typescript
async function createCampaign(params: {
  title: string;
  description: string;
  fundingGoal: string; // in ETH
  milestones: {
    description: string;
    deadline: number; // days from start
    percentage: number; // 0-100
  }[];
}) {
  // Validate
  if (params.milestones.length !== 5) {
    throw new Error('Must have exactly 5 milestones');
  }
  
  const totalPercentage = params.milestones.reduce(
    (sum, m) => sum + m.percentage, 
    0
  );
  if (totalPercentage !== 100) {
    throw new Error('Milestones must sum to 100%');
  }
  
  // Prepare data
  const milestoneDescriptions = params.milestones.map(m => m.description);
  const milestoneDeadlines = params.milestones.map(m => BigInt(m.deadline));
  const milestonePercentages = params.milestones.map(
    m => BigInt(m.percentage * 100) // Convert to basis points
  );
  
  // Get creation fee
  const creationFee = await factory.creationFee();
  
  // Create campaign
  const tx = await factory.createCampaign(
    params.title,
    params.description,
    ethers.parseEther(params.fundingGoal),
    milestoneDescriptions,
    milestoneDeadlines,
    milestonePercentages,
    { value: creationFee }
  );
  
  const receipt = await tx.wait();
  
  // Get campaign address from event
  const event = receipt.logs.find(
    log => log.topics[0] === factory.interface.getEvent('CampaignCreated').topicHash
  );
  
  const campaignAddress = ethers.getAddress('0x' + event.topics[1].slice(26));
  
  return {
    campaignAddress,
    transactionHash: receipt.hash,
  };
}

// Usage
const result = await createCampaign({
  title: 'My Awesome Project',
  description: 'Building the future of Web3',
  fundingGoal: '10', // 10 ETH
  milestones: [
    { description: 'Prototype', deadline: 30, percentage: 10 },
    { description: 'MVP', deadline: 90, percentage: 20 },
    { description: 'Beta', deadline: 150, percentage: 25 },
    { description: 'Launch', deadline: 240, percentage: 25 },
    { description: 'Growth', deadline: 330, percentage: 20 },
  ],
});
```

### 2. Fund Campaign

```typescript
async function fundCampaign(
  campaignAddress: string,
  amount: string, // in ETH
  riskProfile: 'conservative' | 'balanced' | 'aggressive'
) {
  const campaign = new ethers.Contract(
    campaignAddress,
    CAMPAIGN_ABI,
    signer
  );
  
  // Map risk profile to enum
  const riskProfileMap = {
    conservative: 0,
    balanced: 1,
    aggressive: 2,
  };
  
  const riskProfileId = riskProfileMap[riskProfile];
  
  // Check if already funded (to prevent profile change)
  const funderData = await campaign.getFunder(await signer.getAddress());
  if (funderData.totalContribution > 0) {
    if (funderData.riskProfile !== riskProfileId) {
      throw new Error('Cannot change risk profile after first contribution');
    }
  }
  
  // Fund campaign
  const tx = await campaign.fund(riskProfileId, {
    value: ethers.parseEther(amount),
  });
  
  await tx.wait();
  
  return tx.hash;
}

// Usage
await fundCampaign(
  '0x123...',
  '1.5', // 1.5 ETH
  'balanced'
);
```

### 3. Submit Milestone

```typescript
async function submitMilestone(
  campaignAddress: string,
  milestoneId: number,
  evidenceIPFSHash: string
) {
  const campaign = new ethers.Contract(
    campaignAddress,
    CAMPAIGN_ABI,
    signer
  );
  
  // Check if caller is founder
  const campaignData = await campaign.getCampaignData();
  const signerAddress = await signer.getAddress();
  
  if (campaignData.founder.toLowerCase() !== signerAddress.toLowerCase()) {
    throw new Error('Only founder can submit milestones');
  }
  
  // Check milestone state
  const milestone = await campaign.getMilestone(milestoneId);
  if (milestone.state !== 0) { // 0 = Pending
    throw new Error('Milestone not in pending state');
  }
  
  // Submit milestone
  const tx = await campaign.submitMilestone(
    milestoneId,
    evidenceIPFSHash
  );
  
  await tx.wait();
  
  return tx.hash;
}

// Usage
await submitMilestone(
  '0x123...',
  0, // First milestone
  'QmX...' // IPFS hash
);
```

### 4. Vote on Milestone

```typescript
async function voteOnMilestone(
  campaignAddress: string,
  milestoneId: number,
  support: boolean
) {
  const campaign = new ethers.Contract(
    campaignAddress,
    CAMPAIGN_ABI,
    signer
  );
  
  // Check if user is a funder
  const signerAddress = await signer.getAddress();
  const funderData = await campaign.getFunder(signerAddress);
  
  if (funderData.totalContribution === 0n) {
    throw new Error('Only funders can vote');
  }
  
  // Check if already voted
  if (funderData.hasVoted[milestoneId]) {
    throw new Error('Already voted on this milestone');
  }
  
  // Check milestone state
  const milestone = await campaign.getMilestone(milestoneId);
  if (milestone.state !== 2) { // 2 = Voting
    throw new Error('Milestone not in voting state');
  }
  
  // Vote
  const tx = await campaign.vote(milestoneId, support);
  await tx.wait();
  
  return tx.hash;
}

// Usage
await voteOnMilestone(
  '0x123...',
  0, // First milestone
  true // Vote YES
);
```

### 5. Finalize Milestone

```typescript
async function finalizeMilestone(
  campaignAddress: string,
  milestoneId: number
) {
  const campaign = new ethers.Contract(
    campaignAddress,
    CAMPAIGN_ABI,
    signer
  );
  
  // Check milestone state
  const milestone = await campaign.getMilestone(milestoneId);
  if (milestone.state !== 2) { // 2 = Voting
    throw new Error('Milestone not in voting state');
  }
  
  // Check if voting period ended
  const now = Math.floor(Date.now() / 1000);
  if (now <= milestone.votingDeadline) {
    throw new Error('Voting period not ended yet');
  }
  
  // Finalize
  const tx = await campaign.finalizeMilestone(milestoneId);
  await tx.wait();
  
  return tx.hash;
}

// Usage
await finalizeMilestone('0x123...', 0);
```

### 6. Claim Refund

```typescript
async function claimRefund(campaignAddress: string) {
  const campaign = new ethers.Contract(
    campaignAddress,
    CAMPAIGN_ABI,
    signer
  );
  
  // Check campaign state
  const campaignData = await campaign.getCampaignData();
  if (campaignData.state !== 2) { // 2 = Failed
    throw new Error('Campaign not in failed state');
  }
  
  // Check refund amount
  const signerAddress = await signer.getAddress();
  const refundAmount = await campaign.getRefundAmount(signerAddress);
  
  if (refundAmount === 0n) {
    throw new Error('No refund available');
  }
  
  // Check if already refunded
  const funderData = await campaign.getFunder(signerAddress);
  if (funderData.hasRefunded) {
    throw new Error('Already claimed refund');
  }
  
  // Claim refund
  const tx = await campaign.claimRefund();
  await tx.wait();
  
  return {
    transactionHash: tx.hash,
    refundAmount: ethers.formatEther(refundAmount),
  };
}

// Usage
const result = await claimRefund('0x123...');
console.log(`Refunded ${result.refundAmount} ETH`);
```

### 7. Get Campaign Data

```typescript
async function getCampaignDetails(campaignAddress: string) {
  const campaign = new ethers.Contract(
    campaignAddress,
    CAMPAIGN_ABI,
    provider // Read-only, no signer needed
  );
  
  // Get campaign data
  const campaignData = await campaign.getCampaignData();
  
  // Get all milestones
  const milestones = await Promise.all(
    [0, 1, 2, 3, 4].map(id => campaign.getMilestone(id))
  );
  
  // Get funders list
  const fundersList = await campaign.getFundersList();
  
  // Get funder details
  const fundersDetails = await Promise.all(
    fundersList.map(address => campaign.getFunder(address))
  );
  
  return {
    title: campaignData.title,
    description: campaignData.description,
    founder: campaignData.founder,
    fundingGoal: ethers.formatEther(campaignData.fundingGoal),
    totalRaised: ethers.formatEther(campaignData.totalRaised),
    totalCommittedPool: ethers.formatEther(campaignData.totalCommittedPool),
    totalReservePool: ethers.formatEther(campaignData.totalReservePool),
    currentMilestone: Number(campaignData.currentMilestone),
    state: ['Active', 'Completed', 'Failed'][campaignData.state],
    createdAt: new Date(Number(campaignData.createdAt) * 1000),
    milestones: milestones.map((m, i) => ({
      id: i,
      description: m.description,
      releasePercentage: Number(m.releasePercentage) / 100,
      deadline: new Date(Number(m.deadline) * 1000),
      state: ['Pending', 'Submitted', 'Voting', 'Approved', 'Rejected', 'Completed'][m.state],
      votingDeadline: m.votingDeadline > 0 
        ? new Date(Number(m.votingDeadline) * 1000) 
        : null,
      yesVotes: ethers.formatEther(m.yesVotes),
      noVotes: ethers.formatEther(m.noVotes),
      evidenceIPFS: m.evidenceIPFS,
      rejectionCount: Number(m.rejectionCount),
    })),
    funders: fundersDetails.map((f, i) => ({
      address: fundersList[i],
      totalContribution: ethers.formatEther(f.totalContribution),
      committedAmount: ethers.formatEther(f.committedAmount),
      reserveAmount: ethers.formatEther(f.reserveAmount),
      riskProfile: ['Conservative', 'Balanced', 'Aggressive'][f.riskProfile],
      hasVoted: f.hasVoted,
      missedVotes: Number(f.missedVotes),
      isAutoYes: f.isAutoYes,
      hasRefunded: f.hasRefunded,
    })),
  };
}

// Usage
const details = await getCampaignDetails('0x123...');
console.log(details);
```

---

## ⚛️ React Integration

### Custom Hooks

#### useCampaignFactory

```typescript
// hooks/useCampaignFactory.ts
import { useContract, useSigner } from 'wagmi';
import { CONTRACTS } from '@/lib/contracts';

export function useCampaignFactory() {
  const { data: signer } = useSigner();
  
  const factory = useContract({
    address: CONTRACTS.baseSepolia.campaignFactory.address,
    abi: CONTRACTS.baseSepolia.campaignFactory.abi,
    signerOrProvider: signer,
  });
  
  return factory;
}
```

#### useCampaign

```typescript
// hooks/useCampaign.ts
import { useContract, useSigner } from 'wagmi';
import { CAMPAIGN_ABI } from '@/lib/contracts';

export function useCampaign(campaignAddress?: string) {
  const { data: signer } = useSigner();
  
  const campaign = useContract({
    address: campaignAddress,
    abi: CAMPAIGN_ABI,
    signerOrProvider: signer,
  });
  
  return campaign;
}
```

#### useCampaignData

```typescript
// hooks/useCampaignData.ts
import { useContractRead } from 'wagmi';
import { CAMPAIGN_ABI } from '@/lib/contracts';

export function useCampaignData(campaignAddress?: string) {
  const { data, isLoading, error, refetch } = useContractRead({
    address: campaignAddress,
    abi: CAMPAIGN_ABI,
    functionName: 'getCampaignData',
    watch: true, // Auto-refresh on changes
  });
  
  return {
    campaignData: data,
    isLoading,
    error,
    refetch,
  };
}
```

#### useFundCampaign

```typescript
// hooks/useFundCampaign.ts
import { useContractWrite, usePrepareContractWrite } from 'wagmi';
import { CAMPAIGN_ABI } from '@/lib/contracts';
import { parseEther } from 'ethers';

export function useFundCampaign(
  campaignAddress?: string,
  riskProfile?: number,
  amount?: string
) {
  const { config } = usePrepareContractWrite({
    address: campaignAddress,
    abi: CAMPAIGN_ABI,
    functionName: 'fund',
    args: [riskProfile],
    value: amount ? parseEther(amount) : undefined,
    enabled: !!campaignAddress && riskProfile !== undefined && !!amount,
  });
  
  const { write, data, isLoading, isSuccess, error } = useContractWrite(config);
  
  return {
    fund: write,
    transaction: data,
    isLoading,
    isSuccess,
    error,
  };
}
```

### Component Examples

#### CampaignCard Component

```typescript
// components/CampaignCard.tsx
'use client';

import { useCampaignData } from '@/hooks/useCampaignData';
import { formatEther } from 'ethers';

export function CampaignCard({ address }: { address: string }) {
  const { campaignData, isLoading } = useCampaignData(address);
  
  if (isLoading) return <div>Loading...</div>;
  if (!campaignData) return <div>Campaign not found</div>;
  
  const progress = (Number(campaignData.totalRaised) / 
                   Number(campaignData.fundingGoal)) * 100;
  
  return (
    <div className="border rounded-lg p-6">
      <h3 className="text-xl font-bold">{campaignData.title}</h3>
      <p className="text-gray-600 mt-2">{campaignData.description}</p>
      
      <div className="mt-4">
        <div className="flex justify-between text-sm mb-1">
          <span>Progress</span>
          <span>{progress.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-1 text-sm">
          <span>{formatEther(campaignData.totalRaised)} ETH</span>
          <span>{formatEther(campaignData.fundingGoal)} ETH</span>
        </div>
      </div>
      
      <div className="mt-4 flex gap-2">
        <span className={`px-2 py-1 rounded text-sm ${
          campaignData.state === 0 ? 'bg-green-100 text-green-800' :
          campaignData.state === 1 ? 'bg-blue-100 text-blue-800' :
          'bg-red-100 text-red-800'
        }`}>
          {['Active', 'Completed', 'Failed'][campaignData.state]}
        </span>
        <span className="px-2 py-1 rounded text-sm bg-gray-100">
          Milestone {Number(campaignData.currentMilestone) + 1}/5
        </span>
      </div>
    </div>
  );
}
```

#### FundCampaignForm Component

```typescript
// components/FundCampaignForm.tsx
'use client';

import { useState } from 'react';
import { useFundCampaign } from '@/hooks/useFundCampaign';

export function FundCampaignForm({ campaignAddress }: { campaignAddress: string }) {
  const [amount, setAmount] = useState('');
  const [riskProfile, setRiskProfile] = useState<number>(1); // Balanced
  
  const { fund, isLoading, isSuccess, error } = useFundCampaign(
    campaignAddress,
    riskProfile,
    amount
  );
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fund?.();
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">
          Amount (ETH)
        </label>
        <input
          type="number"
          step="0.001"
          min="0.001"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full border rounded px-3 py-2"
          required
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">
          Risk Profile
        </label>
        <select
          value={riskProfile}
          onChange={(e) => setRiskProfile(Number(e.target.value))}
          className="w-full border rounded px-3 py-2"
        >
          <option value={0}>Conservative (50/50)</option>
          <option value={1}>Balanced (70/30)</option>
          <option value={2}>Aggressive (90/10)</option>
        </select>
        <p className="text-sm text-gray-600 mt-1">
          {riskProfile === 0 && '50% committed, 50% reserve'}
          {riskProfile === 1 && '70% committed, 30% reserve'}
          {riskProfile === 2 && '90% committed, 10% reserve'}
        </p>
      </div>
      
      <button
        type="submit"
        disabled={!fund || isLoading}
        className="w-full bg-blue-600 text-white rounded py-2 disabled:opacity-50"
      >
        {isLoading ? 'Funding...' : 'Fund Campaign'}
      </button>
      
      {isSuccess && (
        <div className="text-green-600 text-sm">
          Successfully funded campaign!
        </div>
      )}
      
      {error && (
        <div className="text-red-600 text-sm">
          Error: {error.message}
        </div>
      )}
    </form>
  );
}
```

---

## 👂 Event Listening

### Listen to All Events

```typescript
// Setup event listeners
function setupEventListeners(campaignAddress: string) {
  const campaign = new ethers.Contract(
    campaignAddress,
    CAMPAIGN_ABI,
    provider
  );
  
  // Fund received
  campaign.on('FundReceived', (
    funder,
    amount,
    riskProfile,
    committedAmount,
    reserveAmount,
    event
  ) => {
    console.log('New funding:', {
      funder,
      amount: ethers.formatEther(amount),
      riskProfile: ['Conservative', 'Balanced', 'Aggressive'][riskProfile],
      committedAmount: ethers.formatEther(committedAmount),
      reserveAmount: ethers.formatEther(reserveAmount),
      blockNumber: event.log.blockNumber,
    });
  });
  
  // Milestone submitted
  campaign.on('MilestoneSubmitted', (
    milestoneId,
    evidenceIPFS,
    votingDeadline,
    event
  ) => {
    console.log('Milestone submitted:', {
      milestoneId: Number(milestoneId),
      evidenceIPFS,
      votingDeadline: new Date(Number(votingDeadline) * 1000),
    });
  });
  
  // Vote cast
  campaign.on('VoteCast', (
    milestoneId,
    voter,
    support,
    votingPower,
    event
  ) => {
    console.log('Vote cast:', {
      milestoneId: Number(milestoneId),
      voter,
      support: support ? 'YES' : 'NO',
      votingPower: ethers.formatEther(votingPower),
    });
  });
  
  // Milestone completed
  campaign.on('MilestoneCompleted', (
    milestoneId,
    releaseAmount,
    yesVotes,
    noVotes,
    event
  ) => {
    console.log('Milestone completed:', {
      milestoneId: Number(milestoneId),
      releaseAmount: ethers.formatEther(releaseAmount),
      yesVotes: ethers.formatEther(yesVotes),
      noVotes: ethers.formatEther(noVotes),
    });
  });
  
  // Milestone rejected
  campaign.on('MilestoneRejected', (
    milestoneId,
    yesVotes,
    noVotes,
    rejectionCount,
    event
  ) => {
    console.log('Milestone rejected:', {
      milestoneId: Number(milestoneId),
      yesVotes: ethers.formatEther(yesVotes),
      noVotes: ethers.formatEther(noVotes),
      rejectionCount: Number(rejectionCount),
    });
  });
  
  // Refund claimed
  campaign.on('RefundClaimed', (
    funder,
    refundAmount,
    originalContribution,
    event
  ) => {
    console.log('Refund claimed:', {
      funder,
      refundAmount: ethers.formatEther(refundAmount),
      originalContribution: ethers.formatEther(originalContribution),
    });
  });
  
  // Campaign state changed
  campaign.on('CampaignStateChanged', (
    oldState,
    newState,
    event
  ) => {
    console.log('Campaign state changed:', {
      from: ['Active', 'Completed', 'Failed'][oldState],
      to: ['Active', 'Completed', 'Failed'][newState],
    });
  });
  
  // Cleanup function
  return () => {
    campaign.removeAllListeners();
  };
}

// Usage
const cleanup = setupEventListeners('0x123...');

// Later, when component unmounts
cleanup();
```

### React Hook for Events

```typescript
// hooks/useCampaignEvents.ts
import { useEffect, useState } from 'react';
import { useContract, useProvider } from 'wagmi';
import { CAMPAIGN_ABI } from '@/lib/contracts';

export function useCampaignEvents(campaignAddress?: string) {
  const provider = useProvider();
  const [events, setEvents] = useState<any[]>([]);
  
  useEffect(() => {
    if (!campaignAddress) return;
    
    const campaign = new ethers.Contract(
      campaignAddress,
      CAMPAIGN_ABI,
      provider
    );
    
    const handleEvent = (eventName: string) => (...args: any[]) => {
      const event = args[args.length - 1];
      setEvents(prev => [...prev, {
        name: eventName,
        args: args.slice(0, -1),
        blockNumber: event.log.blockNumber,
        transactionHash: event.log.transactionHash,
        timestamp: Date.now(),
      }]);
    };
    
    campaign.on('FundReceived', handleEvent('FundReceived'));
    campaign.on('MilestoneSubmitted', handleEvent('MilestoneSubmitted'));
    campaign.on('VoteCast', handleEvent('VoteCast'));
    campaign.on('MilestoneCompleted', handleEvent('MilestoneCompleted'));
    campaign.on('MilestoneRejected', handleEvent('MilestoneRejected'));
    campaign.on('RefundClaimed', handleEvent('RefundClaimed'));
    
    return () => {
      campaign.removeAllListeners();
    };
  }, [campaignAddress, provider]);
  
  return events;
}
```

---

## ⚠️ Error Handling

### Custom Error Handling

```typescript
async function handleContractError(error: any) {
  // Parse custom errors
  if (error.data) {
    const iface = new ethers.Interface(CAMPAIGN_ABI);
    
    try {
      const decodedError = iface.parseError(error.data);
      
      const errorMessages: Record<string, string> = {
        'OnlyFounder': 'Only the campaign founder can perform this action',
        'NotFunder': 'You must be a funder to perform this action',
        'CampaignNotActive': 'Campaign is not active',
        'BelowMinimumContribution': 'Contribution below minimum (0.001 ETH)',
        'InvalidRiskProfile': 'Invalid risk profile selected',
        'FundingGoalReached': 'Funding goal already reached',
        'AlreadyVoted': 'You have already voted on this milestone',
        'VotingNotActive': 'Voting is not active for this milestone',
        'RefundNotAvailable': 'Refunds are not available yet',
        'AlreadyRefunded': 'You have already claimed your refund',
      };
      
      return errorMessages[decodedError.name] || decodedError.name;
    } catch (e) {
      // Not a custom error
    }
  }
  
  // Handle common errors
  if (error.code === 'ACTION_REJECTED') {
    return 'Transaction rejected by user';
  }
  
  if (error.code === 'INSUFFICIENT_FUNDS') {
    return 'Insufficient funds for transaction';
  }
  
  if (error.message.includes('user rejected')) {
    return 'Transaction rejected by user';
  }
  
  return error.message || 'An unknown error occurred';
}

// Usage
try {
  await fundCampaign('0x123...', '1', 'balanced');
} catch (error) {
  const message = await handleContractError(error);
  console.error(message);
  // Show to user
}
```

---

## 🎯 Best Practices

### 1. Always Validate Before Transactions

```typescript
async function safeVote(
  campaignAddress: string,
  milestoneId: number,
  support: boolean
) {
  const campaign = new ethers.Contract(
    campaignAddress,
    CAMPAIGN_ABI,
    signer
  );
  
  // 1. Check user is funder
  const signerAddress = await signer.getAddress();
  const funderData = await campaign.getFunder(signerAddress);
  
  if (funderData.totalContribution === 0n) {
    throw new Error('You must be a funder to vote');
  }
  
  // 2. Check not already voted
  if (funderData.hasVoted[milestoneId]) {
    throw new Error('You have already voted on this milestone');
  }
  
  // 3. Check milestone state
  const milestone = await campaign.getMilestone(milestoneId);
  if (milestone.state !== 2) {
    throw new Error('Milestone is not in voting state');
  }
  
  // 4. Check voting deadline
  const now = Math.floor(Date.now() / 1000);
  if (now > milestone.votingDeadline) {
    throw new Error('Voting period has ended');
  }
  
  // 5. Execute transaction
  const tx = await campaign.vote(milestoneId, support);
  return await tx.wait();
}
```

### 2. Use Read-Only Provider for Queries

```typescript
// Don't use signer for read operations
const provider = new ethers.JsonRpcProvider(RPC_URL);

const campaign = new ethers.Contract(
  campaignAddress,
  CAMPAIGN_ABI,
  provider // Read-only
);

const data = await campaign.getCampaignData();
```

### 3. Handle Transaction Confirmations

```typescript
async function fundWithConfirmation(
  campaignAddress: string,
  amount: string,
  riskProfile: number
) {
  const campaign = new ethers.Contract(
    campaignAddress,
    CAMPAIGN_ABI,
    signer
  );
  
  // Send transaction
  const tx = await campaign.fund(riskProfile, {
    value: ethers.parseEther(amount),
  });
  
  console.log('Transaction sent:', tx.hash);
  
  // Wait for 1 confirmation
  const receipt = await tx.wait(1);
  console.log('Transaction confirmed:', receipt.hash);
  
  // Optionally wait for more confirmations
  await tx.wait(3); // Wait for 3 confirmations
  console.log('Transaction finalized');
  
  return receipt;
}
```

### 4. Implement Retry Logic

```typescript
async function retryTransaction<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      if (i === maxRetries - 1) throw error;
      
      // Don't retry user rejections
      if (error.code === 'ACTION_REJECTED') throw error;
      
      console.log(`Retry ${i + 1}/${maxRetries}...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error('Max retries reached');
}

// Usage
const receipt = await retryTransaction(() => 
  campaign.fund(1, { value: ethers.parseEther('1') })
);
```

### 5. Cache Contract Instances

```typescript
const contractCache = new Map<string, ethers.Contract>();

function getCampaignContract(address: string, signerOrProvider: any) {
  const key = `${address}-${signerOrProvider.address || 'provider'}`;
  
  if (!contractCache.has(key)) {
    contractCache.set(
      key,
      new ethers.Contract(address, CAMPAIGN_ABI, signerOrProvider)
    );
  }
  
  return contractCache.get(key)!;
}
```

---

## 📱 Example Applications

### Complete Campaign Dashboard

See the full example in `/frontend/src/app/campaign/[address]/page.tsx`

### Complete Integration Example

See the full example in `/docs/examples/complete-integration.tsx`

---

## 📚 Additional Resources

- **[API_REFERENCE.md](./API_REFERENCE.md)** - Complete function reference
- **[SMART_CONTRACT_GUIDE.md](./SMART_CONTRACT_GUIDE.md)** - Contract architecture
- **[PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md)** - Project overview

---

**Happy Building! 🚀**

