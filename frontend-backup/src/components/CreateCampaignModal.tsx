'use client';

import { useState } from 'react';
import { useContractWrite, useWaitForTransaction } from 'wagmi';
import { parseEther } from 'viem';
import toast from 'react-hot-toast';

interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CAMPAIGN_FACTORY_ADDRESS = process.env.NEXT_PUBLIC_CAMPAIGN_FACTORY_ADDRESS as `0x${string}`;

// Mock ABI - in production, import from generated types
const CAMPAIGN_FACTORY_ABI = [
  {
    name: 'createCampaign',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'title', type: 'string' },
      { name: 'description', type: 'string' },
      { name: 'fundingGoal', type: 'uint256' },
      { name: 'milestoneDescriptions', type: 'string[5]' },
      { name: 'milestoneDeadlines', type: 'uint256[5]' },
      { name: 'milestonePercentages', type: 'uint256[5]' }
    ],
    outputs: [{ name: 'campaignAddress', type: 'address' }]
  }
] as const;

export function CreateCampaignModal({ isOpen, onClose }: CreateCampaignModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    fundingGoal: '',
    category: 'DeFi',
    milestones: [
      { description: 'Prototype Development - Build MVP and core features', deadline: '90', percentage: '10' },
      { description: 'Early Traction - Acquire first 200 users and gather feedback', deadline: '120', percentage: '20' },
      { description: 'Strategic Partnership - Secure 1-2 key partnerships with MoUs', deadline: '90', percentage: '25' },
      { description: 'Revenue Proof - Generate first revenue or demonstrate measurable impact', deadline: '120', percentage: '25' },
      { description: 'Public Launch - Scale to 1000+ users with public dashboard', deadline: '60', percentage: '20' }
    ]
  });

  const { write, data: hash, isLoading: isPending } = useContractWrite({
    address: CAMPAIGN_FACTORY_ADDRESS,
    abi: CAMPAIGN_FACTORY_ABI,
    functionName: 'createCampaign',
  });
  const { isLoading: isConfirming } = useWaitForTransaction({ hash });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMilestoneChange = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.map((milestone, i) => 
        i === index ? { ...milestone, [field]: value } : milestone
      )
    }));
  };

  const validateForm = () => {
    if (!formData.title.trim()) {
      toast.error('Please enter a campaign title');
      return false;
    }
    if (!formData.description.trim()) {
      toast.error('Please enter a campaign description');
      return false;
    }
    if (!formData.fundingGoal || parseFloat(formData.fundingGoal) <= 0) {
      toast.error('Please enter a valid funding goal');
      return false;
    }
    
    // Validate milestones
    const totalPercentage = formData.milestones.reduce((sum, milestone) => 
      sum + parseFloat(milestone.percentage || '0'), 0
    );
    
    if (Math.abs(totalPercentage - 100) > 0.01) {
      toast.error('Milestone percentages must sum to 100%');
      return false;
    }
    
    for (let i = 0; i < formData.milestones.length; i++) {
      const milestone = formData.milestones[i];
      if (!milestone.description.trim()) {
        toast.error(`Please enter description for milestone ${i + 1}`);
        return false;
      }
      if (!milestone.deadline || parseInt(milestone.deadline) <= 0) {
        toast.error(`Please enter valid deadline for milestone ${i + 1}`);
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      const milestoneDescriptions = formData.milestones.map(m => m.description) as [string, string, string, string, string];
      const milestoneDeadlines = formData.milestones.map(m => BigInt(m.deadline)) as [bigint, bigint, bigint, bigint, bigint];
      const milestonePercentages = formData.milestones.map(m => BigInt(parseFloat(m.percentage) * 100)) as [bigint, bigint, bigint, bigint, bigint]; // Convert to basis points
      
      write({
        args: [
          formData.title,
          formData.description,
          parseEther(formData.fundingGoal),
          milestoneDescriptions,
          milestoneDeadlines,
          milestonePercentages
        ],
        value: parseEther('0.01') // Creation fee
      });
      
      toast.success('Campaign creation transaction submitted!');
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast.error('Failed to create campaign. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Create New Campaign</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>
            
            <div>
              <label className="form-label">Campaign Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className="form-input"
                placeholder="Enter your campaign title"
                required
              />
            </div>
            
            <div>
              <label className="form-label">Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="form-input h-24 resize-none"
                placeholder="Describe your project and what you're building"
                required
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Funding Goal (ETH) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.fundingGoal}
                  onChange={(e) => handleInputChange('fundingGoal', e.target.value)}
                  className="form-input"
                  placeholder="10.0"
                  required
                />
              </div>
              
              <div>
                <label className="form-label">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="form-input"
                >
                  <option value="DeFi">DeFi</option>
                  <option value="Sustainability">Sustainability</option>
                  <option value="AI/ML">AI/ML</option>
                  <option value="Social">Social</option>
                  <option value="Gaming">Gaming</option>
                  <option value="Healthcare">Healthcare</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* Milestones */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Milestones (5 Required)</h3>
            <p className="text-sm text-gray-600">
              Define 5 clear milestones with deliverables, deadlines, and fund release percentages.
            </p>
            
            {formData.milestones.map((milestone, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Milestone {index + 1}</h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="form-label">Description *</label>
                    <textarea
                      value={milestone.description}
                      onChange={(e) => handleMilestoneChange(index, 'description', e.target.value)}
                      className="form-input h-20 resize-none"
                      placeholder="Describe what will be delivered for this milestone"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="form-label">Deadline (Days) *</label>
                      <input
                        type="number"
                        min="1"
                        value={milestone.deadline}
                        onChange={(e) => handleMilestoneChange(index, 'deadline', e.target.value)}
                        className="form-input"
                        placeholder="90"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="form-label">Fund Release (%) *</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={milestone.percentage}
                        onChange={(e) => handleMilestoneChange(index, 'percentage', e.target.value)}
                        className="form-input"
                        placeholder="20"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-900">Total Percentage:</span>
                <span className={`font-bold ${
                  Math.abs(formData.milestones.reduce((sum, m) => sum + parseFloat(m.percentage || '0'), 0) - 100) < 0.01
                    ? 'text-success-600' 
                    : 'text-danger-600'
                }`}>
                  {formData.milestones.reduce((sum, m) => sum + parseFloat(m.percentage || '0'), 0).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
          
          {/* Creation Fee Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <h4 className="font-medium text-blue-900 mb-1">Campaign Creation Fee</h4>
                <p className="text-sm text-blue-700">
                  A one-time fee of 0.01 ETH is required to create a campaign. This helps prevent spam and supports platform maintenance.
                </p>
              </div>
            </div>
          </div>
          
          {/* Submit Button */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending || isConfirming}
              className="btn-primary flex items-center gap-2"
            >
              {isPending || isConfirming ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isPending ? 'Creating...' : 'Confirming...'}
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Campaign
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
