import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("🚀 Deploying Simple Factory to local network...\n");

  // Deploy SimpleFactory
  const SimpleFactory = await ethers.getContractFactory("SimpleFactory");
  const factory = await SimpleFactory.deploy();
  await factory.waitForDeployment();

  const factoryAddress = await factory.getAddress();
  console.log("✅ SimpleFactory deployed to:", factoryAddress);

  // Save deployment info
  const deploymentInfo = {
    network: "localhost",
    chainId: 31337,
    factoryAddress: factoryAddress,
    deployedAt: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber(),
  };

  // Save to deployments folder
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFile = path.join(deploymentsDir, "localhost-31337.json");
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log("📝 Deployment info saved to:", deploymentFile);

  // Update frontend contracts.ts file
  const contractsFile = path.join(__dirname, "../frontend/lib/contracts.ts");
  if (fs.existsSync(contractsFile)) {
    let contractsContent = fs.readFileSync(contractsFile, "utf8");
    
    // Replace the localhost factory address
    const addressPattern = /localhost:\s*{\s*factoryAddress:\s*"0x[a-fA-F0-9]{40}"/;
    const replacement = `localhost: {\n    factoryAddress: "${factoryAddress}"`;
    
    if (addressPattern.test(contractsContent)) {
      contractsContent = contractsContent.replace(addressPattern, replacement);
      fs.writeFileSync(contractsFile, contractsContent);
      console.log("✅ Updated frontend/lib/contracts.ts with new address");
    } else {
      console.log("⚠️  Could not auto-update contracts.ts - please update manually");
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("📋 DEPLOYMENT SUMMARY");
  console.log("=".repeat(60));
  console.log("Network:", deploymentInfo.network);
  console.log("Chain ID:", deploymentInfo.chainId);
  console.log("Factory Address:", factoryAddress);
  console.log("Block Number:", deploymentInfo.blockNumber);
  console.log("=".repeat(60));

  console.log("\n🎉 Deployment completed successfully!");
  console.log("\n📌 Next Steps:");
  console.log("1. The factory address has been automatically updated in frontend/lib/contracts.ts");
  console.log("2. Make sure mock mode is disabled in frontend/contexts/MockRoleContext.tsx");
  console.log("3. Start the frontend: cd frontend && npm run dev");
  console.log("4. Connect MetaMask to Hardhat network (Chain ID: 31337, RPC: http://127.0.0.1:8545)");
  console.log("5. Import a test account from the Hardhat node output");
  console.log("\n💡 See HARDHAT_SETUP.md for detailed instructions\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });

