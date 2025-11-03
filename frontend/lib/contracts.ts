// Contract addresses and ABIs for the crowdfunding platform

// SimpleFactory ABI (complete for all functionality)
export const SIMPLE_FACTORY_ABI = [
  {
    "inputs": [],
    "name": "projectCount",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getAllProjects",
    "outputs": [{ "internalType": "address[]", "name": "", "type": "address[]" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "projectId", "type": "uint256" }],
    "name": "getProject",
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
    "name": "createProject",
    "outputs": [{ "internalType": "address", "name": "projectAddress", "type": "address" }],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "address", "name": "founder", "type": "address" }],
    "name": "getFounderProjects",
    "outputs": [{ "internalType": "uint256[]", "name": "", "type": "uint256[]" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getPlatformStats",
    "outputs": [
      { "internalType": "uint256", "name": "totalProjects", "type": "uint256" },
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

// SimpleProject ABI (complete for all functionality)
export const SIMPLE_PROJECT_ABI = [
  {
    "inputs": [],
    "name": "getProjectData",
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
        "internalType": "struct SimpleProject.ProjectData",
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
          { "internalType": "uint8", "name": "state", "type": "uint8" },
          { "internalType": "uint256", "name": "submittedAt", "type": "uint256" },
          { "internalType": "uint256", "name": "votingDeadline", "type": "uint256" },
          { "internalType": "uint256", "name": "yesVotes", "type": "uint256" },
          { "internalType": "uint256", "name": "noVotes", "type": "uint256" }
        ],
        "internalType": "struct SimpleProject.Milestone",
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
    "inputs": [
      { "internalType": "uint256", "name": "milestoneId", "type": "uint256" },
      { "internalType": "bool", "name": "voteYes", "type": "bool" }
    ],
    "name": "vote",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "milestoneId", "type": "uint256" }],
    "name": "finalizeVoting",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "milestoneId", "type": "uint256" },
      { "internalType": "address", "name": "contributor", "type": "address" }
    ],
    "name": "getHasVoted",
    "outputs": [{ "internalType": "bool", "name": "", "type": "bool" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{ "internalType": "uint256", "name": "milestoneId", "type": "uint256" }],
    "name": "getVotingStats",
    "outputs": [
      { "internalType": "uint256", "name": "yesVotes", "type": "uint256" },
      { "internalType": "uint256", "name": "noVotes", "type": "uint256" },
      { "internalType": "uint256", "name": "totalVotes", "type": "uint256" },
      { "internalType": "uint256", "name": "yesPercentage", "type": "uint256" },
      { "internalType": "uint256", "name": "votingDeadline", "type": "uint256" },
      { "internalType": "bool", "name": "isActive", "type": "bool" }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "VOTING_PERIOD",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "APPROVAL_THRESHOLD",
    "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "failProject",
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

// Project state enum (matches smart contract)
export enum ProjectState {
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

// Backward compatibility exports
export const SIMPLE_CAMPAIGN_ABI = SIMPLE_PROJECT_ABI;
export const CampaignState = ProjectState;
export const isCampaignActive = isProjectActive;

// Contract addresses (update these after deployment)
export const CONTRACT_ADDRESSES = {
  // Localhost/Hardhat
  localhost: {
    factoryAddress: "0x5FbDB2315678afecb367f032d93F642f64180aa3", // Updated with latest deployed address
  },
  // Lisk Sepolia Testnet
  liskSepolia: {
    factoryAddress: "0x0000000000000000000000000000000000000000", // Update after deployment
  },
  // Lisk Mainnet
  lisk: {
    factoryAddress: "0x0000000000000000000000000000000000000000", // Update after deployment
  }
} as const;

// Helper function to check if project is active (Funding or Development)
export function isProjectActive(state: ProjectState): boolean {
  return state === ProjectState.Funding || state === ProjectState.Development;
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
    case 4202: // Lisk Sepolia
      return CONTRACT_ADDRESSES.liskSepolia.factoryAddress;
    case 1135: // Lisk Mainnet
      return CONTRACT_ADDRESSES.lisk.factoryAddress;
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
      name: "Indonesian Rupiah X",
      symbol: "IDRX",
      decimals: 18
    }
  },
  liskSepolia: {
    id: 4202,
    name: "Lisk Sepolia",
    rpcUrl: "https://rpc.sepolia-api.lisk.com",
    nativeCurrency: {
      name: "Indonesian Rupiah X",
      symbol: "IDRX",
      decimals: 18
    },
    blockExplorer: "https://sepolia-blockscout.lisk.com"
  },
  lisk: {
    id: 1135,
    name: "Lisk",
    rpcUrl: "https://rpc.api.lisk.com",
    nativeCurrency: {
      name: "Indonesian Rupiah X",
      symbol: "IDRX",
      decimals: 18
    },
    blockExplorer: "https://blockscout.lisk.com"
  }
} as const;





