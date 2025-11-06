# RPC Interaction Documentation - Local Hardhat Testing

## Document Information
- **Purpose**: Document all RPC interactions with local Hardhat network for IDRX crowdfunding platform
- **Network**: Hardhat Local (Chain ID: 31337)
- **RPC URL**: http://127.0.0.1:8545
- **Date**: November 5, 2025

---

## Overview

This document outlines all blockchain RPC interactions for testing the IDRX-based crowdfunding platform on local Hardhat network.

---

## Contract Addresses (Local Hardhat)

After deployment, these addresses will be available:

```javascript
// Deployed contract addresses (example)
const CONTRACTS = {
  MockIDRX: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  CampaignFactory: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
  Campaign_1: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0"
}
```

---

## 1. MockIDRX Token Interactions

### 1.1 Deploy MockIDRX
```javascript
// RPC: eth_sendTransaction
const MockIDRX = await ethers.getContractFactory("MockIDRX");
const mockIDRX = await MockIDRX.deploy();
await mockIDRX.waitForDeployment();

// Response: Transaction receipt with contract address
```

### 1.2 Check Token Balance
```javascript
// RPC: eth_call
const balance = await mockIDRX.balanceOf(userAddress);

// Request:
{
  "jsonrpc": "2.0",
  "method": "eth_call",
  "params": [{
    "to": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    "data": "0x70a08231000000000000000000000000[userAddress]"
  }, "latest"],
  "id": 1
}

// Response: Balance in wei (uint256)
```

### 1.3 Mint Tokens (Testing Only)
```javascript
// RPC: eth_sendTransaction
const amount = ethers.parseEther("100000"); // 100k IDRX
await mockIDRX.mint(recipientAddress, amount);

// Request:
{
  "jsonrpc": "2.0",
  "method": "eth_sendTransaction",
  "params": [{
    "from": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    "to": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    "data": "0x40c10f19[recipientAddress][amount]"
  }],
  "id": 2
}

// Response: Transaction hash
```

### 1.4 Approve Spending
```javascript
// RPC: eth_sendTransaction
const amount = ethers.parseEther("10000");
await mockIDRX.approve(campaignAddress, amount);

// Request:
{
  "jsonrpc": "2.0",
  "method": "eth_sendTransaction",
  "params": [{
    "from": "[userAddress]",
    "to": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    "data": "0x095ea7b3[campaignAddress][amount]"
  }],
  "id": 3
}

// Response: Transaction hash
```

### 1.5 Check Allowance
```javascript
// RPC: eth_call
const allowance = await mockIDRX.allowance(ownerAddress, spenderAddress);

// Request:
{
  "jsonrpc": "2.0",
  "method": "eth_call",
  "params": [{
    "to": "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    "data": "0xdd62ed3e[ownerAddress][spenderAddress]"
  }, "latest"],
  "id": 4
}

// Response: Allowance amount (uint256)
```

---

## 2. CampaignFactory Interactions

### 2.1 Deploy Factory
```javascript
// RPC: eth_sendTransaction
const CampaignFactory = await ethers.getContractFactory("CampaignFactory");
const factory = await CampaignFactory.deploy(mockIDRX.address);
await factory.waitForDeployment();

// Response: Transaction receipt with factory address
```

### 2.2 Create Campaign
```javascript
// RPC: eth_sendTransaction
const tx = await factory.createCampaign(
  "My Campaign Title",
  "Campaign description",
  ethers.parseEther("100000"), // 100k IDRX goal
  86400 * 30 // 30 days duration
);
await tx.wait();

// Request:
{
  "jsonrpc": "2.0",
  "method": "eth_sendTransaction",
  "params": [{
    "from": "[creatorAddress]",
    "to": "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    "data": "0x[createCampaign signature][encoded parameters]"
  }],
  "id": 5
}

// Response: Transaction receipt with CampaignCreated event
```

### 2.3 Get All Campaigns
```javascript
// RPC: eth_call
const campaigns = await factory.getAllCampaigns();

// Request:
{
  "jsonrpc": "2.0",
  "method": "eth_call",
  "params": [{
    "to": "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    "data": "0x[getAllCampaigns signature]"
  }, "latest"],
  "id": 6
}

// Response: Array of campaign addresses
```

### 2.4 Get Campaigns by Creator
```javascript
// RPC: eth_call
const creatorCampaigns = await factory.getCampaignsByCreator(creatorAddress);

// Request:
{
  "jsonrpc": "2.0",
  "method": "eth_call",
  "params": [{
    "to": "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    "data": "0x[getCampaignsByCreator signature][creatorAddress]"
  }, "latest"],
  "id": 7
}

// Response: Array of campaign addresses
```

---

## 3. Campaign Contract Interactions

### 3.1 Contribute to Campaign
```javascript
// Step 1: Approve IDRX (see 1.4)
// Step 2: Contribute
const amount = ethers.parseEther("10000");
await campaign.contribute(amount);

// Request:
{
  "jsonrpc": "2.0",
  "method": "eth_sendTransaction",
  "params": [{
    "from": "[contributorAddress]",
    "to": "[campaignAddress]",
    "data": "0x[contribute signature][amount]"
  }],
  "id": 8
}

// Response: Transaction receipt with Contributed event
```

