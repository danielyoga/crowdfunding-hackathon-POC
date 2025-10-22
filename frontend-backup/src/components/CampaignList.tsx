'use client';

import { useState, useEffect } from 'react';
import { useContractRead } from 'wagmi';
import { CampaignCard } from './CampaignCard';
import { CampaignCardSkeleton } from './CampaignCardSkeleton';

// Contract addresses - these would be set from environment variables
const CAMPAIGN_FACTORY_ADDRESS = process.env.NEXT_PUBLIC_CAMPAIGN_FACTORY_ADDRESS as `0x${string}`;

// Mock ABI - in production, import from generated types
const CAMPAIGN_FACTORY_ABI = [
  {
    name: 'getAllActiveCampaigns',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'address[]' }]
  }
] as const;

// Mock campaign data for development
const mockCampaigns = [
  {
    address: '0x1234567890123456789012345678901234567890',
    title: 'DeFi Innovation Platform',
    description: 'A revolutionary DeFi platform that enables seamless cross-chain yield farming with automated portfolio optimization.',
    founder: '0xFounder1234567890123456789012345678901234',
    fundingGoal: '10.0',
    totalRaised: '7.5',
    currentMilestone: 2,
    totalMilestones: 5,
    state: 'Active',
    createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
    category: 'DeFi',
    image: '/api/placeholder/400/200'
  },
  {
    address: '0x2345678901234567890123456789012345678901',
    title: 'Green Energy NFT Marketplace',
    description: 'Connecting renewable energy producers with consumers through blockchain-verified carbon credits and NFTs.',
    founder: '0xFounder2345678901234567890123456789012345',
    fundingGoal: '25.0',
    totalRaised: '18.2',
    currentMilestone: 3,
    totalMilestones: 5,
    state: 'Active',
    createdAt: Date.now() - 45 * 24 * 60 * 60 * 1000, // 45 days ago
    category: 'Sustainability',
    image: '/api/placeholder/400/200'
  },
  {
    address: '0x3456789012345678901234567890123456789012',
    title: 'AI-Powered Trading Bot',
    description: 'Advanced machine learning algorithms for automated cryptocurrency trading with risk management.',
    founder: '0xFounder3456789012345678901234567890123456',
    fundingGoal: '15.0',
    totalRaised: '4.8',
    currentMilestone: 1,
    totalMilestones: 5,
    state: 'Active',
    createdAt: Date.now() - 15 * 24 * 60 * 60 * 1000, // 15 days ago
    category: 'AI/ML',
    image: '/api/placeholder/400/200'
  },
  {
    address: '0x4567890123456789012345678901234567890123',
    title: 'Decentralized Social Network',
    description: 'A censorship-resistant social platform where users own their data and earn from their content.',
    founder: '0xFounder4567890123456789012345678901234567',
    fundingGoal: '50.0',
    totalRaised: '32.1',
    currentMilestone: 4,
    totalMilestones: 5,
    state: 'Active',
    createdAt: Date.now() - 60 * 24 * 60 * 60 * 1000, // 60 days ago
    category: 'Social',
    image: '/api/placeholder/400/200'
  },
  {
    address: '0x5678901234567890123456789012345678901234',
    title: 'Web3 Gaming Ecosystem',
    description: 'Play-to-earn gaming platform with interoperable NFTs and cross-game asset trading.',
    founder: '0xFounder5678901234567890123456789012345678',
    fundingGoal: '100.0',
    totalRaised: '85.7',
    currentMilestone: 4,
    totalMilestones: 5,
    state: 'Active',
    createdAt: Date.now() - 90 * 24 * 60 * 60 * 1000, // 90 days ago
    category: 'Gaming',
    image: '/api/placeholder/400/200'
  },
  {
    address: '0x6789012345678901234567890123456789012345',
    title: 'Healthcare Data Privacy',
    description: 'Secure, decentralized storage and sharing of medical records with patient-controlled access.',
    founder: '0xFounder6789012345678901234567890123456789',
    fundingGoal: '30.0',
    totalRaised: '12.4',
    currentMilestone: 2,
    totalMilestones: 5,
    state: 'Active',
    createdAt: Date.now() - 20 * 24 * 60 * 60 * 1000, // 20 days ago
    category: 'Healthcare',
    image: '/api/placeholder/400/200'
  }
];

export function CampaignList() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Read active campaigns from contract
  const { data: activeCampaigns, isLoading } = useContractRead({
    address: CAMPAIGN_FACTORY_ADDRESS,
    abi: CAMPAIGN_FACTORY_ABI,
    functionName: 'getAllActiveCampaigns',
    enabled: !!CAMPAIGN_FACTORY_ADDRESS,
  });

  useEffect(() => {
    // For development, use mock data
    // In production, this would fetch campaign details for each address
    setTimeout(() => {
      setCampaigns(mockCampaigns);
      setLoading(false);
    }, 1000);
  }, [activeCampaigns]);

  const categories = ['all', 'DeFi', 'Sustainability', 'AI/ML', 'Social', 'Gaming', 'Healthcare'];

  const filteredCampaigns = campaigns.filter(campaign => {
    if (filter === 'all') return true;
    return campaign.category === filter;
  });

  const sortedCampaigns = [...filteredCampaigns].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return b.createdAt - a.createdAt;
      case 'oldest':
        return a.createdAt - b.createdAt;
      case 'funding':
        return parseFloat(b.totalRaised) - parseFloat(a.totalRaised);
      case 'progress':
        const progressA = a.currentMilestone / a.totalMilestones;
        const progressB = b.currentMilestone / b.totalMilestones;
        return progressB - progressA;
      default:
        return 0;
    }
  });

  if (loading || isLoading) {
    return (
      <div>
        {/* Filters skeleton */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-8 w-20 bg-gray-200 rounded-full shimmer"></div>
            ))}
          </div>
          <div className="h-8 w-32 bg-gray-200 rounded-lg shimmer"></div>
        </div>
        
        {/* Campaign cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <CampaignCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Filters and sorting */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        {/* Category filters */}
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setFilter(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filter === category
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category === 'all' ? 'All Categories' : category}
            </button>
          ))}
        </div>
        
        {/* Sort dropdown */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="form-input w-auto min-w-[150px]"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="funding">Most Funded</option>
          <option value="progress">Most Progress</option>
        </select>
      </div>

      {/* Results count */}
      <div className="mb-6">
        <p className="text-gray-600">
          Showing {sortedCampaigns.length} of {campaigns.length} campaigns
          {filter !== 'all' && ` in ${filter}`}
        </p>
      </div>

      {/* Campaign grid */}
      {sortedCampaigns.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedCampaigns.map(campaign => (
            <CampaignCard key={campaign.address} campaign={campaign} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns found</h3>
          <p className="text-gray-600">
            {filter === 'all' 
              ? 'No active campaigns at the moment. Be the first to create one!'
              : `No campaigns found in the ${filter} category. Try a different filter.`
            }
          </p>
        </div>
      )}
    </div>
  );
}
