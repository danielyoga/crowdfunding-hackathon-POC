import { ethers } from "hardhat";
import { writeFileSync } from "fs";
import { join } from "path";

async function main() {
  console.log("🚀 Starting deployment to Base Sepolia Testnet...\n");

  const [deployer] = await ethers.getSigners();
  
  if (!deployer) {
    console.log("❌ No deployer account found!");
    console.log("💡 Please set up your .env file with:");
    console.log("   PRIVATE_KEY=your_private_key_with_testnet_eth");
    console.log("   BASE_SEPOLIA_RPC_URL=https://sepolia.base.org");
    console.log("   BASESCAN_API_KEY=your_basescan_api_key");
    console.log("\n🔗 Get testnet ETH from:");
    console.log("   https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet");
    return;
  }
  
  console.log("Deploying contracts with account:", deployer.address);
  
  // Check balance
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");
  
  if (balance < ethers.parseEther("0.1")) {
    console.log("⚠️  WARNING: Low balance! You need at least 0.1 ETH for deployment.");
    console.log("   Get testnet ETH from: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet");
    return;
  }
  
  console.log("\n📋 Deploying Governance contract...");
  const GovernanceContract = await ethers.getContractFactory("Governance");
  const governance = await GovernanceContract.deploy(deployer.address);
  await governance.waitForDeployment();
  const governanceAddress = await governance.getAddress();
  console.log("✅ Governance deployed to:", governanceAddress);

  console.log("\n🏭 Deploying CampaignFactory contract...");
  const CampaignFactoryContract = await ethers.getContractFactory("CampaignFactory");
  const campaignFactory = await CampaignFactoryContract.deploy(deployer.address);
  await campaignFactory.waitForDeployment();
  const campaignFactoryAddress = await campaignFactory.getAddress();
  console.log("✅ CampaignFactory deployed to:", campaignFactoryAddress);

  console.log("\n🔗 Setting up contract authorizations...");
  const authTx = await governance.setContractAuthorization(campaignFactoryAddress, true);
  await authTx.wait();
  console.log("✅ CampaignFactory authorized in Governance");

  // Get network information
  const network = await ethers.provider.getNetwork();
  const networkName = network.name === "unknown" ? "baseSepolia" : network.name;
  
  console.log("\n📊 Deployment Summary:");
  console.log("=".repeat(60));
  console.log(`Network: ${networkName} (Chain ID: ${network.chainId})`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Governance: ${governanceAddress}`);
  console.log(`CampaignFactory: ${campaignFactoryAddress}`);
  console.log("=".repeat(60));

  // Save deployment addresses to file
  const deploymentInfo = {
    network: networkName,
    chainId: network.chainId.toString(),
    deployer: deployer.address,
    contracts: {
      Governance: governanceAddress,
      CampaignFactory: campaignFactoryAddress,
    },
    deployedAt: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber(),
    gasUsed: {
      governance: "~1.7M gas",
      campaignFactory: "~3.4M gas",
      authorization: "~48K gas"
    }
  };

  const deploymentsDir = join(__dirname, "..", "deployments");
  const deploymentFile = join(deploymentsDir, `${networkName}-${network.chainId}.json`);
  
  try {
    writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    console.log(`\n💾 Deployment info saved to: ${deploymentFile}`);
  } catch (error) {
    console.log("\n⚠️  Could not save deployment info:", error);
  }

  // Create a sample campaign for testing on testnet
  console.log("\n🧪 Creating sample campaign for testing...");
  
  const milestoneDescriptions: [string, string, string, string, string] = [
    "Prototype Development - Build MVP and core features",
    "Early Traction - Acquire first 200 users and gather feedback", 
    "Strategic Partnership - Secure 1-2 key partnerships with MoUs",
    "Revenue Proof - Generate first revenue or demonstrate measurable impact",
    "Public Launch - Scale to 1000+ users with public dashboard"
  ];
  
  const milestoneDeadlines: [bigint, bigint, bigint, bigint, bigint] = [
    90n,  // 90 days
    120n, // 120 days  
    90n,  // 90 days
    120n, // 120 days
    60n   // 60 days
  ];
  
  const milestonePercentages: [bigint, bigint, bigint, bigint, bigint] = [
    1000n, // 10%
    2000n, // 20%
    2500n, // 25%
    2500n, // 25% 
    2000n  // 20%
  ];

  const fundingGoal = ethers.parseEther("1"); // 1 ETH (smaller for testnet)
  const creationFee = ethers.parseEther("0.01"); // 0.01 ETH

  try {
    const tx = await campaignFactory.createCampaign(
      "Web3 Milestone Crowdfunding Demo",
      "A demonstration of our revolutionary milestone-based crowdfunding platform with user-defined risk profiles and democratic governance. This is a testnet demo campaign.",
      fundingGoal,
      milestoneDescriptions,
      milestoneDeadlines,
      milestonePercentages,
      { value: creationFee }
    );

    const receipt = await tx.wait();
    console.log("✅ Sample campaign created successfully!");
    console.log(`   Transaction hash: ${receipt?.hash}`);
    
    // Get the campaign address from the event
    const campaignCreatedEvent = receipt?.logs.find(log => {
      try {
        const parsed = campaignFactory.interface.parseLog({
          topics: log.topics as string[],
          data: log.data
        });
        return parsed?.name === "CampaignCreated";
      } catch {
        return false;
      }
    });

    if (campaignCreatedEvent) {
      const parsed = campaignFactory.interface.parseLog({
        topics: campaignCreatedEvent.topics as string[],
        data: campaignCreatedEvent.data
      });
      console.log(`   Campaign address: ${parsed?.args[1]}`);
      
      // Update deployment info with sample campaign
      deploymentInfo.contracts = {
        ...deploymentInfo.contracts,
        SampleCampaign: parsed?.args[1]
      };
      
      writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    }
  } catch (error) {
    console.log("⚠️  Could not create sample campaign:", error);
  }

  console.log("\n🎉 Deployment to Base Sepolia completed successfully!");
  console.log("\n📝 Next steps:");
  console.log("1. Verify contracts on BaseScan:");
  console.log(`   npx hardhat verify --network baseSepolia ${governanceAddress} "${deployer.address}"`);
  console.log(`   npx hardhat verify --network baseSepolia ${campaignFactoryAddress} "${deployer.address}"`);
  console.log("\n2. Update your frontend environment variables:");
  console.log(`   NEXT_PUBLIC_CAMPAIGN_FACTORY_ADDRESS=${campaignFactoryAddress}`);
  console.log(`   NEXT_PUBLIC_GOVERNANCE_ADDRESS=${governanceAddress}`);
  console.log(`   NEXT_PUBLIC_CHAIN_ID=84532`);
  console.log("\n3. View on BaseScan:");
  console.log(`   Governance: https://sepolia.basescan.org/address/${governanceAddress}`);
  console.log(`   CampaignFactory: https://sepolia.basescan.org/address/${campaignFactoryAddress}`);
  console.log("\n4. Test the platform with real testnet ETH!");
  
  console.log("\n🔗 Useful Links:");
  console.log("   Base Sepolia Faucet: https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet");
  console.log("   BaseScan Testnet: https://sepolia.basescan.org/");
  console.log("   Base Sepolia RPC: https://sepolia.base.org");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
