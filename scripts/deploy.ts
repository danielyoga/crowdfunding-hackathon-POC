import { ethers } from "hardhat";
import { writeFileSync } from "fs";
import { join } from "path";

async function main() {
  console.log("🚀 Starting deployment of Web3 Milestone Crowdfunding Platform...\n");

  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // Deploy Governance contract first
  console.log("📋 Deploying Governance contract...");
  const GovernanceContract = await ethers.getContractFactory("Governance");
  const governance = await GovernanceContract.deploy(deployer.address);
  await governance.waitForDeployment();
  const governanceAddress = await governance.getAddress();
  console.log("✅ Governance deployed to:", governanceAddress);

  // Deploy CampaignFactory contract
  console.log("\n🏭 Deploying CampaignFactory contract...");
  const CampaignFactoryContract = await ethers.getContractFactory("CampaignFactory");
  const campaignFactory = await CampaignFactoryContract.deploy(deployer.address);
  await campaignFactory.waitForDeployment();
  const campaignFactoryAddress = await campaignFactory.getAddress();
  console.log("✅ CampaignFactory deployed to:", campaignFactoryAddress);

  // Authorize CampaignFactory to interact with Governance
  console.log("\n🔗 Setting up contract authorizations...");
  await governance.setContractAuthorization(campaignFactoryAddress, true);
  console.log("✅ CampaignFactory authorized in Governance");

  // Get network information
  const network = await ethers.provider.getNetwork();
  const networkName = network.name === "unknown" ? "localhost" : network.name;
  
  console.log("\n📊 Deployment Summary:");
  console.log("=".repeat(50));
  console.log(`Network: ${networkName} (Chain ID: ${network.chainId})`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Governance: ${governanceAddress}`);
  console.log(`CampaignFactory: ${campaignFactoryAddress}`);
  console.log("=".repeat(50));

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
  };

  const deploymentsDir = join(__dirname, "..", "deployments");
  const deploymentFile = join(deploymentsDir, `${networkName}-${network.chainId}.json`);
  
  try {
    writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
    console.log(`\n💾 Deployment info saved to: ${deploymentFile}`);
  } catch (error) {
    console.log("\n⚠️  Could not save deployment info:", error);
  }

  // Create a sample campaign for testing
  if (networkName === "localhost" || networkName === "hardhat") {
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

    const fundingGoal = ethers.parseEther("10"); // 10 ETH
    const creationFee = ethers.parseEther("0.01"); // 0.01 ETH

    try {
      const tx = await campaignFactory.createCampaign(
        "DeFi Innovation Platform",
        "A revolutionary DeFi platform that enables seamless cross-chain yield farming with automated portfolio optimization. Our platform will democratize access to advanced DeFi strategies for retail investors.",
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
  }

  console.log("\n🎉 Deployment completed successfully!");
  console.log("\n📝 Next steps:");
  console.log("1. Update your frontend environment variables with the contract addresses");
  console.log("2. Verify contracts on Basescan (if deploying to testnet/mainnet)");
  console.log("3. Test the platform with the sample campaign");
  console.log("4. Set up IPFS integration for milestone evidence storage");
  
  if (networkName !== "localhost" && networkName !== "hardhat") {
    console.log("\n🔍 To verify contracts, run:");
    console.log(`npx hardhat verify --network ${networkName} ${governanceAddress} "${deployer.address}"`);
    console.log(`npx hardhat verify --network ${networkName} ${campaignFactoryAddress} "${deployer.address}"`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
