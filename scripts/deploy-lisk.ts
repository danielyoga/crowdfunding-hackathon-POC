import { ethers } from "hardhat";

async function main() {
  console.log("Deploying to Lisk Network...");
  console.log("Network:", await ethers.provider.getNetwork());

  // Deploy SimpleFactory
  const SimpleFactory = await ethers.getContractFactory("SimpleFactory");
  const factory = await SimpleFactory.deploy();
  await factory.waitForDeployment();

  const factoryAddress = await factory.getAddress();
  console.log("SimpleFactory deployed to:", factoryAddress);

  // Create a sample project
  console.log("\nCreating sample project...");
  
  const milestoneDescriptions: [string, string, string] = [
    "Prototype Development",
    "Beta Testing", 
    "Product Launch"
  ];
  
  const milestonePercentages: [number, number, number] = [3000, 4000, 3000]; // 30%, 40%, 30% = 100%
  
  const tx = await factory.createProject(
    "Lisk Crowdfunding Project",
    "A revolutionary crowdfunding platform built on Lisk L2",
    ethers.parseEther("5"), // 5 IDRX goal
    milestoneDescriptions,
    milestonePercentages,
    { value: ethers.parseEther("0.01") } // Creation fee
  );
  
  const receipt = await tx.wait();
  console.log("Sample project created!");
  
  // Get the project address
  const projectAddress = await factory.projects(0);
  console.log("Project address:", projectAddress);
  
  console.log("\nDeployment completed successfully!");
  console.log("Factory Address:", factoryAddress);
  console.log("Sample Project Address:", projectAddress);
  
  // Save deployment info
  const deploymentInfo = {
    network: await ethers.provider.getNetwork(),
    factoryAddress,
    projectAddress,
    deploymentTime: new Date().toISOString()
  };
  
  console.log("\nDeployment Info:");
  console.log(JSON.stringify(deploymentInfo, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
