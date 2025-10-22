'use client'

import { useCampaign } from '@/hooks/useCampaigns'
import { formatEther } from 'viem'
import { formatDistanceToNow } from 'date-fns'
import { CampaignState } from '@/lib/contracts'
import Link from 'next/link'

interface CampaignCardProps {
  address: string
}

export function CampaignCard({ address }: CampaignCardProps) {
  const { campaignData, currentMilestone, contributors } = useCampaign(address)
  
  const isLoading = !campaignData

  if (isLoading || !campaignData) {
    return <div className="animate-pulse bg-gray-200 h-64 rounded-lg" />
  }
  
  // Helper function to format ETH
  const formatEther = (wei: bigint) => {
    return (Number(wei) / 1e18).toFixed(2)
  }

  const progressPercentage = (Number(campaignData.totalRaised) / Number(campaignData.fundingGoal)) * 100
  const milestoneProgress = (campaignData.currentMilestone / 3) * 100

  const getStateColor = (state: number) => {
    switch (state) {
      case CampaignState.Funding:
        return 'bg-yellow-100 text-yellow-800'
      case CampaignState.Development:
        return 'bg-green-100 text-green-800'
      case CampaignState.Completed:
        return 'bg-blue-100 text-blue-800'
      case CampaignState.Failed:
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStateText = (state: number) => {
    switch (state) {
      case CampaignState.Funding:
        return 'Funding'
      case CampaignState.Development:
        return 'Development'
      case CampaignState.Completed:
        return 'Completed'
      case CampaignState.Failed:
        return 'Failed'
      default:
        return 'Unknown'
    }
  }

  return (
    <Link href={`/campaign/${address}`}>
      <div className="bg-card rounded-lg border border-border p-6 hover:shadow-lg transition-shadow cursor-pointer">
        {/* Campaign image placeholder */}
        <div className="w-full h-48 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
          <div className="text-6xl opacity-20">🚀</div>
        </div>
        
        {/* Title and description */}
        <h3 className="text-xl font-semibold text-card-foreground mb-2 line-clamp-2">
          {campaignData.title}
        </h3>
        <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
          {campaignData.description}
        </p>
        
        {/* Funding progress */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-card-foreground">Funding Progress</span>
            <span className="text-sm text-muted-foreground">
              {progressPercentage.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300" 
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            ></div>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-sm text-muted-foreground">
              {formatEther(campaignData.totalRaised)} ETH raised
            </span>
            <span className="text-sm font-medium text-card-foreground">
              {formatEther(campaignData.fundingGoal)} ETH goal
            </span>
          </div>
        </div>
        
        {/* Milestone progress */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-card-foreground">Milestone Progress</span>
            <span className="text-sm text-muted-foreground">
              {campaignData.currentMilestone}/3
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-accent h-2 rounded-full transition-all duration-300" 
              style={{ width: `${milestoneProgress}%` }}
            ></div>
          </div>
        </div>
        
        {/* Founder info and status */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center mr-3">
              <span className="text-primary-foreground text-xs font-bold">
                {campaignData.founder.slice(2, 4).toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-card-foreground">Founder</p>
              <p className="text-xs text-muted-foreground">
                {campaignData.founder.slice(0, 6)}...{campaignData.founder.slice(-4)}
              </p>
            </div>
          </div>
          
          {/* Status badge */}
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStateColor(campaignData.state)}`}>
            {getStateText(campaignData.state)}
          </span>
        </div>
        
        {/* Created date */}
        <div className="mt-3 text-xs text-muted-foreground">
          Created {formatDistanceToNow(new Date(Number(campaignData.createdAt) * 1000), { addSuffix: true })}
        </div>
      </div>
    </Link>
  )
}
