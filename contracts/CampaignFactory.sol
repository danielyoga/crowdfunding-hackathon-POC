// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "./Campaign.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title CampaignFactory
 * @notice Factory contract for deploying milestone-based crowdfunding campaigns
 * @dev Creates and tracks all crowdfunding campaigns on the platform
 */
contract CampaignFactory is Ownable, ReentrancyGuard {
    
    // State variables
    uint256 public campaignCount;
    uint256 public platformFeePercentage = 200; // 2% in basis points (200/10000)
    uint256 public constant MAX_PLATFORM_FEE = 500; // 5% maximum
    uint256 public campaignCreationFee = 0.01 ether; // Fee to create a campaign
    
    // Mappings
    mapping(uint256 => address) public campaigns;
    mapping(address => uint256[]) public founderCampaigns;
    mapping(address => bool) public activeCampaigns;
    
    // Arrays for enumeration
    address[] public allCampaigns;
    
    // Events
    event CampaignCreated(
        uint256 indexed campaignId,
        address indexed campaignAddress,
        address indexed founder,
        string title,
        uint256 fundingGoal,
        uint256 createdAt
    );
    
    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);
    event CreationFeeUpdated(uint256 oldFee, uint256 newFee);
    event FeesWithdrawn(address indexed to, uint256 amount);
    
    // Custom errors
    error InsufficientCreationFee();
    error InvalidFundingGoal();
    error InvalidMilestoneCount();
    error InvalidPlatformFee();
    error CampaignCreationFailed();
    error NoFeesToWithdraw();
    
    constructor(address initialOwner) Ownable(initialOwner) {}
    
    /**
     * @notice Create a new crowdfunding campaign
     * @param title Campaign title
     * @param description Campaign description
     * @param fundingGoal Target funding amount in wei
     * @param milestoneDescriptions Array of milestone descriptions (must be 5)
     * @param milestoneDeadlines Array of milestone deadlines in days from campaign start
     * @param milestonePercentages Array of fund release percentages for each milestone
     * @return campaignAddress Address of the newly created campaign
     */
    function createCampaign(
        string calldata title,
        string calldata description,
        uint256 fundingGoal,
        string[5] calldata milestoneDescriptions,
        uint256[5] calldata milestoneDeadlines,
        uint256[5] calldata milestonePercentages
    ) external payable nonReentrant returns (address campaignAddress) {
        
        // Validate creation fee
        if (msg.value < campaignCreationFee) {
            revert InsufficientCreationFee();
        }
        
        // Validate funding goal
        if (fundingGoal == 0) {
            revert InvalidFundingGoal();
        }
        
        // Validate milestone percentages sum to 100%
        uint256 totalPercentage = 0;
        for (uint256 i = 0; i < 5; i++) {
            totalPercentage += milestonePercentages[i];
        }
        if (totalPercentage != 10000) { // 100% in basis points
            revert InvalidMilestoneCount();
        }
        
        // Create new campaign
        Campaign newCampaign = new Campaign(
            msg.sender,
            title,
            description,
            fundingGoal,
            milestoneDescriptions,
            milestoneDeadlines,
            milestonePercentages,
            platformFeePercentage
        );
        
        campaignAddress = address(newCampaign);
        
        if (campaignAddress == address(0)) {
            revert CampaignCreationFailed();
        }
        
        // Update state
        uint256 campaignId = campaignCount++;
        campaigns[campaignId] = campaignAddress;
        founderCampaigns[msg.sender].push(campaignId);
        activeCampaigns[campaignAddress] = true;
        allCampaigns.push(campaignAddress);
        
        emit CampaignCreated(
            campaignId,
            campaignAddress,
            msg.sender,
            title,
            fundingGoal,
            block.timestamp
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
     * @notice Get all active campaign addresses
     */
    function getAllActiveCampaigns() external view returns (address[] memory activeCampaignsList) {
        uint256 activeCount = 0;
        
        // Count active campaigns
        for (uint256 i = 0; i < allCampaigns.length; i++) {
            if (activeCampaigns[allCampaigns[i]]) {
                activeCount++;
            }
        }
        
        // Create array of active campaigns
        activeCampaignsList = new address[](activeCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < allCampaigns.length; i++) {
            if (activeCampaigns[allCampaigns[i]]) {
                activeCampaignsList[index] = allCampaigns[i];
                index++;
            }
        }
        
        return activeCampaignsList;
    }
    
    /**
     * @notice Get all campaign addresses (active and inactive)
     */
    function getAllCampaigns() external view returns (address[] memory) {
        return allCampaigns;
    }
    
    /**
     * @notice Mark a campaign as inactive (called by campaign when it ends)
     */
    function markCampaignInactive(address campaignAddress) external {
        require(activeCampaigns[campaignAddress], "Campaign not active");
        require(msg.sender == campaignAddress, "Only campaign can call this");
        
        activeCampaigns[campaignAddress] = false;
    }
    
    /**
     * @notice Update platform fee percentage (owner only)
     */
    function updatePlatformFee(uint256 newFeePercentage) external onlyOwner {
        if (newFeePercentage > MAX_PLATFORM_FEE) {
            revert InvalidPlatformFee();
        }
        
        uint256 oldFee = platformFeePercentage;
        platformFeePercentage = newFeePercentage;
        
        emit PlatformFeeUpdated(oldFee, newFeePercentage);
    }
    
    /**
     * @notice Update campaign creation fee (owner only)
     */
    function updateCreationFee(uint256 newCreationFee) external onlyOwner {
        uint256 oldFee = campaignCreationFee;
        campaignCreationFee = newCreationFee;
        
        emit CreationFeeUpdated(oldFee, newCreationFee);
    }
    
    /**
     * @notice Withdraw accumulated fees (owner only)
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        if (balance == 0) {
            revert NoFeesToWithdraw();
        }
        
        payable(owner()).transfer(balance);
        emit FeesWithdrawn(owner(), balance);
    }
    
    /**
     * @notice Get platform statistics
     */
    function getPlatformStats() external view returns (
        uint256 totalCampaigns,
        uint256 activeCampaignsCount,
        uint256 currentPlatformFee,
        uint256 currentCreationFee
    ) {
        uint256 activeCount = 0;
        for (uint256 i = 0; i < allCampaigns.length; i++) {
            if (activeCampaigns[allCampaigns[i]]) {
                activeCount++;
            }
        }
        
        return (
            campaignCount,
            activeCount,
            platformFeePercentage,
            campaignCreationFee
        );
    }
    
    /**
     * @notice Check if a campaign is active
     */
    function isCampaignActive(address campaignAddress) external view returns (bool) {
        return activeCampaigns[campaignAddress];
    }
    
    // Allow contract to receive ETH
    receive() external payable {
        // Accept ETH for creation fees
    }
}
