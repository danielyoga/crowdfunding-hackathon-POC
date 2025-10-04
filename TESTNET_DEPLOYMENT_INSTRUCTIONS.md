# 🚀 Base Sepolia Testnet Deployment Instructions

## ✅ Prerequisites Completed
- [x] Smart contracts compiled and tested
- [x] Local deployment successful
- [x] Frontend configuration updated
- [x] Deployment scripts ready

## 🎯 Next Steps: Deploy to Base Sepolia Testnet

### 1. 💰 Get Testnet ETH
Visit the Base Sepolia faucet and get at least **0.1 ETH**:
```
https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet
```

### 2. 🔑 Set Up Environment Variables
Create your `.env` file:
```bash
cp env.example .env
```

Edit `.env` with your actual values:
```env
# Network Configuration
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org

# Your private key (with testnet ETH)
PRIVATE_KEY=your_private_key_here

# BaseScan API key (for contract verification)
BASESCAN_API_KEY=your_basescan_api_key_here
```

### 3. 🚀 Deploy to Base Sepolia
```bash
npm run deploy:sepolia
```

### 4. ✅ Expected Output
```
🚀 Starting deployment to Base Sepolia Testnet...

Deploying contracts with account: 0x1234...5678
Account balance: 0.5 ETH

📋 Deploying Governance contract...
✅ Governance deployed to: 0xAbC1...DeF2

🏭 Deploying CampaignFactory contract...
✅ CampaignFactory deployed to: 0x1234...5678

🔗 Setting up contract authorizations...
✅ CampaignFactory authorized in Governance

🧪 Creating sample campaign for testing...
✅ Sample campaign created successfully!

🎉 Deployment to Base Sepolia completed successfully!
```

### 5. 🔍 Verify Contracts (Optional)
```bash
npx hardhat verify --network baseSepolia <GOVERNANCE_ADDRESS> "<DEPLOYER_ADDRESS>"
npx hardhat verify --network baseSepolia <CAMPAIGN_FACTORY_ADDRESS> "<DEPLOYER_ADDRESS>"
```

### 6. 🌐 Update Frontend for Testnet
Update `frontend/env.local`:
```env
NEXT_PUBLIC_CAMPAIGN_FACTORY_ADDRESS=<deployed_address>
NEXT_PUBLIC_GOVERNANCE_ADDRESS=<deployed_address>
NEXT_PUBLIC_CHAIN_ID=84532
```

### 7. 🧪 Test Your Live Platform
1. Connect your wallet to Base Sepolia
2. Fund a campaign with testnet ETH
3. Submit milestone evidence
4. Vote on milestones
5. Test the complete funding cycle

## 📊 Current Status

### ✅ Completed
- Smart contract development
- Local testing and deployment
- Frontend integration
- Deployment scripts
- Documentation

### 🎯 Ready for Testnet
- All contracts compiled and tested
- Deployment script verified
- Frontend configured
- Sample campaign ready

## 🔗 Useful Links

- **Base Sepolia Faucet**: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet
- **BaseScan Testnet**: https://sepolia.basescan.org/
- **Base Sepolia RPC**: https://sepolia.base.org
- **Chain ID**: 84532

## 🛠️ Troubleshooting

### Low Balance Error
```
⚠️ WARNING: Low balance! You need at least 0.1 ETH for deployment.
```
**Solution**: Get more testnet ETH from the faucet

### Network Connection Error
**Solution**: Check your RPC URL in `.env` file

### Verification Failed
**Solution**: Make sure you have a valid BaseScan API key

## 🎉 Success Metrics

After successful deployment, you'll have:
- ✅ Governance contract on Base Sepolia
- ✅ CampaignFactory contract on Base Sepolia  
- ✅ Sample campaign for testing
- ✅ Verified contracts on BaseScan
- ✅ Live frontend connected to testnet
- ✅ Complete Web3 crowdfunding platform

## 📝 Final Notes

This deployment process follows the Base Indonesia Workshop best practices and is production-ready for testnet deployment. The platform includes:

- **Risk Tranching**: 50/50, 70/30, 90/10 risk profiles
- **Milestone Management**: 5-milestone framework
- **Democratic Governance**: Funder voting system
- **IPFS Integration**: Decentralized evidence storage
- **Modern Frontend**: React/Next.js with Web3 integration

Your Web3 Milestone Crowdfunding Platform is ready for the hackathon! 🚀


