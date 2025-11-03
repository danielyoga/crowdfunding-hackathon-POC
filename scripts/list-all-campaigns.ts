import { ethers } from "hardhat";

async function main() {
  console.log("\n=== Listing All Campaigns on Blockchain ===\n");
  
  const factoryAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  console.log("Factory Address:", factoryAddress);
  
  // Get the factory contract
  const SimpleFactory = await ethers.getContractFactory("SimpleFactory");
  const factory = SimpleFactory.attach(factoryAddress);
  
  try {
    // Get all projects
    const allProjects = await factory.getAllProjects();
    console.log(`\n✅ Found ${allProjects.length} campaign(s):\n`);
    
    // Get details for each project
    for (let i = 0; i < allProjects.length; i++) {
      const projectAddress = allProjects[i];
      console.log(`Campaign #${i}:`);
      console.log(`  Address: ${projectAddress}`);
      console.log(`  Link: http://localhost:3000/campaign/${projectAddress}`);
      
      // Try to get project details
      try {
        const SimpleProject = await ethers.getContractFactory("SimpleProject");
        const project = SimpleProject.attach(projectAddress);
        const data = await project.getProjectData();
        
        console.log(`  Title: ${data.title}`);
        console.log(`  Funding Goal: ${ethers.formatEther(data.fundingGoal)} IDRX`);
        console.log(`  Total Raised: ${ethers.formatEther(data.totalRaised)} IDRX`);
        console.log(`  State: ${data.state}`);
      } catch (err: any) {
        console.log(`  ⚠️  Could not read project data: ${err.message}`);
      }
      console.log("");
    }
    
    // Check the address user tried to access
    const userAddress = "0x768a23b2f2e86165f27fc68bd5b6d7ead8ff19d6";
    console.log("\n--- Checking user's address ---");
    console.log(`Address: ${userAddress}`);
    
    const exists = allProjects.some((addr: string) => 
      addr.toLowerCase() === userAddress.toLowerCase()
    );
    
    if (exists) {
      console.log("✅ This address exists in our campaigns");
    } else {
      console.log("❌ This address does NOT exist in our campaigns");
      console.log("   User may have old/invalid campaign address");
    }
    
  } catch (error: any) {
    console.error("\n❌ Error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

