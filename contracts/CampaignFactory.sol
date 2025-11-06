// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./Campaign.sol";

/**
 * @title CampaignFactory
 * @notice Factory contract for deploying IDRX-based crowdfunding campaigns
 * @dev Manages campaign deployment and tracking
 * 
 * Features:
 * - Deploy new Campaign contracts
 * - Track all campaigns globally
 * - Track campaigns by creator
 * - Emergency pause capability
 * - Configurable limits
 */
contract CampaignFactory is Ownable {
    
    // ============ State Variables ============
    
    /// @notice IDRX token address used by all campaigns
    address public immutable idrxToken;
    
    /// @notice Array of all deployed campaign addresses
    Campaign[] public campaigns;
    
    /// @notice Mapping of creator addresses to their campaign contracts
    mapping(address => Campaign[]) public campaignsByCreator;
    
    /// @notice Total number of campaigns created
    uint256 public totalCampaigns;
    
    /// @notice Maximum campaign duration (365 days)
    uint256 public constant MAX_DURATION = 365 days;
    
    /// @notice Minimum funding goal (1,000 IDRX)
    uint256 public constant MIN_GOAL = 1_000 * 10**18;
    
    /// @notice Maximum funding goal (1 billion IDRX)
    uint256 public constant MAX_GOAL = 1_000_000_000 * 10**18;
    
    /// @notice Platform fee percentage (in basis points, 0 = 0%, 100 = 1%)
    uint256 public platformFee = 0; // 0% for MVP, can be updated
    
    /// @notice Accumulated platform fees
    uint256 public accumulatedFees;
    
    // ============ Events ============
    
    /**
     * @notice Emitted when a new campaign is created
     * @param campaign Address of the deployed campaign contract
     * @param creator Address of the campaign creator
     * @param title Campaign title
     * @param goal Funding goal in IDRX wei
     * @param deadline Campaign deadline (Unix timestamp)
     * @param campaignId Sequential campaign ID
     */
    event CampaignCreated(
        address indexed campaign,
        address indexed creator,
        string title,
        uint256 goal,
        uint256 deadline,
        uint256 indexed campaignId
    );
    
    /**
     * @notice Emitted when a campaign is paused
     * @param campaign Address of the paused campaign
     */
    event CampaignPaused(address indexed campaign);
    
    /**
     * @notice Emitted when a campaign is unpaused
     * @param campaign Address of the unpaused campaign
     */
    event CampaignUnpaused(address indexed campaign);
    
    /**
     * @notice Emitted when platform fee is updated
     * @param oldFee Previous fee in basis points
     * @param newFee New fee in basis points
     */
    event PlatformFeeUpdated(uint256 oldFee, uint256 newFee);
    
    /**
     * @notice Emitted when platform fees are withdrawn
     * @param recipient Address receiving the fees
     * @param amount Amount withdrawn in IDRX wei
     */
    event FeesWithdrawn(address indexed recipient, uint256 amount);
    
    // ============ Constructor ============
    
    /**
     * @notice Initialize the campaign factory
     * @param _idrxToken Address of IDRX token contract
     */
    constructor(address _idrxToken) Ownable(msg.sender) {
        require(_idrxToken != address(0), "Factory: Invalid IDRX address");
        idrxToken = _idrxToken;
    }
    
    // ============ External Functions ============
    
    /**
     * @notice Create a new crowdfunding campaign
     * @param _title Campaign title (1-100 characters)
     * @param _description Campaign description (max 1000 characters)
     * @param _goal Funding goal in IDRX wei
     * @param _duration Campaign duration in seconds
     * @return campaignAddress Address of the deployed campaign
     */
    function createCampaign(
        string memory _title,
        string memory _description,
        uint256 _goal,
        uint256 _duration
    ) external returns (address campaignAddress) {
        // Validation
        require(bytes(_title).length > 0, "Factory: Title required");
        require(bytes(_title).length <= 100, "Factory: Title too long");
        require(bytes(_description).length <= 1000, "Factory: Description too long");
        require(_goal >= MIN_GOAL, "Factory: Goal too low");
        require(_goal <= MAX_GOAL, "Factory: Goal too high");
        require(_duration > 0, "Factory: Duration must be positive");
        require(_duration <= MAX_DURATION, "Factory: Duration too long");
        
        // Deploy new campaign
        Campaign newCampaign = new Campaign(
            idrxToken,
            msg.sender,
            _title,
            _description,
            _goal,
            _duration
        );
        
        // Track campaign
        campaigns.push(newCampaign);
        campaignsByCreator[msg.sender].push(newCampaign);
        uint256 campaignId = totalCampaigns;
        totalCampaigns++;
        
        // Emit event
        emit CampaignCreated(
            address(newCampaign),
            msg.sender,
            _title,
            _goal,
            block.timestamp + _duration,
            campaignId
        );
        
        return address(newCampaign);
    }
    
    /**
     * @notice Emergency pause a specific campaign (owner only)
     * @param _campaign Address of the campaign to pause
     */
    function pauseCampaign(address _campaign) external onlyOwner {
        require(_campaign != address(0), "Factory: Invalid campaign");
        Campaign campaign = Campaign(_campaign);
        campaign.pause();
        emit CampaignPaused(_campaign);
    }
    
    /**
     * @notice Unpause a specific campaign (owner only)
     * @param _campaign Address of the campaign to unpause
     */
    function unpauseCampaign(address _campaign) external onlyOwner {
        require(_campaign != address(0), "Factory: Invalid campaign");
        Campaign campaign = Campaign(_campaign);
        campaign.unpause();
        emit CampaignUnpaused(_campaign);
    }
    
    /**
     * @notice Update platform fee percentage (owner only)
     * @param _newFee New fee in basis points (100 = 1%, max 1000 = 10%)
     */
    function updatePlatformFee(uint256 _newFee) external onlyOwner {
        require(_newFee <= 1000, "Factory: Fee too high"); // Max 10%
        uint256 oldFee = platformFee;
        platformFee = _newFee;
        emit PlatformFeeUpdated(oldFee, _newFee);
    }
    
    /**
     * @notice Withdraw accumulated platform fees (owner only)
     * @param _recipient Address to receive the fees
     */
    function withdrawFees(address _recipient) external onlyOwner {
        require(_recipient != address(0), "Factory: Invalid recipient");
        require(accumulatedFees > 0, "Factory: No fees to withdraw");
        
        uint256 amount = accumulatedFees;
        accumulatedFees = 0;
        
        IIDRX token = IIDRX(idrxToken);
        require(token.transfer(_recipient, amount), "Factory: Transfer failed");
        
        emit FeesWithdrawn(_recipient, amount);
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Get all campaign addresses
     * @return Array of all campaign contract addresses
     */
    function getAllCampaigns() external view returns (Campaign[] memory) {
        return campaigns;
    }
    
    /**
     * @notice Get campaigns created by a specific address
     * @param _creator Address of the creator
     * @return Array of campaign addresses created by this address
     */
    function getCampaignsByCreator(address _creator) 
        external 
        view 
        returns (Campaign[] memory) 
    {
        return campaignsByCreator[_creator];
    }
    
    /**
     * @notice Get total number of campaigns
     * @return Total campaign count
     */
    function getCampaignCount() external view returns (uint256) {
        return totalCampaigns;
    }
    
    /**
     * @notice Get campaign at specific index
     * @param _index Index in the campaigns array
     * @return Campaign address at the specified index
     */
    function getCampaignAt(uint256 _index) external view returns (address) {
        require(_index < campaigns.length, "Factory: Index out of bounds");
        return address(campaigns[_index]);
    }
    
    /**
     * @notice Get number of campaigns created by a specific address
     * @param _creator Address of the creator
     * @return Number of campaigns created by this address
     */
    function getCreatorCampaignCount(address _creator) 
        external 
        view 
        returns (uint256) 
    {
        return campaignsByCreator[_creator].length;
    }
    
    /**
     * @notice Get active campaigns (for frontend filtering)
     * @return Array of active campaign addresses
     * @dev This function may be gas-intensive for large numbers of campaigns
     */
    function getActiveCampaigns() external view returns (address[] memory) {
        uint256 activeCount = 0;
        
        // First pass: count active campaigns
        for (uint256 i = 0; i < campaigns.length; i++) {
            Campaign campaign = campaigns[i];
            if (campaign.state() == Campaign.State.Active) {
                activeCount++;
            }
        }
        
        // Second pass: populate array
        address[] memory activeCampaigns = new address[](activeCount);
        uint256 currentIndex = 0;
        
        for (uint256 i = 0; i < campaigns.length; i++) {
            Campaign campaign = campaigns[i];
            if (campaign.state() == Campaign.State.Active) {
                activeCampaigns[currentIndex] = address(campaign);
                currentIndex++;
            }
        }
        
        return activeCampaigns;
    }
    
    /**
     * @notice Get factory configuration
     * @return _idrxToken IDRX token address
     * @return _minGoal Minimum funding goal
     * @return _maxGoal Maximum funding goal
     * @return _maxDuration Maximum campaign duration
     * @return _platformFee Platform fee in basis points
     * @return _totalCampaigns Total campaigns created
     */
    function getConfig() external view returns (
        address _idrxToken,
        uint256 _minGoal,
        uint256 _maxGoal,
        uint256 _maxDuration,
        uint256 _platformFee,
        uint256 _totalCampaigns
    ) {
        return (
            idrxToken,
            MIN_GOAL,
            MAX_GOAL,
            MAX_DURATION,
            platformFee,
            totalCampaigns
        );
    }
}

