# 🚀 Quick Start - Connect to Hardhat Network

Get your frontend connected to a local Hardhat network in **5 minutes**!

## Prerequisites

- Node.js installed
- MetaMask browser extension
- Two terminal windows open

---

## Terminal 1: Start Hardhat Node

```bash
npx hardhat node
```

**Output:**
```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/

Accounts
========
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

Account #1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 (10000 ETH)
Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
...
```

✅ **Keep this terminal running!** Don't close it.

---

## Terminal 2: Deploy Contracts

```bash
npx hardhat run scripts/deploy-and-save.ts --network localhost
```

**Output:**
```
🚀 Deploying Simple Factory to local network...
✅ SimpleFactory deployed to: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
📝 Deployment info saved to: deployments/localhost-31337.json
✅ Updated frontend/lib/contracts.ts with new address
🎉 Deployment completed successfully!
```

✅ **Addresses are automatically saved!** No manual updates needed.

---

## MetaMask Setup (One-time)

### 1. Add Hardhat Network

Click MetaMask network dropdown → "Add Network" → "Add a network manually"

Enter these details:
- **Network Name:** `Hardhat Local`
- **RPC URL:** `http://127.0.0.1:8545`
- **Chain ID:** `31337`
- **Currency Symbol:** `ETH`

Click "Save"

### 2. Import Test Account

From Terminal 1, copy Account #0's private key:
```
0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

In MetaMask:
1. Click account icon (top right)
2. "Import Account"
3. Paste the private key
4. Click "Import"

You should see: **10,000 ETH** 🎉

### 3. Switch to Hardhat Network

Click network dropdown → Select "Hardhat Local"

---

## Start Frontend

```bash
cd frontend
npm install  # if you haven't already
npm run dev
```

Visit: **http://localhost:3000**

---

## ✅ Verification Checklist

Before using the app, verify:

- [ ] Hardhat node is running (Terminal 1)
- [ ] Contracts are deployed (Terminal 2 shows success)
- [ ] MetaMask is on "Hardhat Local" network
- [ ] Test account imported (shows 10,000 ETH)
- [ ] Frontend is running (http://localhost:3000)
- [ ] Mock mode is **DISABLED** (check: `frontend/contexts/MockRoleContext.tsx` line 72 should be `isInMockMode: false`)

---

## 🎮 Test the Platform

### Create a Campaign

1. Go to http://localhost:3000
2. Click "Connect Wallet"
3. Approve connection in MetaMask
4. Click "Create Campaign" or "Start Your Heist"
5. Fill in details:
   - **Title:** "My DeFi Project"
   - **Description:** "Building something amazing"
   - **Funding Goal:** 5 ETH
   - **5 Milestones:** Set percentages that add to 100%
6. Click "Create Campaign"
7. **Confirm transaction in MetaMask** (you'll pay ~0.01 ETH creation fee)
8. Wait for confirmation
9. ✅ **Campaign created!** You'll be redirected to your campaigns page

### Fund a Campaign

1. Import a **second test account** (Account #1 from Hardhat)
   ```
   Private Key: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
   ```
2. Switch to this account in MetaMask
3. Browse campaigns and click on one
4. Choose a risk profile (Balanced recommended)
5. Enter amount (e.g., 1 ETH)
6. Click "Fund Campaign"
7. **Confirm in MetaMask**
8. ✅ **Funded!** See the balance update

### Complete a Milestone

1. Switch back to the **founder account** (Account #0)
2. Go to "My Campaigns"
3. Click "Manage" on your campaign
4. Click "Submit Milestone"
5. Add evidence (for now, use any text or fake IPFS hash)
6. Submit and confirm
7. ✅ **Milestone submitted!**

---

## 🔧 Troubleshooting

### "Nonce too high" Error

**Cause:** You restarted the Hardhat node but MetaMask remembers old transactions

**Fix:**
1. MetaMask → Settings → Advanced → Clear activity tab data
2. Or: Settings → Advanced → Reset Account

### Can't Connect Wallet

**Check:**
- MetaMask is on "Hardhat Local" network (Chain ID: 31337)
- RPC URL is `http://127.0.0.1:8545`
- Hardhat node is still running (Terminal 1)

### Campaign Not Found

**Check:**
- Look at browser console (F12) for errors
- Verify the factory address in `frontend/lib/contracts.ts` matches the deployed address
- Refresh the page

### Transaction Failed

**Common causes:**
- Insufficient ETH (you should have 10,000 ETH though)
- Wrong network in MetaMask
- Contract address mismatch
- Hardhat node restarted (need to reset MetaMask)

---

## 🔄 Reset Everything

If things get messy:

```bash
# Terminal 1: Stop node (Ctrl+C), then restart
npx hardhat node

# Terminal 2: Redeploy
npx hardhat run scripts/deploy-and-save.ts --network localhost

# MetaMask: Reset account
Settings → Advanced → Reset Account

# Frontend: Refresh browser
```

---

## 📊 Check Your Work

### View on Hardhat Console

Watch Terminal 1 - you'll see:
- Incoming transactions
- Block mining
- Gas used
- Function calls

Example:
```
eth_sendRawTransaction
eth_getTransactionReceipt
  Contract call:       SimpleCampaign#fund
  From:                0x70997970c51812dc3a010c7d01b50e0d17dc79c8
  Value:               1.0 ETH
  Gas used:            94521 of 94521
```

### Verify in Browser

Open browser console (F12) and run:
```javascript
// Check if Web3 is working
window.ethereum.request({ method: 'eth_accounts' })

// Should show your connected address
```

---

## 🎯 Success Indicators

You'll know it's working when:

✅ Wallet connects without errors  
✅ MetaMask shows "Hardhat Local" network  
✅ Campaign creation costs real (testnet) ETH  
✅ Balance decreases after transactions  
✅ Transactions appear in Hardhat console  
✅ No "mock" data or localStorage campaigns  
✅ Real-time balance updates  

---

## 📚 Additional Resources

- **Full Setup Guide:** `HARDHAT_SETUP.md`
- **Contract Documentation:** `docs/SMART_CONTRACT_GUIDE.md`
- **Hardhat Docs:** https://hardhat.org/

---

## 💡 Pro Tips

1. **Multiple Accounts:** Import both Account #0 (founder) and Account #1 (investor) to test the full flow

2. **Gas Tracking:** Watch the Hardhat console to see gas costs

3. **Fast Reset:** Keep the deploy command handy - you'll use it often during development

4. **Browser Console:** Keep it open (F12) to catch any errors

5. **Network Persistence:** Hardhat node data is lost when you stop it - this is normal for testing

---

**Happy Building! 🚀**

