import { ethers } from "hardhat";

async function main() {
  console.log("\n🔍 Fetching ALL valid campaign addresses from blockchain...\n");

  const factoryAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const SimpleFactory = await ethers.getContractFactory("SimpleFactory");
  const factory = SimpleFactory.attach(factoryAddress);

  try {
    // Get all project addresses
    const projectAddresses = await factory.getAllProjects();
    
    if (projectAddresses.length === 0) {
      console.log("❌ No campaigns found. Run 'npm run deploy:simple' first.\n");
      return;
    }

    console.log(`✅ Found ${projectAddresses.length} campaigns:\n`);
    console.log("=" .repeat(80));

    // Fetch details for each campaign
    const SimpleProject = await ethers.getContractFactory("SimpleProject");
    
    for (let i = 0; i < projectAddresses.length; i++) {
      const address = projectAddresses[i];
      const campaign = SimpleProject.attach(address);
      
      try {
        const data = await campaign.getProjectData();
        
        console.log(`\n📋 Campaign ${i + 1}:`);
        console.log(`   Address: ${address}`);
        console.log(`   Title: ${data.title}`);
        console.log(`   Goal: ${ethers.formatEther(data.fundingGoal)} IDRX`);
        console.log(`   Raised: ${ethers.formatEther(data.totalRaised)} IDRX`);
        console.log(`   State: ${["Funding", "Development", "Completed", "Failed"][Number(data.state)]}`);
        console.log(`   URL: http://localhost:3000/campaign/${address}`);
        
      } catch (err) {
        console.log(`\n⚠️  Campaign ${i + 1}: ${address} (Unable to fetch details)`);
      }
    }

    console.log("\n" + "=".repeat(80));
    console.log("\n💡 Quick Access URLs:\n");
    projectAddresses.forEach((address, i) => {
      console.log(`   ${i + 1}. http://localhost:3000/campaign/${address}`);
    });

    console.log("\n📖 Browse Page (shows all campaigns):");
    console.log("   http://localhost:3000/browse");
    
    console.log("\n✨ Factory Contract:");
    console.log(`   ${factoryAddress}`);
    console.log("");

  } catch (error) {
    console.error("❌ Error fetching campaigns:", error);
    console.log("\n💡 Make sure Hardhat node is running: npm run node");
    console.log("💡 Then deploy contracts: npm run deploy:simple\n");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

