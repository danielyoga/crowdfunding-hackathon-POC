'use client';

import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useBalance } from 'wagmi';

export default function TestPage() {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({
    address: address,
  });

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-8">
          🚀 Web3 Milestone Crowdfunding Platform
        </h1>
        
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Connection Test</h2>
          
          <div className="mb-6">
            <ConnectButton />
          </div>
          
          {isConnected && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-semibold text-green-800">✅ Wallet Connected!</h3>
                <p className="text-green-700">Address: {address}</p>
                {balance && (
                  <p className="text-green-700">
                    Balance: {parseFloat(balance.formatted).toFixed(4)} {balance.symbol}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-semibold mb-4">Platform Status</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-800">Smart Contracts</h3>
              <p className="text-blue-700">✅ Deployed on Local Network</p>
              <p className="text-sm text-blue-600">Chain ID: 31337</p>
            </div>
            
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h3 className="font-semibold text-purple-800">Contract Addresses</h3>
              <div className="text-sm text-purple-700 space-y-1">
                <p>Factory: 0xe7f1...0512</p>
                <p>Governance: 0x5FbD...0aa3</p>
                <p>Sample Campaign: 0xCafa...052c</p>
              </div>
            </div>
            
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-800">Features Available</h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>✅ Campaign Creation</li>
                <li>✅ Risk Profile Selection</li>
                <li>✅ Milestone Voting</li>
                <li>✅ Fund Management</li>
              </ul>
            </div>
            
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-semibold text-yellow-800">Test Instructions</h3>
              <ol className="text-sm text-yellow-700 space-y-1">
                <li>1. Connect MetaMask</li>
                <li>2. Add Local Network</li>
                <li>3. Import Test Account</li>
                <li>4. Start Testing!</li>
              </ol>
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <a 
            href="/"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Main Platform
          </a>
        </div>
      </div>
    </div>
  );
}
