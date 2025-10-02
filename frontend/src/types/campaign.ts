export enum CampaignState {
  Active = 0,
  Completed = 1,
  Failed = 2,
  Cancelled = 3
}

export enum MilestoneState {
  Pending = 0,
  Submitted = 1,
  Voting = 2,
  Approved = 3,
  Rejected = 4,
  Completed = 5
}

export enum RiskProfile {
  Conservative = 0, // 50/50
  Balanced = 1,     // 70/30
  Aggressive = 2    // 90/10
}

export interface CampaignData {
  title: string;
  description: string;
  founder: string;
  fundingGoal: bigint;
  totalRaised: bigint;
  totalCommittedPool: bigint;
  totalReservePool: bigint;
  currentMilestone: number;
  state: CampaignState;
  createdAt: bigint;
  platformFeePercentage: bigint;
}

export interface Milestone {
  description: string;
  releasePercentage: bigint;
  deadline: bigint;
  state: MilestoneState;
  votingDeadline: bigint;
  yesVotes: bigint;
  noVotes: bigint;
  totalVotingPower: bigint;
  evidenceIPFS: string;
  rejectionCount: number;
  submittedAt: bigint;
}

export interface Funder {
  totalContribution: bigint;
  committedAmount: bigint;
  reserveAmount: bigint;
  riskProfile: RiskProfile;
  hasVoted: boolean[];
  missedVotes: number;
  isAutoYes: boolean;
  hasRefunded: boolean;
  fundedAt: bigint;
}

export interface CampaignCardData {
  address: string;
  title: string;
  description: string;
  founder: string;
  fundingGoal: string;
  totalRaised: string;
  currentMilestone: number;
  totalMilestones: number;
  state: string;
  createdAt: number;
  category: string;
  image?: string;
}

export interface MilestoneEvidence {
  description: string;
  files: Array<{
    hash: string;
    name: string;
    size: number;
    type: string;
    url: string;
  }>;
  metadata: any;
  timestamp: string;
  version: string;
}

export interface VotingData {
  milestoneId: number;
  yesVotes: bigint;
  noVotes: bigint;
  totalVotingPower: bigint;
  hasVoted: boolean;
  userVote?: boolean;
  votingDeadline: bigint;
  isActive: boolean;
}

export interface RefundData {
  isEligible: boolean;
  amount: bigint;
  originalContribution: bigint;
  refundPercentage: number;
}

// Risk profile configurations
export const RISK_PROFILES = {
  [RiskProfile.Conservative]: {
    name: 'Conservative',
    committedPercentage: 50,
    reservePercentage: 50,
    description: 'Maximum downside protection. Best for risk-averse funders.',
    color: 'blue'
  },
  [RiskProfile.Balanced]: {
    name: 'Balanced',
    committedPercentage: 70,
    reservePercentage: 30,
    description: 'Good balance of support and protection. Recommended for most funders.',
    color: 'green'
  },
  [RiskProfile.Aggressive]: {
    name: 'Aggressive',
    committedPercentage: 90,
    reservePercentage: 10,
    description: 'Maximum support to founders. For high-conviction believers.',
    color: 'purple'
  }
};

// Campaign categories
export const CAMPAIGN_CATEGORIES = [
  'DeFi',
  'Sustainability',
  'AI/ML',
  'Social',
  'Gaming',
  'Healthcare',
  'Education',
  'Infrastructure',
  'Art & Culture',
  'Other'
] as const;

export type CampaignCategory = typeof CAMPAIGN_CATEGORIES[number];

// Milestone templates
export const DEFAULT_MILESTONES = [
  {
    description: 'Prototype Development - Build MVP and core features',
    deadline: 90,
    percentage: 10
  },
  {
    description: 'Early Traction - Acquire first 200 users and gather feedback',
    deadline: 120,
    percentage: 20
  },
  {
    description: 'Strategic Partnership - Secure 1-2 key partnerships with MoUs',
    deadline: 90,
    percentage: 25
  },
  {
    description: 'Revenue Proof - Generate first revenue or demonstrate measurable impact',
    deadline: 120,
    percentage: 25
  },
  {
    description: 'Public Launch - Scale to 1000+ users with public dashboard',
    deadline: 60,
    percentage: 20
  }
];

// Helper functions
export const formatCampaignState = (state: CampaignState): string => {
  switch (state) {
    case CampaignState.Active:
      return 'Active';
    case CampaignState.Completed:
      return 'Completed';
    case CampaignState.Failed:
      return 'Failed';
    case CampaignState.Cancelled:
      return 'Cancelled';
    default:
      return 'Unknown';
  }
};

export const formatMilestoneState = (state: MilestoneState): string => {
  switch (state) {
    case MilestoneState.Pending:
      return 'Pending';
    case MilestoneState.Submitted:
      return 'Submitted';
    case MilestoneState.Voting:
      return 'Voting';
    case MilestoneState.Approved:
      return 'Approved';
    case MilestoneState.Rejected:
      return 'Rejected';
    case MilestoneState.Completed:
      return 'Completed';
    default:
      return 'Unknown';
  }
};

export const formatRiskProfile = (profile: RiskProfile): string => {
  return RISK_PROFILES[profile]?.name || 'Unknown';
};

export const getRiskProfileConfig = (profile: RiskProfile) => {
  return RISK_PROFILES[profile];
};

export const calculateFundingSplit = (amount: bigint, profile: RiskProfile) => {
  const config = RISK_PROFILES[profile];
  const committed = (amount * BigInt(config.committedPercentage)) / 100n;
  const reserve = amount - committed;
  return { committed, reserve };
};

export const calculateRefundAmount = (
  funder: Funder,
  completedMilestones: number,
  milestones: Milestone[],
  platformFeePercentage: bigint
): bigint => {
  // Calculate unreleased committed capital
  let unreleasedCommitted = funder.committedAmount;
  
  for (let i = 0; i < completedMilestones; i++) {
    const released = (funder.committedAmount * milestones[i].releasePercentage) / 10000n;
    unreleasedCommitted -= released;
  }
  
  // Total refund = unreleased committed + full reserve - platform fee
  const totalRefund = unreleasedCommitted + funder.reserveAmount;
  const platformFee = (totalRefund * platformFeePercentage) / 10000n;
  
  return totalRefund - platformFee;
};
