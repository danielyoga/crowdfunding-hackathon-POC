import { ethers } from "hardhat";

/**
 * Deploy IDRX Crowdfunding Platform to Local Hardhat Network
 * 
 * Steps:
 * 1. Deploy MockIDRX token
 * 2. Deploy CampaignFactory with IDRX address
 * 3. Mint IDRX to test accounts
 * 4. Create sample campaign
 * 5. Save deployment addresses
 */
async function main() {
  console.log("========================================");
  console.log("IDRX Crowdfunding Platform Deployment");
  console.log("Network: Hardhat Local (31337)");
  console.log("========================================\n");

  // Get signers
  const [deployer, creator, contributor1, contributor2] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);
  console.log("Deployer balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH\n");

  // ==================== Step 1: Deploy MockIDRX ====================
  console.log("📦 Deploying MockIDRX token...");
  const MockIDRX = await ethers.getContractFactory("MockIDRX");
  const mockIDRX = await MockIDRX.deploy();
  await mockIDRX.waitForDeployment();
  const idrxAddress = await mockIDRX.getAddress();
  console.log("✅ MockIDRX deployed to:", idrxAddress);
  
  const initialSupply = await mockIDRX.balanceOf(deployer.address);
  console.log("   Initial supply (deployer):", ethers.formatEther(initialSupply), "IDRX\n");

  // ==================== Step 2: Deploy CampaignFactory ====================
  console.log("🏭 Deploying CampaignFactory...");
  const CampaignFactory = await ethers.getContractFactory("CampaignFactory");
  const factory = await CampaignFactory.deploy(idrxAddress);
  await factory.waitForDeployment();
  const factoryAddress = await factory.getAddress();
  console.log("✅ CampaignFactory deployed to:", factoryAddress);
  console.log("   IDRX token address:", await factory.idrxToken());
  console.log("   Min goal:", ethers.formatEther(await factory.MIN_GOAL()), "IDRX");
  console.log("   Max duration:", (await factory.MAX_DURATION()).toString(), "seconds\n");

  // ==================== Step 3: Mint IDRX to Test Accounts ====================
  console.log("💰 Minting IDRX to test accounts...");
  
  const mintAmount = ethers.parseEther("100000"); // 100k IDRX each
  
  await mockIDRX.mint(creator.address, mintAmount);
  console.log("✅ Minted", ethers.formatEther(mintAmount), "IDRX to creator:", creator.address);
  
  await mockIDRX.mint(contributor1.address, mintAmount);
  console.log("✅ Minted", ethers.formatEther(mintAmount), "IDRX to contributor1:", contributor1.address);
  
  await mockIDRX.mint(contributor2.address, mintAmount);
  console.log("✅ Minted", ethers.formatEther(mintAmount), "IDRX to contributor2:", contributor2.address);
  
  console.log();

  // ==================== Step 4: Create Sample Campaign ====================
  console.log("📝 Creating sample campaign...");
  
  const campaignGoal = ethers.parseEther("50000"); // 50k IDRX goal
  const campaignDuration = 30 * 24 * 60 * 60; // 30 days
  
  const tx = await factory.connect(creator).createCampaign(
    "My First IDRX Campaign",
    "This is a test campaign for IDRX-based crowdfunding platform. We aim to raise 50,000 IDRX to develop an amazing project!",
    campaignGoal,
    campaignDuration
  );
  
  const receipt = await tx.wait();
  
  // Get campaign address from event
  const campaignCreatedEvent = receipt?.logs.find(
    (log: any) => {
      try {
        const parsedLog = factory.interface.parseLog(log);
        return parsedLog?.name === "CampaignCreated";
      } catch {
        return false;
      }
    }
  );
  
  let campaignAddress = "";
  if (campaignCreatedEvent) {
    const parsedLog = factory.interface.parseLog(campaignCreatedEvent);
    campaignAddress = parsedLog?.args[0];
  }
  
  console.log("✅ Sample campaign created!");
  console.log("   Campaign address:", campaignAddress);
  console.log("   Creator:", creator.address);
  console.log("   Goal:", ethers.formatEther(campaignGoal), "IDRX");
  console.log("   Duration:", campaignDuration / 86400, "days\n");

  // Get campaign contract instance
  const Campaign = await ethers.getContractFactory("Campaign");
  const campaign = Campaign.attach(campaignAddress);
  
  // Verify campaign info
  const [title, description, campaignCreator, goal, deadline, totalRaised, state, contributorCount] = 
    await campaign.getCampaignInfo();
  
  console.log("📊 Campaign Details:");
  console.log("   Title:", title);
  console.log("   Goal:", ethers.formatEther(goal), "IDRX");
  console.log("   Deadline:", new Date(Number(deadline) * 1000).toLocaleString());
  console.log("   State:", ["Active", "Successful", "Failed", "Cancelled"][Number(state)]);
  console.log("   Total Raised:", ethers.formatEther(totalRaised), "IDRX\n");

  // ==================== Step 5: Make Sample Contribution ====================
  console.log("🎯 Making sample contribution...");
  
  const contributionAmount = ethers.parseEther("10000"); // 10k IDRX
  
  // Approve IDRX spending
  console.log("   Step 1/2: Approving IDRX...");
  const approveTx = await mockIDRX.connect(contributor1).approve(campaignAddress, contributionAmount);
  await approveTx.wait();
  console.log("   ✅ Approved", ethers.formatEther(contributionAmount), "IDRX");
  
  // Contribute to campaign
  console.log("   Step 2/2: Contributing...");
  const contributeTx = await campaign.connect(contributor1).contribute(contributionAmount);
  await contributeTx.wait();
  console.log("   ✅ Contributed", ethers.formatEther(contributionAmount), "IDRX");
  
  // Check updated campaign info
  const updatedTotalRaised = await campaign.totalRaised();
  const progress = await campaign.getProgress();
  console.log("   Campaign total raised:", ethers.formatEther(updatedTotalRaised), "IDRX");
  console.log("   Progress:", progress.toString(), "%\n");

  // ==================== Step 6: Save Deployment Info ====================
  console.log("💾 Saving deployment addresses...");
  
  const deploymentInfo = {
    network: "localhost",
    chainId: 31337,
    timestamp: new Date().toISOString(),
    contracts: {
      MockIDRX: idrxAddress,
      CampaignFactory: factoryAddress,
      SampleCampaign: campaignAddress
    },
    testAccounts: {
      deployer: deployer.address,
      creator: creator.address,
      contributor1: contributor1.address,
      contributor2: contributor2.address
    },
    sampleCampaign: {
      address: campaignAddress,
      title: title,
      goal: ethers.formatEther(goal) + " IDRX",
      totalRaised: ethers.formatEther(updatedTotalRaised) + " IDRX",
      progress: progress.toString() + "%"
    }
  };
  
  const fs = require("fs");
  const path = require("path");
  const deploymentsDir = path.join(__dirname, "../deployments");
  
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  fs.writeFileSync(
    path.join(deploymentsDir, "localhost-idrx.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("✅ Deployment info saved to deployments/localhost-idrx.json\n");

  // ==================== Summary ====================
  console.log("========================================");
  console.log("✅ Deployment Complete!");
  console.log("========================================");
  console.log("\n📋 Contract Addresses:");
  console.log("   MockIDRX:", idrxAddress);
  console.log("   CampaignFactory:", factoryAddress);
  console.log("   Sample Campaign:", campaignAddress);
  
  console.log("\n👥 Test Accounts:");
  console.log("   Deployer:", deployer.address);
  console.log("   Creator:", creator.address);
  console.log("   Contributor 1:", contributor1.address);
  console.log("   Contributor 2:", contributor2.address);
  
  console.log("\n💡 Next Steps:");
  console.log("   1. Update frontend/lib/contracts.ts with these addresses");
  console.log("   2. Run: cd frontend && npm run dev");
  console.log("   3. Connect MetaMask to localhost:8545");
  console.log("   4. Import test accounts using private keys");
  console.log("========================================\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

