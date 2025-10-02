# 🚀 Base Sepolia Testnet Deployment Guide

This guide will help you deploy the Web3 Milestone Crowdfunding Platform to Base Sepolia testnet.

## 📋 Prerequisites

### 1. Get Base Sepolia ETH
- Visit: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet
- Connect your wallet and claim testnet ETH
- You need at least **0.1 ETH** for deployment

### 2. Set Up Environment Variables

Create a `.env` file in the project root with:

```bash
# Network Configuration
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
BASE_MAINNET_RPC_URL=https://mainnet.base.org

# Your wallet private key (NEVER share this!)
PRIVATE_KEY=your_private_key_here

# BaseScan API Key (optional, for verification)
BASESCAN_API_KEY=your_basescan_api_key_here
```

### 3. Get Your Private Key

**From MetaMask:**
1. Open MetaMask
2. Click the 3 dots menu → Account Details
3. Click "Export Private Key"
4. Enter your password
5. Copy the private key (starts with 0x)

**⚠️ SECURITY WARNING:**
- Never share your private key
- Never commit it to version control
- Use a separate wallet for testing

### 4. Get BaseScan API Key (Optional)

1. Visit: https://basescan.org/apis
2. Create account and get API key
3. Add to `.env` file for contract verification

## 🚀 Deployment Steps

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Compile Contracts
```bash
npm run compile
```

### Step 3: Run Tests (Optional)
```bash
npm test
```

### Step 4: Deploy to Base Sepolia
```bash
npm run deploy:sepolia
```

Or use the specific testnet script:
```bash
npx hardhat run scripts/deploy-testnet.ts --network baseSepolia
```

## 📊 Expected Output

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

📊 Deployment Summary:
============================================================
Network: baseSepolia (Chain ID: 84532)
Deployer: 0x1234...5678
Governance: 0xAbC1...DeF2
CampaignFactory: 0x1234...5678
============================================================

🎉 Deployment to Base Sepolia completed successfully!
```

## 🔍 Contract Verification

After deployment, verify your contracts on BaseScan:

```bash
# Verify Governance contract
npx hardhat verify --network baseSepolia <GOVERNANCE_ADDRESS> "<YOUR_WALLET_ADDRESS>"

# Verify CampaignFactory contract
npx hardhat verify --network baseSepolia <CAMPAIGN_FACTORY_ADDRESS> "<YOUR_WALLET_ADDRESS>"
```

## 🌐 Update Frontend Configuration

Update your frontend environment variables:

```bash
# In frontend/.env.local or frontend/env.local
NEXT_PUBLIC_CAMPAIGN_FACTORY_ADDRESS=0x1234...5678
NEXT_PUBLIC_GOVERNANCE_ADDRESS=0xAbC1...DeF2
NEXT_PUBLIC_CHAIN_ID=84532
NEXT_PUBLIC_RPC_URL=https://sepolia.base.org
```

## 🔗 Useful Links

- **Base Sepolia Faucet**: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet
- **BaseScan Testnet**: https://sepolia.basescan.org/
- **Base Sepolia RPC**: https://sepolia.base.org
- **Chain ID**: 84532

## 🎯 Testing Your Deployment

### 1. Add Base Sepolia to MetaMask

- **Network Name**: Base Sepolia
- **RPC URL**: https://sepolia.base.org
- **Chain ID**: 84532
- **Currency Symbol**: ETH
- **Block Explorer**: https://sepolia.basescan.org

### 2. Test the Platform

1. Visit your frontend (update with testnet addresses)
2. Connect MetaMask to Base Sepolia
3. Create a test campaign
4. Fund it with different risk profiles
5. Test milestone voting

## 🛠️ Troubleshooting

### Common Issues

**1. "Insufficient funds for gas"**
- Get more testnet ETH from the faucet
- Wait a few minutes and try again

**2. "Network not configured"**
- Check your `.env` file
- Ensure BASE_SEPOLIA_RPC_URL is correct

**3. "Private key invalid"**
- Ensure private key starts with 0x
- Check for extra spaces or characters

**4. "Contract verification failed"**
- Wait a few minutes after deployment
- Check BaseScan API key is correct
- Ensure constructor parameters match

### Getting Help

1. Check the deployment logs for specific errors
2. Verify your `.env` configuration
3. Ensure you have enough testnet ETH
4. Check BaseScan for transaction status

## 📈 Gas Costs (Approximate)

- **Governance Contract**: ~1.7M gas (~0.02 ETH)
- **CampaignFactory Contract**: ~3.4M gas (~0.04 ETH)
- **Authorization Setup**: ~48K gas (~0.001 ETH)
- **Sample Campaign**: ~3M gas (~0.03 ETH)

**Total**: ~0.1 ETH for complete deployment

## 🎉 Success!

Once deployed successfully, you'll have:

✅ **Governance contract** - Platform governance and disputes
✅ **CampaignFactory contract** - Creates and manages campaigns  
✅ **Sample campaign** - Ready for testing
✅ **Verified contracts** - Viewable on BaseScan
✅ **Frontend integration** - Connected to testnet

Your Web3 Milestone Crowdfunding Platform is now live on Base Sepolia testnet! 🚀
