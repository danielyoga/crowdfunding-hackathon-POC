'use client'

import { useMockRole } from '@/contexts/MockRoleContext'
import { parseEther, formatEther } from 'viem'
import { SIMPLE_FACTORY_ABI, SIMPLE_CAMPAIGN_ABI, getFactoryAddress } from '@/lib/contracts'
import { CampaignData, Milestone } from '@/lib/types'
import { useState, useEffect } from 'react'
import { generateMockAddress } from '@/lib/web3-utils'

export function useCampaigns() {
  const { role, mockAccount, isInMockMode } = useMockRole()
  const address = mockAccount
  const chainId = 84532 // Base Sepolia for mock mode
  const [allCampaigns, setAllCampaigns] = useState<string[]>([])

  const factoryAddress = getFactoryAddress(chainId)

  // Load campaigns from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedCampaigns = localStorage.getItem('mockCampaigns')
      if (storedCampaigns) {
        try {
          const campaigns = JSON.parse(storedCampaigns)
          const addresses = campaigns.map((c: any) => c.address)
          setAllCampaigns(addresses)
        } catch (error) {
          console.error('Error loading campaigns:', error)
          setAllCampaigns([])
        }
      } else {
        setAllCampaigns([])
      }
    }
  }, [])

  const campaignCount = BigInt(3)
  const creationFee = parseEther("0.01") // 0.01 ETH creation fee
  const platformStats = [
    BigInt(3), // totalCampaigns
    parseEther("0.01"), // creationFee
    parseEther("15.5"), // totalRaised
    BigInt(25) // totalContributors
  ]

  // Create campaign function (mock version)
  const createCampaign = async (
    title: string,
    description: string,
    fundingGoal: string,
    milestoneDescriptions: string[],
    milestonePercentages: number[]
  ) => {
    if (!address) throw new Error('Wallet not connected')
    if (!role) throw new Error('Please login as a founder to create campaigns')

    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Generate a mock campaign address (valid 40-char hex)
    const mockCampaignAddress = generateMockAddress()
    
    console.log('Mock campaign created:', {
      title,
      description,
      fundingGoal,
      milestoneDescriptions,
      milestonePercentages,
      campaignAddress: mockCampaignAddress
    })

    return { hash: `0x${Math.random().toString(16).substr(2, 64)}` }
  }

  const refetchCampaigns = () => {
    console.log('Mock refetch campaigns')
  }

  return {
    allCampaigns,
    campaignCount,
    creationFee,
    platformStats,
    createCampaign,
    refetchCampaigns,
  }
}

export function useCampaign(campaignAddress: string) {
  const { role, mockAccount, isInMockMode } = useMockRole()
  const address = mockAccount
  const [campaignData, setCampaignData] = useState<any>(null)

  // Load campaign data from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && campaignAddress) {
      const storedCampaigns = localStorage.getItem('mockCampaigns')
      if (storedCampaigns) {
        try {
          const campaigns = JSON.parse(storedCampaigns)
          const campaign = campaigns.find((c: any) => c.address === campaignAddress)
          
          if (campaign) {
            // Convert to the format expected by the component
            setCampaignData({
              title: campaign.title,
              description: campaign.description,
              founder: campaign.founder,
              fundingGoal: parseEther(campaign.fundingGoal),
              totalRaised: parseEther(campaign.totalRaised),
              state: campaign.state, // Active
              riskProfile: 1, // Balanced
              createdAt: Math.floor(new Date(campaign.createdAt).getTime() / 1000),
              currentMilestone: campaign.currentMilestone,
              milestones: [
                { description: "Milestone 1", percentage: 20, state: 0 },
                { description: "Milestone 2", percentage: 30, state: 0 },
                { description: "Milestone 3", percentage: 25, state: 0 },
                { description: "Milestone 4", percentage: 15, state: 0 },
                { description: "Milestone 5", percentage: 10, state: 0 }
              ]
            })
          } else {
            // Fallback mock data if campaign not found
            setCampaignData({
              title: "Sample Campaign",
              description: "This is a sample campaign for testing purposes",
              founder: "0x89abcdef0123456789abcdef0123456789abcdef",
              fundingGoal: parseEther("10"),
              totalRaised: parseEther("5.5"),
              state: 0,
              riskProfile: 1,
              createdAt: Math.floor(Date.now() / 1000) - 86400,
              currentMilestone: 1,
              milestones: [
                { description: "Initial development", percentage: 20, state: 1 },
                { description: "Beta testing", percentage: 30, state: 0 },
                { description: "Final release", percentage: 50, state: 0 }
              ]
            })
          }
        } catch (error) {
          console.error('Error loading campaign:', error)
        }
      }
    }
  }, [campaignAddress])

  const currentMilestone = BigInt(1)
  const contributors = [
    "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    "0x1234567890123456789012345678901234567890"
  ]
  const userContribution = address ? parseEther("1.5") : BigInt(0)

  // Get milestone data (mock version)
  const getMilestone = (milestoneId: number) => {
    return {
      data: campaignData.milestones[milestoneId] || null
    }
  }

  // Fund campaign (mock version)
  const fundCampaign = async (amount: string) => {
    if (!address) throw new Error('Wallet not connected')
    
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    console.log('Mock funding campaign:', { amount, campaignAddress })
    return { hash: `0x${Math.random().toString(16).substr(2, 64)}` }
  }

  // Complete milestone (mock version)
  const completeMilestone = async (milestoneId: number) => {
    if (!address) throw new Error('Wallet not connected')
    
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    console.log('Mock completing milestone:', { milestoneId, campaignAddress })
    return { hash: `0x${Math.random().toString(16).substr(2, 64)}` }
  }

  // Fail campaign (mock version)
  const failCampaign = async () => {
    if (!address) throw new Error('Wallet not connected')
    
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    console.log('Mock failing campaign:', { campaignAddress })
    return { hash: `0x${Math.random().toString(16).substr(2, 64)}` }
  }

  // Claim refund (mock version)
  const claimRefund = async () => {
    if (!address) throw new Error('Wallet not connected')
    
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    console.log('Mock claiming refund:', { campaignAddress })
    return { hash: `0x${Math.random().toString(16).substr(2, 64)}` }
  }

  const refetchCampaignData = () => {
    console.log('Mock refetch campaign data')
  }

  return {
    campaignData,
    currentMilestone,
    contributors,
    userContribution,
    getMilestone,
    fundCampaign,
    completeMilestone,
    failCampaign,
    claimRefund,
    refetchCampaignData,
  }
}
