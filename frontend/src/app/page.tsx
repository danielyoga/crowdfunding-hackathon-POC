'use client';

import { useState } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount } from 'wagmi';
import { Hero } from '@/components/Hero';
import { CampaignList } from '@/components/CampaignList';
import { CreateCampaignModal } from '@/components/CreateCampaignModal';
import { PlatformStats } from '@/components/PlatformStats';
import { Navigation } from '@/components/Navigation';
import { Footer } from '@/components/Footer';

export default function Home() {
  const { isConnected } = useAccount();
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navigation />
      
      <main>
        {/* Hero Section */}
        <Hero onCreateCampaign={() => setShowCreateModal(true)} />
        
        {/* Platform Stats */}
        <section className="py-12 bg-white/50 backdrop-blur-sm">
          <div className="container-custom">
            <PlatformStats />
          </div>
        </section>
        
        {/* Campaign List */}
        <section className="py-16">
          <div className="container-custom">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Active Campaigns
                </h2>
                <p className="text-gray-600">
                  Discover innovative projects seeking milestone-based funding
                </p>
              </div>
              
              {isConnected && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn-primary flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Campaign
                </button>
              )}
            </div>
            
            <CampaignList />
          </div>
        </section>
        
        {/* How It Works Section */}
        <section className="py-16 bg-gray-50">
          <div className="container-custom">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                How It Works
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Our milestone-based approach ensures accountability and protects both founders and funders
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary-600">1</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Create Campaign</h3>
                <p className="text-gray-600">
                  Founders create campaigns with 5 clear milestones and evidence requirements
                </p>
              </div>
              
              {/* Step 2 */}
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary-600">2</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Choose Risk Profile</h3>
                <p className="text-gray-600">
                  Funders select their risk tolerance: Conservative (50/50), Balanced (70/30), or Aggressive (90/10)
                </p>
              </div>
              
              {/* Step 3 */}
              <div className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-primary-600">3</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Vote on Milestones</h3>
                <p className="text-gray-600">
                  Funders vote on milestone completion. Funds release progressively or refunds are available
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Risk Profiles Section */}
        <section className="py-16">
          <div className="container-custom">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Choose Your Risk Profile
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Every funder can choose their own risk tolerance when contributing
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {/* Conservative */}
              <div className="card-hover">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">Conservative</h3>
                  <span className="badge-primary">50/50 Split</span>
                </div>
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Committed</span>
                    <span>50%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: '50%' }}></div>
                  </div>
                </div>
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Protected</span>
                    <span>50%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="bg-success-600 h-2 rounded-full" style={{ width: '50%' }}></div>
                  </div>
                </div>
                <p className="text-gray-600 text-sm">
                  Maximum downside protection. Best for risk-averse funders and first-time users.
                </p>
              </div>
              
              {/* Balanced */}
              <div className="card-hover border-primary-200 bg-primary-50">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">Balanced</h3>
                  <span className="badge-primary">70/30 Split</span>
                </div>
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Committed</span>
                    <span>70%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: '70%' }}></div>
                  </div>
                </div>
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Protected</span>
                    <span>30%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="bg-success-600 h-2 rounded-full" style={{ width: '30%' }}></div>
                  </div>
                </div>
                <p className="text-gray-600 text-sm">
                  Good balance of support and protection. Recommended for most funders.
                </p>
              </div>
              
              {/* Aggressive */}
              <div className="card-hover">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">Aggressive</h3>
                  <span className="badge-primary">90/10 Split</span>
                </div>
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Committed</span>
                    <span>90%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: '90%' }}></div>
                  </div>
                </div>
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Protected</span>
                    <span>10%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="bg-success-600 h-2 rounded-full" style={{ width: '10%' }}></div>
                  </div>
                </div>
                <p className="text-gray-600 text-sm">
                  Maximum support to founders. For high-conviction believers in the project.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
      
      {/* Create Campaign Modal */}
      {showCreateModal && (
        <CreateCampaignModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
}


