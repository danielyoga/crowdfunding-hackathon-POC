# IDRX Crowdfunding Platform - Quick Start Guide

## 🚀 Get Started in 5 Minutes

This guide will help you deploy and test the IDRX-based crowdfunding platform on your local machine.

---

## Prerequisites

- Node.js 18+ installed
- MetaMask browser extension
- Basic understanding of Web3/Ethereum

---

## Step 1: Install Dependencies

```bash
cd /Users/agung/Dev/Lisk-Builder-R3/crowdfunding-hackathon-POC
npm install
```

---

## Step 2: Start Local Hardhat Network

Open a new terminal and keep it running:

```bash
npx hardhat node
```

You should see:
```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/

Accounts
========
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
Account #1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 (10000 ETH)
...
```

---

## Step 3: Deploy Contracts

In a new terminal:

```bash
npx hardhat run scripts/deploy-idrx-local.ts --network localhost
```

Expected output:
```
========================================
IDRX Crowdfunding Platform Deployment
Network: Hardhat Local (31337)
========================================

✅ MockIDRX deployed to: 0x5FbDB...
✅ CampaignFactory deployed to: 0xe7f17...
💰 Minted 100,000 IDRX to test accounts
📝 Sample campaign created!
✅ Deployment Complete!
```

**Save these addresses! You'll need them for frontend integration.**

---

## Step 4: Setup MetaMask

### Add Hardhat Network

1. Open MetaMask
2. Click network dropdown → "Add Network" → "Add a network manually"
3. Enter the following:

```
Network Name: Hardhat Local
RPC URL: http://127.0.0.1:8545
Chain ID: 31337
Currency Symbol: ETH
```

4. Click "Save"

### Import Test Account

1. In MetaMask, click account icon → "Import Account"
2. Paste this private key:
```
0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```
3. You should now see 10,000 ETH!

---

## Step 5: Test Interaction (Hardhat Console)

```bash
npx hardhat console --network localhost
```

```javascript
// Get contract addresses from deployment output
const idrxAddress = "0x5FbDB..." // Your MockIDRX address
const factoryAddress = "0xe7f17..." // Your CampaignFactory address

// Get contract instances
const mockIDRX = await ethers.getContractAt("MockIDRX", idrxAddress);
const factory = await ethers.getContractAt("CampaignFactory", factoryAddress);

// Check your IDRX balance
const [deployer, creator, contributor1] = await ethers.getSigners();
const balance = await mockIDRX.balanceOf(contributor1.address);
console.log("Balance:", ethers.formatEther(balance), "IDRX");

// Get all campaigns
const campaigns = await factory.getAllCampaigns();
console.log("Total campaigns:", campaigns.length);

// Get first campaign details
const Campaign = await ethers.getContractFactory("Campaign");
const campaign = Campaign.attach(campaigns[0]);
const [title, description, creator, goal, deadline, totalRaised, state] = 
  await campaign.getCampaignInfo();

console.log("Campaign:", title);
console.log("Goal:", ethers.formatEther(goal), "IDRX");
console.log("Raised:", ethers.formatEther(totalRaised), "IDRX");
```

---

## Step 6: Make a Contribution

```javascript
// In Hardhat console (continued from Step 5)

const contributionAmount = ethers.parseEther("10000"); // 10k IDRX

// Step 1: Approve IDRX spending
console.log("Approving IDRX...");
await mockIDRX.connect(contributor1).approve(campaigns[0], contributionAmount);
console.log("✅ Approved!");

// Step 2: Contribute to campaign
console.log("Contributing...");
await campaign.connect(contributor1).contribute(contributionAmount);
console.log("✅ Contributed!");

// Check updated balance
const newTotalRaised = await campaign.totalRaised();
console.log("New total raised:", ethers.formatEther(newTotalRaised), "IDRX");
```

---

## Common Commands

### Compile Contracts
```bash
npx hardhat compile
```

### Run Tests (when implemented)
```bash
npx hardhat test
```

### Deploy to Lisk Sepolia Testnet
```bash
# Set up .env file first
cp env.example .env
# Edit .env and add your PRIVATE_KEY

npx hardhat run scripts/deploy-idrx-lisk-sepolia.ts --network liskSepolia
```

