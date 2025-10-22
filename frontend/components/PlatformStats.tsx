'use client'

import { useCampaigns } from '@/hooks/useCampaigns'
import { formatEther } from 'viem'

export function PlatformStats() {
  const { platformStats, campaignCount } = useCampaigns()
  
  const totalCampaigns = Number(campaignCount) || 0
  const creationFee = platformStats ? formatEther(platformStats[1]) : '0'
  const successRate = 87.5 // Mock success rate for now

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="text-center">
        <div className="text-4xl font-bold text-blue-600 mb-2">
          {totalCampaigns}
        </div>
        <div className="text-gray-600">Total Campaigns</div>
      </div>
      
      <div className="text-center">
        <div className="text-4xl font-bold text-green-600 mb-2">
          {successRate}%
        </div>
        <div className="text-gray-600">Success Rate</div>
      </div>
      
      <div className="text-center">
        <div className="text-4xl font-bold text-purple-600 mb-2">
          {creationFee} ETH
        </div>
        <div className="text-gray-600">Creation Fee</div>
      </div>
    </div>
  )
}





