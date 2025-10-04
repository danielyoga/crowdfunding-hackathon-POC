'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface Campaign {
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

interface CampaignCardProps {
  campaign: Campaign;
}

export function CampaignCard({ campaign }: CampaignCardProps) {
  const progressPercentage = (parseFloat(campaign.totalRaised) / parseFloat(campaign.fundingGoal)) * 100;
  const milestoneProgress = (campaign.currentMilestone / campaign.totalMilestones) * 100;
  
  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'DeFi': 'bg-blue-100 text-blue-800',
      'Sustainability': 'bg-green-100 text-green-800',
      'AI/ML': 'bg-purple-100 text-purple-800',
      'Social': 'bg-pink-100 text-pink-800',
      'Gaming': 'bg-yellow-100 text-yellow-800',
      'Healthcare': 'bg-red-100 text-red-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const getMilestoneStatus = () => {
    if (campaign.currentMilestone === 0) return 'Starting';
    if (campaign.currentMilestone === campaign.totalMilestones) return 'Completed';
    return `Milestone ${campaign.currentMilestone}/${campaign.totalMilestones}`;
  };

  return (
    <Link href={`/campaign/${campaign.address}`}>
      <div className="card-hover group cursor-pointer">
        {/* Campaign image placeholder */}
        <div className="w-full h-48 bg-gradient-to-br from-primary-100 to-purple-100 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
          <div className="text-6xl opacity-20">🚀</div>
        </div>
        
        {/* Category badge */}
        <div className="flex items-center justify-between mb-3">
          <span className={`badge ${getCategoryColor(campaign.category)}`}>
            {campaign.category}
          </span>
          <span className="text-sm text-gray-500">
            {formatDistanceToNow(new Date(campaign.createdAt), { addSuffix: true })}
          </span>
        </div>
        
        {/* Title and description */}
        <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors line-clamp-2">
          {campaign.title}
        </h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {campaign.description}
        </p>
        
        {/* Funding progress */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Funding Progress</span>
            <span className="text-sm text-gray-600">
              {progressPercentage.toFixed(1)}%
            </span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            ></div>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-sm text-gray-600">
              {campaign.totalRaised} ETH raised
            </span>
            <span className="text-sm font-medium text-gray-900">
              {campaign.fundingGoal} ETH goal
            </span>
          </div>
        </div>
        
        {/* Milestone progress */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Milestone Progress</span>
            <span className="text-sm text-gray-600">
              {getMilestoneStatus()}
            </span>
          </div>
          <div className="progress-bar">
            <div 
              className="bg-success-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${milestoneProgress}%` }}
            ></div>
          </div>
        </div>
        
        {/* Founder info */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-purple-500 rounded-full flex items-center justify-center mr-3">
              <span className="text-white text-xs font-bold">
                {campaign.founder.slice(2, 4).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Founder</p>
              <p className="text-xs text-gray-600">
                {campaign.founder.slice(0, 6)}...{campaign.founder.slice(-4)}
              </p>
            </div>
          </div>
          
          {/* Status badge */}
          <span className={`badge ${
            campaign.state === 'Active' ? 'badge-success' : 
            campaign.state === 'Completed' ? 'badge-primary' : 
            'badge-danger'
          }`}>
            {campaign.state}
          </span>
        </div>
        
        {/* Hover effect indicator */}
        <div className="mt-4 flex items-center text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-sm font-medium">View Details</span>
          <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
}


