// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "./SimpleCampaign.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SimpleFactory
 * @notice Factory contract for creating simple crowdfunding projects
 * @dev Simplified factory with basic project creation
 */
contract SimpleFactory is Ownable {
    
    // State variables
    uint256 public projectCount;
    uint256 public creationFee = 0.01 ether; // Simple creation fee
    
    // Mappings
    mapping(uint256 => address) public projects;
    mapping(address => uint256[]) public founderProjects;
    
    // Arrays
    address[] public allProjects;
    
    // Events
    event ProjectCreated(
        uint256 indexed projectId,
        address indexed projectAddress,
        address indexed founder,
        string title,
        uint256 fundingGoal
    );
    
    event CreationFeeUpdated(uint256 oldFee, uint256 newFee);
    event FeesWithdrawn(address indexed to, uint256 amount);
    
    // Custom errors
    error InsufficientCreationFee();
    error InvalidFundingGoal();
    error ProjectCreationFailed();
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @notice Create a new project
     */
    function createProject(
        string calldata title,
        string calldata description,
        uint256 fundingGoal,
        string[3] calldata milestoneDescriptions,
        uint256[3] calldata milestonePercentages
    ) external payable returns (address projectAddress) {
        
        // Validate creation fee
        if (msg.value < creationFee) {
            revert InsufficientCreationFee();
        }
        
        // Validate funding goal
        require(fundingGoal >= 0.01 ether && fundingGoal <= 1000 ether, "Invalid funding goal");
        
        // Validate milestone percentages sum to 100%
        uint256 totalPercentage = 0;
        for (uint256 i = 0; i < 3; i++) {
            require(milestonePercentages[i] > 0, "Invalid milestone percentage");
            totalPercentage += milestonePercentages[i];
        }
        require(totalPercentage == 10000, "Milestone percentages must sum to 100%");
        
        // Create new project
        SimpleProject newProject = new SimpleProject(
            msg.sender,
            title,
            description,
            fundingGoal,
            milestoneDescriptions,
            milestonePercentages
        );
        
        projectAddress = address(newProject);
        require(projectAddress != address(0), "Project creation failed");
        
        // Update state
        uint256 projectId = projectCount++;
        projects[projectId] = projectAddress;
        founderProjects[msg.sender].push(projectId);
        allProjects.push(projectAddress);
        
        emit ProjectCreated(
            projectId,
            projectAddress,
            msg.sender,
            title,
            fundingGoal
        );
        
        return projectAddress;
    }
    
    /**
     * @notice Get project address by ID
     */
    function getProject(uint256 projectId) external view returns (address) {
        return projects[projectId];
    }
    
    /**
     * @notice Get all projects created by a founder
     */
    function getFounderProjects(address founder) external view returns (uint256[] memory) {
        return founderProjects[founder];
    }
    
    /**
     * @notice Get all project addresses
     */
    function getAllProjects() external view returns (address[] memory) {
        return allProjects;
    }
    
    /**
     * @notice Update creation fee (owner only)
     */
    function updateCreationFee(uint256 newCreationFee) external onlyOwner {
        uint256 oldFee = creationFee;
        creationFee = newCreationFee;
        emit CreationFeeUpdated(oldFee, newCreationFee);
    }
    
    /**
     * @notice Withdraw accumulated fees (owner only)
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        payable(owner()).transfer(balance);
        emit FeesWithdrawn(owner(), balance);
    }
    
    /**
     * @notice Get platform statistics
     */
    function getPlatformStats() external view returns (
        uint256 totalProjects,
        uint256 currentCreationFee
    ) {
        return (projectCount, creationFee);
    }
    
    // Allow contract to receive ETH
    receive() external payable {}
}
