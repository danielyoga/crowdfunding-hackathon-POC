'use client'

import { useState } from 'react'
import { useMockRole } from '@/contexts/MockRoleContext'
import { parseEther } from 'viem'
import { useCampaigns } from '@/hooks/useCampaigns'
import { toast } from 'sonner'

interface CreateCampaignModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateCampaignModal({ isOpen, onClose }: CreateCampaignModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    fundingGoal: '',
    milestone1: '',
    milestone2: '',
    milestone3: '',
    percentage1: 30,
    percentage2: 40,
    percentage3: 30,
  })

  const { role } = useMockRole()
  const { createCampaign, refetchCampaigns } = useCampaigns()
  
  // Mock transaction state
  const [isPending, setIsPending] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.percentage1 + formData.percentage2 + formData.percentage3 !== 100) {
      toast.error('Milestone percentages must sum to 100%')
      return
    }

    if (role !== 'founder') {
      toast.error('Please login as a founder to create campaigns')
      return
    }

    try {
      setIsPending(true)
      setError(null)
      
      await createCampaign(
        formData.title,
        formData.description,
        formData.fundingGoal,
        [formData.milestone1, formData.milestone2, formData.milestone3],
        [formData.percentage1, formData.percentage2, formData.percentage3]
      )
      
      setIsPending(false)
      setIsConfirming(true)
      
      // Simulate confirmation delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setIsConfirming(false)
      setIsSuccess(true)
      
      toast.success('Campaign created successfully!')
      await refetchCampaigns()
      onClose()
    } catch (err) {
      console.error('Error creating campaign:', err)
      setError(err as Error)
      setIsPending(false)
      setIsConfirming(false)
      toast.error('Failed to create campaign')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Create New Campaign</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Campaign Title
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your campaign title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe your project and goals"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Funding Goal (ETH)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={formData.fundingGoal}
                  onChange={(e) => setFormData({ ...formData, fundingGoal: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.01"
                />
              </div>
            </div>

            {/* Milestones */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Milestones</h3>
              
              {[1, 2, 3].map((num) => (
                <div key={num} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">Milestone {num}</h4>
                    <div className="flex items-center space-x-2">
                      <label className="text-sm text-gray-600">Percentage:</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={formData[`percentage${num}` as keyof typeof formData]}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          [`percentage${num}`]: parseInt(e.target.value) || 0 
                        })}
                        className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      <span className="text-sm text-gray-600">%</span>
                    </div>
                  </div>
                  <input
                    type="text"
                    required
                    value={formData[`milestone${num}` as keyof typeof formData]}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      [`milestone${num}`]: e.target.value 
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={`Describe milestone ${num}`}
                  />
                </div>
              ))}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending || isConfirming}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isPending || isConfirming ? 'Creating...' : 'Create Campaign'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}





