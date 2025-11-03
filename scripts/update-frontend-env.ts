import { ethers } from "hardhat";
import fs from 'fs';
import path from 'path';

async function main() {
  console.log("🔧 Updating Frontend Environment Configuration");
  console.log("=============================================");
  
  // Check if we have a deployed factory address
  const factoryAddress = process.env.FACTORY_ADDRESS || "0x0000000000000000000000000000000000000000";
  
  if (factoryAddress === "0x0000000000000000000000000000000000000000") {
    console.log("❌ No factory address provided!");
    console.log("Please set FACTORY_ADDRESS environment variable or deploy contracts first.");
    console.log("\nTo deploy contracts:");
    console.log("npm run deploy:lisk-faucet");
    return;
  }
  
  const frontendEnvPath = path.join(__dirname, '../frontend/.env.local');
  const envContent = `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your-project-id-here
NEXT_PUBLIC_LISK_SEPOLIA_RPC_URL=https://rpc.sepolia-api.lisk.com
NEXT_PUBLIC_LISK_MAINNET_RPC_URL=https://rpc.api.lisk.com
NEXT_PUBLIC_SIMPLE_FACTORY_ADDRESS=${factoryAddress}`;
  
  try {
    fs.writeFileSync(frontendEnvPath, envContent);
    console.log("✅ Frontend environment updated successfully!");
    console.log("📁 File:", frontendEnvPath);
    console.log("🏭 Factory Address:", factoryAddress);
    console.log("\n🌐 Frontend Configuration:");
    console.log("- Network: Lisk Sepolia (Chain ID: 4202)");
    console.log("- RPC URL: https://rpc.sepolia-api.lisk.com");
    console.log("- Explorer: https://sepolia-blockscout.lisk.com");
    console.log("\n🚀 To start the frontend:");
    console.log("cd frontend && npm run dev");
  } catch (error) {
    console.error("❌ Failed to update frontend environment:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