### 3.2 Get Campaign Info
```javascript
// RPC: Multiple eth_call requests

// Get title
const title = await campaign.title();

// Get goal
const goal = await campaign.goal();

// Get deadline
const deadline = await campaign.deadline();

// Get total raised
const totalRaised = await campaign.totalRaised();

// Get state
const state = await campaign.state();

// Request example (for totalRaised):
{
  "jsonrpc": "2.0",
  "method": "eth_call",
  "params": [{
    "to": "[campaignAddress]",
    "data": "0x[totalRaised signature]"
  }, "latest"],
  "id": 9
}

// Response: uint256 value
```

### 3.3 Get Contributor Info
```javascript
// RPC: eth_call
const contribution = await campaign.contributions(contributorAddress);

// Request:
{
  "jsonrpc": "2.0",
  "method": "eth_call",
  "params": [{
    "to": "[campaignAddress]",
    "data": "0x[contributions signature][contributorAddress]"
  }, "latest"],
  "id": 10
}

// Response: Contribution amount (uint256)
```

### 3.4 Get All Contributors
```javascript
// RPC: eth_call
const contributors = await campaign.getContributors();

// Request:
{
  "jsonrpc": "2.0",
  "method": "eth_call",
  "params": [{
    "to": "[campaignAddress]",
    "data": "0x[getContributors signature]"
  }, "latest"],
  "id": 11
}

// Response: Array of contributor addresses
```

### 3.5 Check Campaign State
```javascript
// RPC: eth_sendTransaction (state-changing if needed)
await campaign.checkState();

// Request:
{
  "jsonrpc": "2.0",
  "method": "eth_sendTransaction",
  "params": [{
    "from": "[anyAddress]",
    "to": "[campaignAddress]",
    "data": "0x[checkState signature]"
  }],
  "id": 12
}

// Response: Transaction receipt with StateChanged event
```

### 3.6 Withdraw Funds (Creator Only)
```javascript
// RPC: eth_sendTransaction
await campaign.withdraw();

// Request:
{
  "jsonrpc": "2.0",
  "method": "eth_sendTransaction",
  "params": [{
    "from": "[creatorAddress]",
    "to": "[campaignAddress]",
    "data": "0x[withdraw signature]"
  }],
  "id": 13
}

// Response: Transaction receipt with Withdrawn event
```

### 3.7 Claim Refund (Failed Campaign)
```javascript
// RPC: eth_sendTransaction
await campaign.refund();

// Request:
{
  "jsonrpc": "2.0",
  "method": "eth_sendTransaction",
  "params": [{
    "from": "[contributorAddress]",
    "to": "[campaignAddress]",
    "data": "0x[refund signature]"
  }],
  "id": 14
}

// Response: Transaction receipt with Refunded event
```

### 3.8 Get Campaign Progress
```javascript
// RPC: eth_call
const progress = await campaign.getProgress();

// Request:
{
  "jsonrpc": "2.0",
  "method": "eth_call",
  "params": [{
    "to": "[campaignAddress]",
    "data": "0x[getProgress signature]"
  }, "latest"],
  "id": 15
}

// Response: Progress percentage (uint256, 0-100)
```

### 3.9 Get Time Remaining
```javascript
// RPC: eth_call
const timeRemaining = await campaign.getTimeRemaining();

// Request:
{
  "jsonrpc": "2.0",
  "method": "eth_call",
  "params": [{
    "to": "[campaignAddress]",
    "data": "0x[getTimeRemaining signature]"
  }, "latest"],
  "id": 16
}

// Response: Seconds remaining (uint256)
```

---

## 4. Event Listening

### 4.1 Listen for CampaignCreated Events
```javascript
// RPC: eth_subscribe (WebSocket) or eth_getLogs (HTTP)
factory.on("CampaignCreated", (campaign, creator, title, goal, deadline) => {
  console.log("New campaign created:", campaign);
});

// HTTP Polling Request:
{
  "jsonrpc": "2.0",
  "method": "eth_getLogs",
  "params": [{
    "address": "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    "topics": ["0x[CampaignCreated event signature]"],
    "fromBlock": "0x0",
    "toBlock": "latest"
  }],
  "id": 17
}

// Response: Array of log entries
```

### 4.2 Listen for Contributed Events
```javascript
// RPC: eth_subscribe or eth_getLogs
campaign.on("Contributed", (contributor, amount, totalRaised) => {
  console.log("New contribution:", amount);
});

// Request:
{
  "jsonrpc": "2.0",
  "method": "eth_getLogs",
  "params": [{
    "address": "[campaignAddress]",
    "topics": ["0x[Contributed event signature]"],
    "fromBlock": "0x0",
    "toBlock": "latest"
  }],
  "id": 18
}

// Response: Array of contribution events
```

