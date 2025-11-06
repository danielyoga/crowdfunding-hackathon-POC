import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * Deploy IDRX Crowdfunding Platform to Lisk Sepolia Testnet
 * 
 * Prerequisites:
 * - PRIVATE_KEY in .env file
 * - Testnet ETH in deployer account (get from Lisk faucet)
 * - IDRX tokens (get from IDRX faucet or DEX)
 * 
 * Steps:
 * 1. Deploy CampaignFactory with real IDRX address
 * 2. Verify contracts on Blockscout
 * 3. Save deployment addresses
 * 
 * NOTE: We use the REAL IDRX token on Lisk Sepolia, not MockIDRX
 */
async function main() {
  console.log("========================================");
  console.log("IDRX Crowdfunding Platform Deployment");
  console.log("Network: Lisk Sepolia Testnet (4202)");
  console.log("========================================\n");

  // ==================== Configuration ====================
  
  // IMPORTANT: Replace with actual IDRX token address on Lisk Sepolia
  // Reference: lisk-idrx documentation or NusanSwapV2 example
  const IDRX_SEPOLIA_ADDRESS = process.env.IDRX_SEPOLIA_ADDRESS || "0xD63029C1a3dA68b51c67c6D1DeC3DEe50D681661";
  
  console.log("⚙️  Configuration:");
  console.log("   IDRX Token Address:", IDRX_SEPOLIA_ADDRESS);
  console.log("   Network: Lisk Sepolia");
  console.log("   Chain ID: 4202");
  console.log("   RPC URL:", process.env.LISK_SEPOLIA_RPC_URL || "https://rpc.sepolia-api.lisk.com");
  console.log();

  // Get deployer
  const [deployer] = await ethers.getSigners();
  console.log("🔑 Deployer address:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("💰 Deployer balance:", ethers.formatEther(balance), "ETH");
  
  if (balance < ethers.parseEther("0.01")) {
    console.log("\n⚠️  WARNING: Low ETH balance!");
    console.log("   Get testnet ETH from: https://sepolia-faucet.lisk.com/");
    console.log("   Or: https://console.optimism.io/faucet\n");
  }
  console.log();

  // ==================== Deploy CampaignFactory ====================
  console.log("🏭 Deploying CampaignFactory...");
  console.log("   Using IDRX address:", IDRX_SEPOLIA_ADDRESS);
  
  const CampaignFactory = await ethers.getContractFactory("CampaignFactory");
  const factory = await CampaignFactory.deploy(IDRX_SEPOLIA_ADDRESS);
  
  console.log("   ⏳ Waiting for deployment...");
  await factory.waitForDeployment();
  
  const factoryAddress = await factory.getAddress();
  console.log("✅ CampaignFactory deployed to:", factoryAddress);
  
  // Verify configuration
  console.log("\n📊 Factory Configuration:");
  const [idrxToken, minGoal, maxGoal, maxDuration, platformFee, totalCampaigns] = await factory.getConfig();
  console.log("   IDRX Token:", idrxToken);
  console.log("   Min Goal:", ethers.formatEther(minGoal), "IDRX");
  console.log("   Max Goal:", ethers.formatEther(maxGoal), "IDRX");
  console.log("   Max Duration:", Number(maxDuration) / 86400, "days");
  console.log("   Platform Fee:", platformFee.toString(), "basis points");
  console.log("   Total Campaigns:", totalCampaigns.toString());
  console.log();

  // ==================== Save Deployment Info ====================
  console.log("💾 Saving deployment addresses...");
  
  const deploymentInfo = {
    network: "liskSepolia",
    chainId: 4202,
    timestamp: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      IDRX: IDRX_SEPOLIA_ADDRESS,
      CampaignFactory: factoryAddress
    },
    blockExplorer: {
      factory: `https://sepolia-blockscout.lisk.com/address/${factoryAddress}`,
      idrx: `https://sepolia-blockscout.lisk.com/address/${IDRX_SEPOLIA_ADDRESS}`
    },
    verification: {
      command: `npx hardhat verify --network liskSepolia ${factoryAddress} "${IDRX_SEPOLIA_ADDRESS}"`,
      apiUrl: "https://sepolia-blockscout.lisk.com/api"
    }
  };
  
  const fs = require("fs");
  const path = require("path");
  const deploymentsDir = path.join(__dirname, "../deployments");
  
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  const filePath = path.join(deploymentsDir, "lisk-sepolia-idrx.json");
  fs.writeFileSync(
    filePath,
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("✅ Deployment info saved to:", filePath);
  console.log();

  // ==================== Verification Instructions ====================
  console.log("🔍 Contract Verification:");
  console.log("   Run the following command to verify on Blockscout:");
  console.log();
  console.log("   " + deploymentInfo.verification.command);
  console.log();
  console.log("   Or manually verify at:");
  console.log("   " + deploymentInfo.blockExplorer.factory);
  console.log();

  // ==================== Summary ====================
  console.log("========================================");
  console.log("✅ Deployment Complete!");
  console.log("========================================");
  console.log("\n📋 Contract Addresses:");
  console.log("   IDRX Token:", IDRX_SEPOLIA_ADDRESS);
  console.log("   CampaignFactory:", factoryAddress);
  
  console.log("\n🔗 Block Explorer:");
  console.log("   Factory:", deploymentInfo.blockExplorer.factory);
  console.log("   IDRX:", deploymentInfo.blockExplorer.idrx);
  
  console.log("\n💡 Next Steps:");
  console.log("   1. Verify contracts on Blockscout (see command above)");
  console.log("   2. Update frontend/lib/contracts.ts with factory address");
  console.log("   3. Get IDRX tokens from faucet or DEX");
  console.log("   4. Create a test campaign");
  console.log("   5. Test contribution flow (approve + contribute)");
  
  console.log("\n🧪 Testing:");
  console.log("   - Lisk Sepolia Faucet: https://sepolia-faucet.lisk.com/");
  console.log("   - Block Explorer: https://sepolia-blockscout.lisk.com");
  console.log("   - RPC URL: https://rpc.sepolia-api.lisk.com");
  console.log("========================================\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Deployment failed:");
    console.error(error);
    process.exit(1);
  });

