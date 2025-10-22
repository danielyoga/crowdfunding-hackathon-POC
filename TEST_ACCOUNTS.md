# 🔑 Test Accounts for Hardhat Local Network

Use these accounts to test the platform. Each has **10,000 ETH** in your local Hardhat network.

---

## 👤 Account #0 - Founder Account

**Address:**
```
0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
```

**Private Key:**
```
0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

**Recommended Use:**
- ✅ Create campaigns
- ✅ Submit milestones
- ✅ Manage campaign settings
- ✅ Withdraw funds after milestone completion

**Balance:** 10,000 ETH

---

## 💰 Account #1 - Investor Account

**Address:**
```
0x70997970C51812dc3A010C7d01b50e0d17dc79C8
```

**Private Key:**
```
0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
```

**Recommended Use:**
- ✅ Fund campaigns
- ✅ Vote on milestones
- ✅ Claim refunds if needed
- ✅ View investment portfolio

**Balance:** 10,000 ETH

---

## 💰 Account #2 - Additional Investor

**Address:**
```
0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
```

**Private Key:**
```
0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a
```

**Recommended Use:**
- ✅ Test with multiple investors
- ✅ Vote on milestones
- ✅ Participate in governance

**Balance:** 10,000 ETH

---

## 🦊 How to Import into MetaMask

1. **Open MetaMask** → Click account icon (top right)
2. **Select "Import Account"**
3. **Paste one of the private keys above**
4. **Click "Import"**
5. **Rename the account** (e.g., "Hardhat Founder", "Hardhat Investor")

Repeat for multiple accounts to test the full platform flow!

---

## 🔐 Security Note

⚠️ **These are PUBLIC test keys** - visible to everyone!

- ✅ **ONLY use on local Hardhat network**
- ❌ **NEVER send real funds to these addresses**
- ❌ **NEVER use these keys on mainnet or testnets**
- ❌ **NEVER use these keys for anything real**

These keys are from the Hardhat default mnemonic and are publicly known. They are safe ONLY for local testing.

---

## 🌐 Network Configuration

When importing these accounts, make sure MetaMask is set to:

- **Network Name:** Hardhat Local
- **RPC URL:** http://127.0.0.1:8545
- **Chain ID:** 31337
- **Currency Symbol:** ETH

---

## 🎮 Testing Flow

### Complete User Journey Test:

1. **Import Account #0** (Founder)
   - Connect to platform
   - Create a campaign
   - Set funding goal: 5 ETH
   - Submit campaign

2. **Switch to Account #1** (Investor)
   - Browse campaigns
   - Fund the campaign with 2 ETH
   - Choose "Balanced" risk profile

3. **Switch to Account #2** (Investor)
   - Fund the same campaign with 1 ETH
   - Choose "Conservative" risk profile

4. **Back to Account #0** (Founder)
   - View your campaign (now has 3 ETH)
   - Submit first milestone
   - Complete milestone

5. **Switch to Account #1** (Investor)
   - View campaign
   - See milestone completion
   - Check your investment status

---

## 📊 Checking Balances

You can check balances in:

### MetaMask
- Shows current balance for connected account
- Updates after transactions

### Browser Console (F12)
```javascript
// Get balance for an address
const balance = await ethereum.request({
  method: 'eth_getBalance',
  params: ['0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', 'latest']
});

// Convert from Wei to ETH
console.log(parseInt(balance, 16) / 1e18);
```

### Hardhat Console
```bash
npx hardhat console --network localhost
```

Then in the console:
```javascript
const balance = await ethers.provider.getBalance('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
console.log(ethers.formatEther(balance));
```

---

## 🔄 Reset Balances

If you've spent too much ETH:

1. **Stop Hardhat node** (Ctrl+C)
2. **Restart:** `npx hardhat node`
3. **Redeploy contracts:** `npx hardhat run scripts/deploy-and-save.ts --network localhost`
4. **Reset MetaMask:** Settings → Advanced → Reset Account

All accounts will have 10,000 ETH again! ✨

---

## 💡 Tips

1. **Label your accounts** in MetaMask for easy switching
2. **Keep Account #0 as default** - it's the deployer
3. **Use different accounts** to test investor vs founder flows
4. **Check Hardhat logs** to see which account made each transaction
5. **Don't worry about running out** - you have 10,000 ETH per account!

---

**Need Help?**
- See `QUICK_START_HARDHAT.md` for full setup
- See `HARDHAT_SETUP.md` for troubleshooting

