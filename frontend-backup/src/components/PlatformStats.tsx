'use client';

import { useState, useEffect } from 'react';
import { useContractRead } from 'wagmi';
import { formatEther } from 'viem';

// This would be imported from your contract addresses
const CAMPAIGN_FACTORY_ADDRESS = process.env.NEXT_PUBLIC_CAMPAIGN_FACTORY_ADDRESS as `0x${string}`;

// Mock ABI for the stats function - in production, import from generated types
const CAMPAIGN_FACTORY_ABI = [
  {
    name: 'getPlatformStats',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [
      { name: 'totalCampaigns', type: 'uint256' },
      { name: 'activeCampaignsCount', type: 'uint256' },
      { name: 'currentPlatformFee', type: 'uint256' },
      { name: 'currentCreationFee', type: 'uint256' }
    ]
  }
] as const;

export function PlatformStats() {
  const [stats, setStats] = useState({
    totalFunded: '$2.5M+',
    totalCampaigns: '150+',
    successRate: '89%',
    activeFunders: '5,000+'
  });

  // Read platform stats from contract
  const { data: platformStats } = useContractRead({
    address: CAMPAIGN_FACTORY_ADDRESS,
    abi: CAMPAIGN_FACTORY_ABI,
    functionName: 'getPlatformStats',
    enabled: !!CAMPAIGN_FACTORY_ADDRESS,
  });

  useEffect(() => {
    if (platformStats) {
      setStats(prev => ({
        ...prev,
        totalCampaigns: platformStats[0].toString(),
        activeCampaigns: platformStats[1].toString(),
      }));
    }
  }, [platformStats]);

  const statItems = [
    {
      label: 'Total Funded',
      value: stats.totalFunded,
      icon: (
        <svg className="w-8 h-8 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      ),
      description: 'Successfully funded to innovative projects'
    },
    {
      label: 'Active Projects',
      value: stats.totalCampaigns,
      icon: (
        <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      description: 'Projects currently seeking funding'
    },
    {
      label: 'Success Rate',
      value: stats.successRate,
      icon: (
        <svg className="w-8 h-8 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      description: 'Of projects complete all milestones'
    },
    {
      label: 'Community',
      value: stats.activeFunders,
      icon: (
        <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      description: 'Active funders supporting innovation'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statItems.map((item, index) => (
        <div
          key={item.label}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-gray-50 rounded-lg">
              {item.icon}
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {item.value}
              </div>
              <div className="text-sm font-medium text-gray-600">
                {item.label}
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-500">
            {item.description}
          </p>
        </div>
      ))}
    </div>
  );
}
