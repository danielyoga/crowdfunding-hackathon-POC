import { ethers } from "hardhat";
import fs from 'fs';
import path from 'path';

async function main() {
  console.log("🚀 Lisk Sepolia Deployment & Frontend Integration");
  console.log("=================================================");
  
  const [deployer] = await ethers.getSigners();
  const address = await deployer.getAddress();
  const balance = await deployer.provider.getBalance(address);
  
  console.log("Deployment address:", address);
  console.log("Balance:", ethers.formatEther(balance), "ETH");
  
  if (balance === 0n) {
    console.log("\n❌ No testnet ETH found!");
    console.log("\n📋 To get testnet ETH:");
    console.log("1. Import this private key into MetaMask:");
    console.log("   Private Key: 0x1234567890123456789012345678901234567890123456789012345678901234");
    console.log("2. Add Lisk Sepolia network to MetaMask:");
    console.log("   - Network Name: Lisk Sepolia");
    console.log("   - RPC URL: https://rpc.sepolia-api.lisk.com");
    console.log("   - Chain ID: 4202");
    console.log("   - Currency Symbol: ETH");
    console.log("   - Block Explorer: https://sepolia-blockscout.lisk.com");
    console.log("3. Get testnet ETH from faucets:");
    console.log("   - Lisk Sepolia Faucet: https://sepolia-faucet.lisk.com/");
    console.log("   - Optimism Faucet: https://console.optimism.io/faucet");
    console.log("\n4. Run this script again after getting testnet ETH");
    return;
  }
  
  console.log("\n✅ Sufficient balance found! Proceeding with deployment...");
  
  // Deploy SimpleFactory
  console.log("\n📦 Deploying SimpleFactory...");
  const SimpleFactory = await ethers.getContractFactory("SimpleFactory");
  const factory = await SimpleFactory.deploy();
  await factory.waitForDeployment();

  const factoryAddress = await factory.getAddress();
  console.log("✅ SimpleFactory deployed to:", factoryAddress);

  // Create a sample project
  console.log("\n🎯 Creating sample project...");
  
  const milestoneDescriptions: [string, string, string] = [
    "Lisk Integration & Smart Contract Testing",
    "Frontend Integration & Security Audit",
    "Mainnet Launch"
  ];
  
  const milestonePercentages: [number, number, number] = [3000, 4000, 3000]; // 30%, 40%, 30% = 100%
  
  const tx = await factory.createProject(
    "Lisk Crowdfunding Platform",
    "A revolutionary crowdfunding platform built on Lisk L2 for the hackathon",
    ethers.parseEther("2"), // 2 IDRX goal
    milestoneDescriptions,
    milestonePercentages,
    { value: ethers.parseEther("0.01") } // Creation fee
  );
  
  const receipt = await tx.wait();
  console.log("✅ Sample project created!");
  
  // Get the project address
  const projectAddress = await factory.projects(0);
  console.log("✅ Project address:", projectAddress);
  
  console.log("\n🎉 Deployment completed successfully!");
  console.log("=====================================");
  console.log("Factory Address:", factoryAddress);
  console.log("Sample Project Address:", projectAddress);
  console.log("Network: Lisk Sepolia (Chain ID: 4202)");
  console.log("Explorer: https://sepolia-blockscout.lisk.com");
  
  // Update frontend environment
  console.log("\n🔧 Updating Frontend Environment...");
  const frontendEnvPath = path.join(__dirname, '../frontend/.env.local');
  const envContent = `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your-project-id-here
NEXT_PUBLIC_LISK_SEPOLIA_RPC_URL=https://rpc.sepolia-api.lisk.com
NEXT_PUBLIC_LISK_MAINNET_RPC_URL=https://rpc.api.lisk.com
NEXT_PUBLIC_SIMPLE_FACTORY_ADDRESS=${factoryAddress}`;
  
  try {
    fs.writeFileSync(frontendEnvPath, envContent);
    console.log("✅ Frontend environment updated!");
    console.log("📁 File:", frontendEnvPath);
  } catch (error) {
    console.error("❌ Failed to update frontend environment:", error);
  }
  
  // Save deployment info
  const deploymentInfo = {
    network: "lisk-sepolia",
    chainId: 4202,
    factoryAddress,
    projectAddress,
    deploymentTime: new Date().toISOString(),
    explorer: "https://sepolia-blockscout.lisk.com"
  };
  
  console.log("\n📄 Deployment Info (JSON):");
  console.log(JSON.stringify(deploymentInfo, null, 2));
  
  console.log("\n🚀 Next Steps:");
  console.log("1. Start the frontend: cd frontend && npm run dev");
  console.log("2. Open http://localhost:3000");
  console.log("3. Connect your MetaMask to Lisk Sepolia network");
  console.log("4. Test the integration!");
  
  console.log("\n🔗 Useful Links:");
  console.log("- Frontend: http://localhost:3000");
  console.log("- Factory Contract: https://sepolia-blockscout.lisk.com/address/" + factoryAddress);
  console.log("- Project Contract: https://sepolia-blockscout.lisk.com/address/" + projectAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
