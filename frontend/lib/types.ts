// TypeScript types for the crowdfunding platform

import { ProjectState, MilestoneState, RiskProfile } from "./contracts";

export interface ProjectData {
  title: string;
  description: string;
  founder: string;
  fundingGoal: bigint;
  totalRaised: bigint;
  totalCommitted: bigint;
  totalReserve: bigint;
  state: ProjectState;
  currentMilestone: number;
  createdAt: bigint;
}

export interface Milestone {
  description: string;
  releasePercentage: number; // 0-100 or basis points (0-10000)
  deadline?: bigint; // Unix timestamp (optional for SimpleCampaign)
  state: MilestoneState;
  ipfsHash?: string; // Optional
  submittedAt: bigint;
  votingDeadline: bigint;
  yesVotes: bigint;
  noVotes: bigint;
  rejectionCount?: number; // Optional
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

export interface ProjectWithAddress {
  address: string;
  data: ProjectData;
  milestones: Milestone[];
  contributors: Contribution[];
  userContribution?: Contribution;
}

export interface ProjectCardData {
  address: string;
  title: string;
  description: string;
  founder: string;
  fundingGoal: string; // Formatted ETH string
  totalRaised: string; // Formatted ETH string
  progress: number; // Percentage 0-100
  state: ProjectState;
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

export interface CreateProjectFormData {
  title: string;
  description: string;
  fundingGoal: string;
  milestones: MilestoneFormData[];
}

// Backward compatibility type aliases
export type CampaignData = ProjectData;
export type CampaignWithAddress = ProjectWithAddress;
export type CampaignCardData = ProjectCardData;
export type CreateCampaignFormData = CreateProjectFormData;
export { ProjectState as CampaignState };

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





