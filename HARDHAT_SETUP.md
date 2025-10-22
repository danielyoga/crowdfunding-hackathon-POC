# Connect Frontend to Local Hardhat Network

This guide will help you connect the frontend to a local Hardhat network with deployed smart contracts.

## Step 1: Start Local Hardhat Node

Open a terminal and run:

```bash
# From project root
npx hardhat node
```

This will:
- Start a local Ethereum network on `http://127.0.0.1:8545`
- Create 20 test accounts with 10,000 ETH each
- Display all account addresses and private keys
- Keep running in the foreground

**Important:** Keep this terminal open! The network will stop if you close it.

## Step 2: Deploy Smart Contracts

In a **new terminal** (keep the first one running), deploy the contracts:

```bash
# From project root
npx hardhat run scripts/deploy-simple.ts --network localhost
```

You should see output like:
```
Deploying SimpleFactory...
SimpleFactory deployed to: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0
```

**Save the Factory Address!** You'll need it in the next step.

## Step 3: Update Contract Addresses

Update `/frontend/lib/contracts.ts` with your deployed address:

```typescript
export const CONTRACT_ADDRESSES = {
  localhost: {
    factoryAddress: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0", // YOUR DEPLOYED ADDRESS HERE
  },
  // ...
}
```

## Step 4: Disable Mock Mode

Update `/frontend/contexts/MockRoleContext.tsx` line 72:

```typescript
// Change from:
isInMockMode: true,

// To:
isInMockMode: false,
```

## Step 5: Connect Wallet to Hardhat Network

### MetaMask Setup:

1. **Add Hardhat Network to MetaMask:**
   - Click the network dropdown (top left)
   - Click "Add Network" → "Add a network manually"
   - Enter:
     - **Network Name:** Hardhat Local
     - **RPC URL:** `http://127.0.0.1:8545`
     - **Chain ID:** `31337`
     - **Currency Symbol:** ETH
   - Click "Save"

2. **Import Test Account:**
   - Get a private key from the Hardhat node terminal
   - In MetaMask: Click account icon → "Import Account"
   - Paste private key
   - You should see 10,000 ETH!

### Test Account (Default):
```
Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
Balance: 10,000 ETH
```

## Step 6: Start Frontend

```bash
cd frontend
npm run dev
```

Visit `http://localhost:3000`

## Step 7: Connect & Test

1. **Connect Wallet:**
   - Make sure MetaMask is on "Hardhat Local" network
   - Click "Connect Wallet" in the app
   - Approve the connection

2. **Create Campaign:**
   - You should no longer see role selection (mock mode disabled)
   - Your real wallet address will be used
   - Create a campaign with real transactions!

## Troubleshooting

### Error: "Cannot connect to network"
- Make sure Hardhat node is still running
- Check it's on port 8545: `http://127.0.0.1:8545`
- Restart the Hardhat node if needed

### Error: "Nonce too high"
- This happens when you restart Hardhat node
- Solution: Reset MetaMask account
  - Settings → Advanced → Clear activity tab data
  - Or: Settings → Advanced → Reset Account

### Error: "Invalid address"
- Make sure you updated the factory address in `contracts.ts`
- Check the address matches what was deployed

### Can't see my campaign
- Refresh the page after creating a campaign
- Check browser console for errors (F12)
- Make sure the transaction was confirmed

## Network Reset

If you need to reset everything:

1. Stop Hardhat node (Ctrl+C)
2. Restart: `npx hardhat node`
3. Redeploy contracts: `npx hardhat run scripts/deploy-simple.ts --network localhost`
4. Update factory address in `contracts.ts`
5. Reset MetaMask account (Settings → Advanced → Reset Account)
6. Refresh frontend

## Current Status

✅ Hardhat configured
✅ Localhost network set up  
✅ ABIs available
✅ Web3 config ready
⚠️ **Mock mode still enabled** - Follow Step 4 to disable
⚠️ **Need to deploy contracts** - Follow Steps 1-2

## Next Steps After Setup

1. **Create a Campaign**
   - Connect your wallet
   - Fill in campaign details
   - Pay creation fee (testnet ETH)
   - Transaction will be mined on your local chain

2. **Fund a Campaign**
   - Switch to another test account
   - Browse campaigns
   - Fund with ETH
   - See real balance updates

3. **Complete Milestones**
   - Switch back to founder account
   - Submit milestone (requires IPFS hash)
   - Complete milestone
   - Receive funds!

## Useful Commands

```bash
# View Hardhat accounts
npx hardhat accounts

# Run tests
npx hardhat test

# Get contract size
npx hardhat size-contracts

# Clean artifacts
npx hardhat clean

# Compile contracts
npx hardhat compile
```

## Resources

- [Hardhat Documentation](https://hardhat.org/docs)
- [MetaMask Setup Guide](https://metamask.io/faqs/)
- [Ethers.js v6 Documentation](https://docs.ethers.org/v6/)

