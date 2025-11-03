import { ethers } from "hardhat";

async function main() {
  console.log("\n=== Testing Campaign Contract on Blockchain ===\n");
  
  const campaignAddress = "0xCafac3dD18aC6c6e92c921884f9E4176737C052c";
  console.log("Campaign Address:", campaignAddress);
  
  // Get the SimpleProject ABI
  const SimpleProject = await ethers.getContractFactory("SimpleProject");
  const campaign = SimpleProject.attach(campaignAddress);
  
  try {
    // Try to read campaign data
    console.log("\nReading campaign data...");
    const data = await campaign.getProjectData();
    
    console.log("\n✅ Campaign Data Found:");
    console.log("  Title:", data.title);
    console.log("  Description:", data.description);
    console.log("  Founder:", data.founder);
    console.log("  Funding Goal:", ethers.formatEther(data.fundingGoal), "IDRX");
    console.log("  Total Raised:", ethers.formatEther(data.totalRaised), "IDRX");
    console.log("  State:", data.state);
    console.log("  Created At:", new Date(Number(data.createdAt) * 1000).toISOString());
    
    // Get current milestone
    const currentMilestone = await campaign.currentMilestone();
    console.log("\n  Current Milestone:", currentMilestone.toString());
    
    // Get milestones
    console.log("\n  Milestones:");
    for (let i = 0; i < 3; i++) {
      const milestone = await campaign.getMilestone(i);
      console.log(`    ${i}: ${milestone.description} - ${milestone.releasePercentage / 100}%`);
    }
    
    // Get contributors
    const contributors = await campaign.getContributors();
    console.log("\n  Contributors:", contributors.length);
    
  } catch (error: any) {
    console.error("\n❌ Error reading campaign:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