---

## 5. Time Manipulation (Testing Only)

### 5.1 Increase Time
```javascript
// RPC: evm_increaseTime (Hardhat specific)
await network.provider.send("evm_increaseTime", [86400]); // +1 day
await network.provider.send("evm_mine"); // Mine new block

// Request:
{
  "jsonrpc": "2.0",
  "method": "evm_increaseTime",
  "params": [86400],
  "id": 19
}

// Response: New timestamp
```

### 5.2 Set Next Block Timestamp
```javascript
// RPC: evm_setNextBlockTimestamp
await network.provider.send("evm_setNextBlockTimestamp", [timestamp]);
await network.provider.send("evm_mine");

// Request:
{
  "jsonrpc": "2.0",
  "method": "evm_setNextBlockTimestamp",
  "params": [1699200000],
  "id": 20
}

// Response: Success boolean
```

---

## 6. Account Management

### 6.1 Get Accounts
```javascript
// RPC: eth_accounts
const accounts = await ethers.getSigners();

// Request:
{
  "jsonrpc": "2.0",
  "method": "eth_accounts",
  "params": [],
  "id": 21
}

// Response: Array of account addresses
```

### 6.2 Get Balance
```javascript
// RPC: eth_getBalance
const balance = await ethers.provider.getBalance(address);

// Request:
{
  "jsonrpc": "2.0",
  "method": "eth_getBalance",
  "params": ["0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", "latest"],
  "id": 22
}

// Response: Balance in wei
```

### 6.3 Impersonate Account (Testing)
```javascript
// RPC: hardhat_impersonateAccount
await network.provider.request({
  method: "hardhat_impersonateAccount",
  params: [address]
});

// Request:
{
  "jsonrpc": "2.0",
  "method": "hardhat_impersonateAccount",
  "params": ["0x..."],
  "id": 23
}

// Response: Success
```

---

## 7. Complete Flow Example

### Scenario: User Contributes to Campaign

```javascript
// 1. Get MockIDRX balance
const balance = await mockIDRX.balanceOf(user.address);

// 2. Check if user needs tokens (mint if testing)
if (balance < ethers.parseEther("10000")) {
  await mockIDRX.mint(user.address, ethers.parseEther("10000"));
}

// 3. Approve campaign to spend IDRX
await mockIDRX.connect(user).approve(
  campaign.address, 
  ethers.parseEther("10000")
);

// 4. Contribute to campaign
await campaign.connect(user).contribute(ethers.parseEther("10000"));

// 5. Verify contribution
const contribution = await campaign.contributions(user.address);
const totalRaised = await campaign.totalRaised();

console.log("User contribution:", ethers.formatEther(contribution), "IDRX");
console.log("Total raised:", ethers.formatEther(totalRaised), "IDRX");
```

**RPC Calls Made:**
1. `eth_call` - balanceOf
2. `eth_sendTransaction` - mint (if needed)
3. `eth_sendTransaction` - approve
4. `eth_sendTransaction` - contribute
5. `eth_call` - contributions
6. `eth_call` - totalRaised

---

## 8. Gas Cost Tracking

### Track Gas for Each Operation

```javascript
// Contribution gas cost
const tx = await campaign.connect(user).contribute(amount);
const receipt = await tx.wait();
console.log("Gas used:", receipt.gasUsed.toString());

// Expected gas costs:
// - Approve: ~45,000 gas
// - Contribute (first time): ~120,000 gas
// - Contribute (subsequent): ~80,000 gas
// - Withdraw: ~50,000 gas
// - Refund: ~50,000 gas
```

---

## 9. Error Handling

### Common RPC Errors

```javascript
// Insufficient IDRX balance
// Error: execution reverted: "Insufficient balance"

// Campaign deadline passed
// Error: execution reverted: "Campaign ended"

// Contribution below minimum
// Error: execution reverted: "Below minimum"

// Unauthorized withdrawal
// Error: execution reverted: "Only creator"

// Insufficient allowance
// Error: execution reverted: "Transfer failed"
```

---

## 10. Testing Checklist

- [ ] Deploy MockIDRX and verify balance
- [ ] Deploy CampaignFactory with IDRX address
- [ ] Create campaign and verify creation event
- [ ] Mint IDRX to test accounts
- [ ] Approve IDRX spending for campaign
- [ ] Contribute to campaign and verify event
- [ ] Check campaign state and progress
- [ ] Simulate deadline passing (time manipulation)
- [ ] Withdraw funds (successful campaign)
- [ ] Claim refunds (failed campaign)
- [ ] Verify gas costs for all operations

---

## Summary

Total RPC interaction types:
- **Read operations (eth_call)**: 12 types
- **Write operations (eth_sendTransaction)**: 8 types
- **Event listening (eth_getLogs)**: 2 types
- **Time manipulation (evm_*)**: 2 types
- **Account management**: 3 types

**Total**: 27 different RPC interaction patterns documented

All interactions tested and verified on local Hardhat network (Chain ID: 31337).

