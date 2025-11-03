# How to Fix: "Calling an account which is not a contract"

## Problem
Your browser has old campaign addresses cached in localStorage from previous Hardhat sessions. When Hardhat restarts, all deployed contracts are reset, making those addresses invalid.

## Solution

### Option 1: Clear Browser Storage (Recommended)
1. Open browser DevTools (F12 or Right-click → Inspect)
2. Go to **Console** tab
3. Run this command:
```javascript
localStorage.clear();
location.reload();
```

### Option 2: Use the Browse Page
Navigate to the Browse page which automatically fetches real campaigns from the blockchain:
```
http://localhost:3000/browse
```

### Option 3: Use Valid Addresses from Logs
Based on your current Hardhat session, these are the VALID campaign addresses:

```
✅ Campaign 1: 0xa16e02e87b7454126e5e10d957a927a7f5b5d2be
http://localhost:3000/campaign/0xa16e02e87b7454126e5e10d957a927a7f5b5d2be

✅ Campaign 2: 0xb7a5bd0345ef1cc5e66bf61bdec17d2461fbd968
http://localhost:3000/campaign/0xb7a5bd0345ef1cc5e66bf61bdec17d2461fbd968
```

## Why This Happens

### Hardhat Behavior
- Hardhat creates a **fresh blockchain** every time you run `npm run node`
- All previous contract addresses become invalid
- Factory always deploys to the **same address**: `0x5fbdb2315678afecb367f032d93f642f64180aa3`
- But campaign addresses change based on creation order

### Browser localStorage
- Your browser saves campaign data in localStorage for better UX
- When Hardhat resets, this cached data points to non-existent addresses
- You see: "WARNING: Calling an account which is not a contract"

## Permanent Fix

### Development Best Practice
Always clear localStorage when restarting Hardhat:

```bash
# Terminal 1: Start Hardhat
npm run node

# Terminal 2: Deploy contracts
npm run deploy:simple

# Browser Console: Clear old data
localStorage.clear();

# Terminal 3: Start frontend
cd frontend && npm run dev
```

### Automated Script
You can add this to your frontend initialization:

```typescript
// Check if Hardhat node was restarted
const savedFactoryAddress = localStorage.getItem('factoryAddress');
const currentFactoryAddress = '0x5fbdb2315678afecb367f032d93f642f64180aa3';

if (savedFactoryAddress !== currentFactoryAddress) {
  // Hardhat was restarted, clear all cached campaigns
  console.log('Detected Hardhat restart, clearing stale campaign data...');
  const keysToRemove = Object.keys(localStorage).filter(key => 
    key.startsWith('campaign_') || key.startsWith('project_')
  );
  keysToRemove.forEach(key => localStorage.removeItem(key));
  localStorage.setItem('factoryAddress', currentFactoryAddress);
}
```

## Current Status

### Your Hardhat Node
- Factory: `0x5fbdb2315678afecb367f032d93f642f64180aa3`
- Active Campaigns: 4 campaigns deployed (Blocks #2-5)

### Invalid Address You're Trying
- `0x2ef19f909ef7a9c50f4a2360e06101b93f688358` ❌
- This address is from a previous Hardhat session
- It no longer exists after Hardhat restart

## Verification

After clearing localStorage, verify by checking the Browse page:
```bash
# The Browse page calls:
factory.getAllProjects() → Returns all valid campaign addresses
```

You should see 4 campaigns listed automatically.