---

## Understanding the Flow

### For Campaign Creators

1. **Create Campaign**:
   ```javascript
   await factory.createCampaign(
     "My Campaign Title",
     "Campaign description",
     ethers.parseEther("100000"), // 100k IDRX goal
     30 * 24 * 60 * 60 // 30 days duration
   );
   ```

2. **Wait for Funding**: Share campaign link with backers

3. **Withdraw Funds** (after goal reached):
   ```javascript
   await campaign.withdraw();
   ```

### For Contributors

1. **Approve IDRX**:
   ```javascript
   await mockIDRX.approve(campaignAddress, amount);
   ```

2. **Contribute**:
   ```javascript
   await campaign.contribute(amount);
   ```

3. **Claim Refund** (if campaign fails):
   ```javascript
   await campaign.refund();
   ```

---

## Contract Addresses (Local)

After deployment, you'll have these addresses (example):

```
MockIDRX: 0x5FbDB2315678afecb367f032d93F642f64180aa3
CampaignFactory: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
Sample Campaign: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
```

**Your addresses will be different!** Check the deployment output.

---

## Troubleshooting

### Issue: "Insufficient IDRX balance"

**Solution**: Mint IDRX to your account:
```javascript
await mockIDRX.mint(yourAddress, ethers.parseEther("100000"));
```

### Issue: "Transfer failed"

**Solution**: Approve IDRX spending first:
```javascript
await mockIDRX.approve(campaignAddress, amount);
```

### Issue: "Campaign ended"

**Solution**: Create a new campaign with a longer duration:
```javascript
await factory.createCampaign(..., 365 * 24 * 60 * 60); // 1 year
```

### Issue: "Below minimum"

**Solution**: Contribute at least 10,000 IDRX:
```javascript
const minAmount = ethers.parseEther("10000");
await campaign.contribute(minAmount);
```

### Issue: Hardhat node crashes

**Solution**: 
1. Stop the node (Ctrl+C)
2. Delete cache: `rm -rf cache/ artifacts/`
3. Restart: `npx hardhat node`
4. Redeploy contracts

---

## Next Steps

1. **Explore the Code**:
   - `contracts/Campaign.sol` - Campaign logic
   - `contracts/CampaignFactory.sol` - Factory logic
   - `contracts/mocks/MockIDRX.sol` - Test token

2. **Read Documentation**:
   - `docs/RPC_INTERACTIONS.md` - Complete RPC reference
   - `docs/IMPLEMENTATION_SUMMARY.md` - Architecture overview
   - `docs/briefs/stage1-refreshments.md` - Technical specifications

3. **Deploy to Testnet**:
   - Get testnet ETH from [Lisk Sepolia Faucet](https://sepolia-faucet.lisk.com/)
   - Run `npx hardhat run scripts/deploy-idrx-lisk-sepolia.ts --network liskSepolia`

4. **Integrate Frontend** (upcoming):
   - Update `frontend/lib/contracts.ts` with your addresses
   - Implement IDRX approval flow
   - Create contribution UI

---

## Key Differences from ETH-based Version

| Feature | Old (ETH) | New (IDRX) |
|---------|-----------|------------|
| Currency | Native ETH | ERC20 Token (IDRX) |
| Contribution | `fund() payable` | `contribute(amount)` |
| Approval | Not required | **Required** before contribution |
| Transactions | 1-step | **2-step** (approve + contribute) |
| Balance Check | `address.balance` | `idrxToken.balanceOf()` |
| Transfer | `address.transfer()` | `idrxToken.transfer()` |

---

## Resources

- **Lisk Documentation**: https://docs.lisk.com/
- **Hardhat Docs**: https://hardhat.org/docs
- **OpenZeppelin**: https://docs.openzeppelin.com/contracts/
- **Ethers.js**: https://docs.ethers.org/v6/

---

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review deployment logs in `deployments/` folder
3. Verify network configuration in `hardhat.config.ts`
4. Check RPC interactions in `docs/RPC_INTERACTIONS.md`

---

**Happy Building! 🚀**

