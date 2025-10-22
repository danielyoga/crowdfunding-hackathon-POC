// TypeScript types for the crowdfunding platform

import { CampaignState, MilestoneState, RiskProfile } from "./contracts";

export interface CampaignData {
  title: string;
  description: string;
  founder: string;
  fundingGoal: bigint;
  totalRaised: bigint;
  totalCommitted: bigint;
  totalReserve: bigint;
  state: CampaignState;
  currentMilestone: number;
  createdAt: bigint;
}

export interface Milestone {
  description: string;
  releasePercentage: number; // 0-100
  deadline: bigint; // Unix timestamp
  state: MilestoneState;
  ipfsHash: string;
  submittedAt: bigint;
  votingDeadline: bigint;
  yesVotes: bigint;
  noVotes: bigint;
  rejectionCount: number;
}

export interface Contribution {
  contributor: string;
  totalAmount: bigint;
  committedAmount: bigint;
  reserveAmount: bigint;
  riskProfile: RiskProfile;
  hasVoted: boolean;
  votedYes: boolean;
  consecutiveMissedVotes: number;
  autoYesMode: boolean;
}

export interface CampaignWithAddress {
  address: string;
  data: CampaignData;
  milestones: Milestone[];
  contributors: Contribution[];
  userContribution?: Contribution;
}

export interface CampaignCardData {
  address: string;
  title: string;
  description: string;
  founder: string;
  fundingGoal: string; // Formatted ETH string
  totalRaised: string; // Formatted ETH string
  progress: number; // Percentage 0-100
  state: CampaignState;
  stateLabel: string;
  currentMilestone: number;
  totalMilestones: number;
  contributorsCount: number;
  createdAt: Date;
  isVoting?: boolean;
  votingDeadline?: Date;
}

export interface MilestoneFormData {
  description: string;
  releasePercentage: number;
  deadline: number; // Days from now
}

export interface CreateCampaignFormData {
  title: string;
  description: string;
  fundingGoal: string;
  milestones: MilestoneFormData[];
}

export interface VotingStats {
  yesVotes: string; // ETH
  noVotes: string; // ETH
  yesPercentage: number;
  noPercentage: number;
  totalVotes: string; // ETH
  votersCount: number;
  totalContributors: number;
  participationRate: number;
  timeRemaining: number; // seconds
  hasEnded: boolean;
}





