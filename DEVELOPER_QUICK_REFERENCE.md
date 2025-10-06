# Developer Quick Reference Guide

## 🚀 Quick Links

- **Full Documentation**: [COMPLETE_DOCUMENTATION.md](./COMPLETE_DOCUMENTATION.md)
- **Smart Contract Guide**: See Section 5 in complete docs
- **Frontend Integration**: See Section 6 in complete docs
- **API Reference**: See Section 9 in complete docs

---

## 📋 Table of Contents

1. [Smart Contract Cheat Sheet](#smart-contract-cheat-sheet)
2. [Frontend Integration Cheat Sheet](#frontend-integration-cheat-sheet)
3. [Common Patterns](#common-patterns)
4. [Troubleshooting](#troubleshooting)

---

## Smart Contract Cheat Sheet

### Key Constants

```solidity
MIN_CONTRIBUTION = 0.001 ETH        // Minimum funding amount
VOTING_PERIOD = 7 days              // How long voting lasts
APPROVAL_THRESHOLD = 6000           // 60% approval needed
MAX_WHALE_POWER = 2000              // 20% max voting power
PLATFORM_FEE = 200                  // 2% platform fee
```

### Risk Profiles

| Profile | Committed | Reserve | Use Case |
|---------|-----------|---------|----------|
| Conservative (0) | 50% | 50% | Low risk, maximum protection |
| Balanced (1) | 70% | 30% | Moderate risk, balanced approach |
| Aggressive (2) | 90% | 10% | High risk, maximum capital deployment |

### Campaign States

```solidity
enum CampaignState {
    Active,      // 0 - Campaign is running
    Completed,   // 1 - All milestones completed
    Failed       // 2 - Campaign failed, refunds available
}
```

### Milestone States

```solidity
enum MilestoneState {
    Pending,     // 0 - Waiting for submission
    Submitted,   // 1 - Submitted, not yet voting (unused)
    Voting,      // 2 - Currently in voting period
    Approved,    // 3 - Approved, funds released
    Rejected,    // 4 - Rejected by voters
    Completed    // 5 - Fully completed
}
```

### Key Functions

#### For Funders

```solidity
// Fund a campaign
fund(RiskProfile riskProfile) payable
// Params: 0=Conservative, 1=Balanced, 2=Aggressive
// Min: 0.001 ETH

// Vote on milestone
vote(uint256 milestoneId, bool support)
// Params: milestoneId (0-4), support (true=YES, false=NO)

// Claim refund (if campaign failed)
claimRefund()
```

#### For Founders

```solidity
// Submit milestone evidence
submitMilestone(uint256 milestoneId, string evidenceIPFS)
// Params: milestoneId (0-4), IPFS hash

// Pause campaign (emergency)
pause()

// Resume campaign
unpause()
```

#### View Functions

```solidity
getCampaignData() → CampaignData
getMilestone(uint256 id) → Milestone
getFunder(address addr) → Funder
getRefundAmount(address addr) → uint256
```

---

## Frontend Integration Cheat Sheet

### Setup (One Time)

```bash
npm install ethers@6 wagmi viem @rainbow-me/rainbowkit
```

### Connect Wallet

```typescript
import { ethers } from 'ethers';

// Connect to MetaMask
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
const address = await signer.getAddress();
```

### Contract Instance

```typescript
import { ethers } from 'ethers';
import CAMPAIGN_ABI from './abis/Campaign.json';

const campaign = new ethers.Contract(
  CAMPAIGN_ADDRESS,
  CAMPAIGN_ABI,
  signer  // Use provider for read-only, signer for transactions
);
```

### Common Operations

#### Read Campaign Data

```typescript
// Get all campaign info
const data = await campaign.getCampaignData();
console.log(data.title, data.totalRaised, data.fundingGoal);

// Get milestone info
const milestone = await campaign.getMilestone(0);
console.log(milestone.description, milestone.state);

// Get funder info
const funder = await campaign.getFunder(userAddress);
console.log(funder.totalContribution, funder.riskProfile);
```

#### Fund Campaign

```typescript
// Fund with 1 ETH, balanced risk profile
const tx = await campaign.fund(1, {
  value: ethers.parseEther("1")
});
await tx.wait();
console.log("Funded successfully!");
```

#### Vote on Milestone

```typescript
// Vote YES on milestone 0
const tx = await campaign.vote(0, true);
await tx.wait();
console.log("Vote cast!");
```

#### Claim Refund

```typescript
// Check refund amount first
const refundAmount = await campaign.getRefundAmount(userAddress);
console.log("Refund available:", ethers.formatEther(refundAmount), "ETH");

// Claim refund
const tx = await campaign.claimRefund();
await tx.wait();
console.log("Refund claimed!");
```

### Event Listening

```typescript
// Listen for new funding
campaign.on('FundReceived', (funder, amount, riskProfile) => {
  console.log(`${funder} funded ${ethers.formatEther(amount)} ETH`);
});

// Listen for votes
campaign.on('VoteCast', (milestoneId, voter, support, votingPower) => {
  console.log(`Vote: ${support ? 'YES' : 'NO'} with ${ethers.formatEther(votingPower)} ETH`);
});

// Cleanup when done
campaign.removeAllListeners();
```

### React Hook Pattern

```typescript
import { useContractRead } from 'wagmi';

function useCampaign(address: string) {
  const { data, isLoading } = useContractRead({
    address,
    abi: CAMPAIGN_ABI,
    functionName: 'getCampaignData',
    watch: true,  // Auto-refresh
  });
  
  return { campaign: data, isLoading };
}

// Usage
const { campaign, isLoading } = useCampaign('0x...');
```

---

## Common Patterns

### Pattern 1: Check Before Action

```typescript
// Always check state before attempting action
const campaignData = await campaign.getCampaignData();

if (campaignData.state !== 0) {
  throw new Error('Campaign not active');
}

// Check if user already funded
const funder = await campaign.getFunder(userAddress);
if (funder.totalContribution > 0) {
  console.log('Already funded with:', funder.riskProfile);
}

// Now safe to fund
await campaign.fund(riskProfile, { value: amount });
```

### Pattern 2: Error Handling

```typescript
try {
  const tx = await campaign.fund(1, { value: ethers.parseEther("1") });
  await tx.wait();
  console.log("Success!");
} catch (error) {
  if (error.code === 'ACTION_REJECTED') {
    console.log('User rejected transaction');
  } else if (error.message.includes('BelowMinimumContribution')) {
    console.log('Amount too low (min 0.001 ETH)');
  } else if (error.message.includes('FundingGoalReached')) {
    console.log('Campaign already fully funded');
  } else {
    console.error('Unknown error:', error);
  }
}
```

### Pattern 3: Transaction Status

```typescript
// Show loading state
setLoading(true);

try {
  // Send transaction
  const tx = await campaign.fund(1, { value: ethers.parseEther("1") });
  console.log('Transaction sent:', tx.hash);
  
  // Wait for confirmation
  const receipt = await tx.wait();
  console.log('Confirmed in block:', receipt.blockNumber);
  
  // Success!
  setLoading(false);
  showSuccessMessage();
} catch (error) {
  setLoading(false);
  showErrorMessage(error);
}
```

### Pattern 4: Formatting Values

```typescript
import { ethers } from 'ethers';

// Parse (string → BigInt)
const amount = ethers.parseEther("1.5");        // 1500000000000000000n
const bps = ethers.parseUnits("2", 4);          // 20000n (for 2% in basis points)

// Format (BigInt → string)
const eth = ethers.formatEther(amount);         // "1.5"
const pct = Number(bps) / 100;                  // 2

// Display in UI
<div>{ethers.formatEther(totalRaised)} ETH</div>
```

### Pattern 5: Progress Calculation

```typescript
const campaignData = await campaign.getCampaignData();

// Calculate progress percentage
const progress = (Number(campaignData.totalRaised) / 
                 Number(campaignData.fundingGoal)) * 100;

// Calculate time remaining
const now = Math.floor(Date.now() / 1000);
const deadline = Number(campaignData.createdAt) + 
                (Number(milestones[0].deadline) * 86400);
const daysRemaining = Math.max(0, Math.floor((deadline - now) / 86400));

// Display
console.log(`${progress.toFixed(1)}% funded`);
console.log(`${daysRemaining} days remaining`);
```

---

## Troubleshooting

### Common Errors

#### "User rejected transaction"
```
Error: ACTION_REJECTED
```
**Solution**: User declined in wallet. This is normal - just show a message.

---

#### "Insufficient funds"
```
Error: insufficient funds for intrinsic transaction cost
```
**Solution**: User doesn't have enough ETH for transaction + gas. Show balance check.

---

#### "BelowMinimumContribution"
```
Error: execution reverted: BelowMinimumContribution()
```
**Solution**: Amount < 0.001 ETH. Validate input before sending transaction.

---

#### "InvalidRiskProfile"
```
Error: execution reverted: InvalidRiskProfile()
```
**Solution**: Risk profile must be 0, 1, or 2. Check your enum mapping.

---

#### "AlreadyVoted"
```
Error: execution reverted: AlreadyVoted()
```
**Solution**: User already voted on this milestone. Check `funder.hasVoted[milestoneId]` first.

---

#### "NotFunder"
```
Error: execution reverted: NotFunder()
```
**Solution**: User hasn't funded this campaign. Check `funder.totalContribution > 0` first.

---

#### "VotingNotActive"
```
Error: execution reverted: VotingNotActive()
```
**Solution**: Milestone not in voting state. Check `milestone.state === 2` first.

---

#### "RefundNotAvailable"
```
Error: execution reverted: RefundNotAvailable()
```
**Solution**: Campaign not failed. Check `campaignData.state === 2` first.

---

### Gas Issues

#### Transaction Fails with "out of gas"
**Solution**: 
```typescript
// Estimate gas first
const gasEstimate = await campaign.fund.estimateGas(1, { 
  value: ethers.parseEther("1") 
});

// Add 20% buffer
const gasLimit = gasEstimate * 120n / 100n;

// Send with explicit gas limit
await campaign.fund(1, { 
  value: ethers.parseEther("1"),
  gasLimit 
});
```

#### Gas price too high
**Solution**:
```typescript
// Get current gas price
const feeData = await provider.getFeeData();
console.log('Gas price:', ethers.formatUnits(feeData.gasPrice, 'gwei'), 'gwei');

// Wait for lower gas or use custom gas price
await campaign.fund(1, { 
  value: ethers.parseEther("1"),
  maxFeePerGas: ethers.parseUnits("50", "gwei")  // Custom max
});
```

---

### Network Issues

#### Wrong Network
```typescript
// Check network
const network = await provider.getNetwork();
console.log('Connected to:', network.name, network.chainId);

// Base Mainnet: chainId 8453
// Base Sepolia: chainId 84532

if (network.chainId !== 8453n) {
  alert('Please switch to Base network');
}
```

#### RPC Connection Issues
```typescript
// Use multiple RPC endpoints
const providers = [
  'https://mainnet.base.org',
  'https://base.llamarpc.com',
  'https://base.publicnode.com'
];

// Try each until one works
for (const rpc of providers) {
  try {
    const provider = new ethers.JsonRpcProvider(rpc);
    await provider.getBlockNumber();  // Test connection
    console.log('Connected to:', rpc);
    break;
  } catch (error) {
    console.log('Failed:', rpc);
  }
}
```

---

### Data Issues

#### BigInt Serialization
```typescript
// ❌ WRONG: Can't JSON.stringify BigInt
const data = await campaign.getCampaignData();
localStorage.setItem('campaign', JSON.stringify(data));  // ERROR

// ✅ CORRECT: Convert BigInt to string first
const serializable = {
  ...data,
  totalRaised: data.totalRaised.toString(),
  fundingGoal: data.fundingGoal.toString()
};
localStorage.setItem('campaign', JSON.stringify(serializable));
```

#### Address Validation
```typescript
// Validate address before using
try {
  const validAddress = ethers.getAddress(userInput);  // Checksums address
  console.log('Valid:', validAddress);
} catch (error) {
  console.log('Invalid address');
}
```

---

## Performance Tips

### 1. Batch Reads
```typescript
// ❌ SLOW: Multiple separate calls
const data = await campaign.getCampaignData();
const milestone0 = await campaign.getMilestone(0);
const milestone1 = await campaign.getMilestone(1);

// ✅ FAST: Use Promise.all
const [data, milestone0, milestone1] = await Promise.all([
  campaign.getCampaignData(),
  campaign.getMilestone(0),
  campaign.getMilestone(1)
]);
```

### 2. Cache Data
```typescript
// Cache campaign data (updates every 12 seconds on Base)
const CACHE_TIME = 12000;  // 12 seconds
let cachedData = null;
let cacheTime = 0;

async function getCampaignData() {
  if (Date.now() - cacheTime < CACHE_TIME) {
    return cachedData;
  }
  
  cachedData = await campaign.getCampaignData();
  cacheTime = Date.now();
  return cachedData;
}
```

### 3. Use Events Instead of Polling
```typescript
// ❌ SLOW: Poll every second
setInterval(async () => {
  const data = await campaign.getCampaignData();
  updateUI(data);
}, 1000);

// ✅ FAST: Listen to events
campaign.on('FundReceived', async () => {
  const data = await campaign.getCampaignData();
  updateUI(data);
});
```

---

## Security Checklist

### Before Mainnet Launch

- [ ] Professional security audit completed
- [ ] All tests passing (113/113)
- [ ] Testnet testing (2+ weeks)
- [ ] Multi-sig wallet set up for ownership
- [ ] Emergency procedures documented
- [ ] Gas optimization verified
- [ ] Frontend input validation
- [ ] Rate limiting on backend
- [ ] Contract verified on block explorer
- [ ] Documentation complete

### Frontend Security

- [ ] Validate all user inputs
- [ ] Check contract state before transactions
- [ ] Handle all error cases
- [ ] Never store private keys
- [ ] Use HTTPS only
- [ ] Sanitize displayed data
- [ ] Implement rate limiting
- [ ] Log security events

---

## Useful Commands

```bash
# Compile contracts
npx hardhat compile

# Run tests
npm test

# Deploy to localhost
npx hardhat node
npx hardhat run scripts/deploy-hardhat.ts --network localhost

# Deploy to Base Sepolia
npx hardhat run scripts/deploy-hardhat.ts --network baseSepolia

# Verify contract
npx hardhat verify --network baseSepolia CONTRACT_ADDRESS

# Get contract ABI
cat artifacts/contracts/Campaign.sol/Campaign.json | jq .abi

# Check gas usage
npm run gas-report

# Code coverage
npm run coverage
```

---

## Additional Resources

- **Base Documentation**: https://docs.base.org
- **Ethers.js Docs**: https://docs.ethers.org/v6
- **Wagmi Docs**: https://wagmi.sh
- **OpenZeppelin**: https://docs.openzeppelin.com
- **Hardhat**: https://hardhat.org/docs

---

## Quick Reference Cards

### Smart Contract Functions

| Function | Who | Purpose | Gas Cost |
|----------|-----|---------|----------|
| `fund()` | Anyone | Fund campaign | ~100k |
| `vote()` | Funders | Vote on milestone | ~80k |
| `submitMilestone()` | Founder | Submit evidence | ~120k |
| `finalizeMilestone()` | Anyone | End voting | ~150k+ |
| `claimRefund()` | Funders | Get refund | ~50k |

### Event Types

| Event | When | Use For |
|-------|------|---------|
| `FundReceived` | New funding | Update progress bar |
| `VoteCast` | New vote | Update vote count |
| `MilestoneCompleted` | Milestone approved | Show celebration |
| `MilestoneRejected` | Milestone rejected | Show warning |
| `CampaignFailed` | Campaign fails | Show refund button |
| `RefundClaimed` | Refund processed | Update balance |

---

**🎯 This is your go-to reference for quick lookups!**

For detailed explanations, see [COMPLETE_DOCUMENTATION.md](./COMPLETE_DOCUMENTATION.md)

*Last Updated: January 2025*
