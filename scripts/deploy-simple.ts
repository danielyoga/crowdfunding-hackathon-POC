import { ethers } from "hardhat";

async function main() {
  console.log("Deploying Simple Factory...");

  // Deploy SimpleFactory
  const SimpleFactory = await ethers.getContractFactory("SimpleFactory");
  const factory = await SimpleFactory.deploy();
  await factory.waitForDeployment();

  const factoryAddress = await factory.getAddress();
  console.log("SimpleFactory deployed to:", factoryAddress);

  // Create a sample campaign
  console.log("\nCreating sample campaign...");
  
  const milestoneDescriptions = [
    "Prototype Development",
    "Beta Testing", 
    "Product Launch"
  ];
  
  const milestonePercentages = [3000, 4000, 3000]; // 30%, 40%, 30%
  
  const tx = await factory.createCampaign(
    "Sample Web3 Project",
    "A revolutionary Web3 application for the future",
    ethers.parseEther("10"), // 10 ETH goal
    milestoneDescriptions,
    milestonePercentages,
    { value: ethers.parseEther("0.01") } // Creation fee
  );
  
  const receipt = await tx.wait();
  console.log("Sample campaign created!");
  
  // Get the campaign address
  const campaignAddress = await factory.campaigns(0);
  console.log("Campaign address:", campaignAddress);
  
  console.log("\nDeployment completed successfully!");
  console.log("Factory Address:", factoryAddress);
  console.log("Sample Campaign Address:", campaignAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
