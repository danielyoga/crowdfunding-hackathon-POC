// Contract addresses and ABIs for the crowdfunding platform

// SimpleFactory ABI (complete for all functionality)
export const SIMPLE_FACTORY_ABI = [
  {
    "inputs": [],
    "name": "campaignCount",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllCampaigns",
    "outputs": [{ "internalType": "address[]", "name": "", "type": "address[]" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "campaignId", "type": "uint256" }],
    "name": "getCampaign",
    "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "creationFee",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "string", "name": "title", "type": "string" },
      { "internalType": "string", "name": "description", "type": "string" },
      { "internalType": "uint256", "name": "fundingGoal", "type": "uint256" },
      { "internalType": "string[3]", "name": "milestoneDescriptions", "type": "string[3]" },
      { "internalType": "uint256[3]", "name": "milestonePercentages", "type": "uint256[3]" }
    ],
    "name": "createCampaign",
    "outputs": [{ "internalType": "address", "name": "campaignAddress", "type": "address" }],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "founder", "type": "address" }],
    "name": "getFounderCampaigns",
    "outputs": [{ "internalType": "uint256[]", "name": "", "type": "uint256[]" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getPlatformStats",
    "outputs": [
      { "internalType": "uint256", "name": "totalCampaigns", "type": "uint256" },
      { "internalType": "uint256", "name": "currentCreationFee", "type": "uint256" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "newCreationFee", "type": "uint256" }],
    "name": "updateCreationFee",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "withdrawFees",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

// SimpleCampaign ABI (complete for all functionality)
export const SIMPLE_CAMPAIGN_ABI = [
  {
    "inputs": [],
    "name": "getCampaignData",
    "outputs": [
      {
        "components": [
          { "internalType": "string", "name": "title", "type": "string" },
          { "internalType": "string", "name": "description", "type": "string" },
          { "internalType": "address", "name": "founder", "type": "address" },
          { "internalType": "uint256", "name": "fundingGoal", "type": "uint256" },
          { "internalType": "uint256", "name": "totalRaised", "type": "uint256" },
          { "internalType": "uint8", "name": "state", "type": "uint8" },
          { "internalType": "uint256", "name": "createdAt", "type": "uint256" }
        ],
        "internalType": "struct SimpleCampaign.CampaignData",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "milestoneId", "type": "uint256" }],
    "name": "getMilestone",
    "outputs": [
      {
        "components": [
          { "internalType": "string", "name": "description", "type": "string" },
          { "internalType": "uint256", "name": "releasePercentage", "type": "uint256" },
          { "internalType": "uint8", "name": "state", "type": "uint8" }
        ],
        "internalType": "struct SimpleCampaign.Milestone",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "currentMilestone",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getContributors",
    "outputs": [{ "internalType": "address[]", "name": "", "type": "address[]" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "contributor", "type": "address" }],
    "name": "getContribution",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "fund",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "startDevelopment",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "milestoneId", "type": "uint256" }],
    "name": "submitMilestone",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "milestoneId", "type": "uint256" }],
    "name": "completeMilestone",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "failCampaign",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "claimRefund",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

// Contract addresses (update these after deployment)
export const CONTRACT_ADDRESSES = {
  // Localhost/Hardhat
  localhost: {
    factoryAddress: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9", // Updated with deployed address
  },
  // Base Sepolia Testnet
  baseSepolia: {
    factoryAddress: "0x0000000000000000000000000000000000000000", // Update after deployment
  },
  // Base Mainnet
  base: {
    factoryAddress: "0x0000000000000000000000000000000000000000", // Update after deployment
  }
} as const;

// Campaign state enum (matches smart contract)
export enum CampaignState {
  Funding = 0,
  Development = 1,
  Completed = 2,
  Failed = 3
}

// Milestone state enum (matches smart contract)
export enum MilestoneState {
  Pending = 0,
  Submitted = 1,
  Completed = 2
}

// Risk profile enum
export enum RiskProfile {
  Conservative = 0, // 50/50 split
  Balanced = 1,     // 70/30 split
  Aggressive = 2    // 90/10 split
}

// Helper function to check if campaign is active (Funding or Development)
export function isCampaignActive(state: CampaignState): boolean {
  return state === CampaignState.Funding || state === CampaignState.Development;
}

// Risk profile splits (committed/reserve)
export const RISK_PROFILE_SPLITS = {
  [RiskProfile.Conservative]: { committed: 50, reserve: 50 },
  [RiskProfile.Balanced]: { committed: 70, reserve: 30 },
  [RiskProfile.Aggressive]: { committed: 90, reserve: 10 },
} as const;

// Helper to get contract address based on chain ID
export function getFactoryAddress(chainId: number): string {
  switch (chainId) {
    case 31337: // Localhost
    case 1337:
      return CONTRACT_ADDRESSES.localhost.factoryAddress;
    case 84532: // Base Sepolia
      return CONTRACT_ADDRESSES.baseSepolia.factoryAddress;
    case 8453: // Base Mainnet
      return CONTRACT_ADDRESSES.base.factoryAddress;
    default:
      return CONTRACT_ADDRESSES.localhost.factoryAddress;
  }
}

// Chain configuration
export const SUPPORTED_CHAINS = {
  localhost: {
    id: 31337,
    name: "Localhost",
    rpcUrl: "http://127.0.0.1:8545",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18
    }
  },
  baseSepolia: {
    id: 84532,
    name: "Base Sepolia",
    rpcUrl: "https://sepolia.base.org",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18
    },
    blockExplorer: "https://sepolia.basescan.org"
  },
  base: {
    id: 8453,
    name: "Base",
    rpcUrl: "https://mainnet.base.org",
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18
    },
    blockExplorer: "https://basescan.org"
  }
} as const;





