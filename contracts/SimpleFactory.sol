// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "./SimpleCampaign.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SimpleFactory
 * @notice Factory contract for creating simple crowdfunding campaigns
 * @dev Simplified factory with basic campaign creation
 */
contract SimpleFactory is Ownable {
    
    // State variables
    uint256 public campaignCount;
    uint256 public creationFee = 0.01 ether; // Simple creation fee
    
    // Mappings
    mapping(uint256 => address) public campaigns;
    mapping(address => uint256[]) public founderCampaigns;
    
    // Arrays
    address[] public allCampaigns;
    
    // Events
    event CampaignCreated(
        uint256 indexed campaignId,
        address indexed campaignAddress,
        address indexed founder,
        string title,
        uint256 fundingGoal
    );
    
    event CreationFeeUpdated(uint256 oldFee, uint256 newFee);
    event FeesWithdrawn(address indexed to, uint256 amount);
    
    // Custom errors
    error InsufficientCreationFee();
    error InvalidFundingGoal();
    error CampaignCreationFailed();
    
    constructor() Ownable(msg.sender) {}
    
    /**
     * @notice Create a new campaign
     */
    function createCampaign(
        string calldata title,
        string calldata description,
        uint256 fundingGoal,
        string[3] calldata milestoneDescriptions,
        uint256[3] calldata milestonePercentages
    ) external payable returns (address campaignAddress) {
        
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
        
        // Create new campaign
        SimpleCampaign newCampaign = new SimpleCampaign(
            msg.sender,
            title,
            description,
            fundingGoal,
            milestoneDescriptions,
            milestonePercentages
        );
        
        campaignAddress = address(newCampaign);
        require(campaignAddress != address(0), "Campaign creation failed");
        
        // Update state
        uint256 campaignId = campaignCount++;
        campaigns[campaignId] = campaignAddress;
        founderCampaigns[msg.sender].push(campaignId);
        allCampaigns.push(campaignAddress);
        
        emit CampaignCreated(
            campaignId,
            campaignAddress,
            msg.sender,
            title,
            fundingGoal
        );
        
        return campaignAddress;
    }
    
    /**
     * @notice Get campaign address by ID
     */
    function getCampaign(uint256 campaignId) external view returns (address) {
        return campaigns[campaignId];
    }
    
    /**
     * @notice Get all campaigns created by a founder
     */
    function getFounderCampaigns(address founder) external view returns (uint256[] memory) {
        return founderCampaigns[founder];
    }
    
    /**
     * @notice Get all campaign addresses
     */
    function getAllCampaigns() external view returns (address[] memory) {
        return allCampaigns;
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
        uint256 totalCampaigns,
        uint256 currentCreationFee
    ) {
        return (campaignCount, creationFee);
    }
    
    // Allow contract to receive ETH
    receive() external payable {}
}
