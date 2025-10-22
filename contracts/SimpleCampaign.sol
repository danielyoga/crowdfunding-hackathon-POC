// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title SimpleCampaign
 * @notice Simplified milestone-based crowdfunding campaign
 * @dev Core features: funding, milestones, and fund release
 */
contract SimpleCampaign is Ownable, ReentrancyGuard {
    
    // Enums
    enum CampaignState { Funding, Development, Completed, Failed }
    enum MilestoneState { Pending, Submitted, Completed }
    
    // Structs
    struct CampaignData {
        string title;
        string description;
        address founder;
        uint256 fundingGoal;
        uint256 totalRaised;
        CampaignState state;
        uint256 createdAt;
    }
    
    struct Milestone {
        string description;
        uint256 releasePercentage; // % of total raised (in basis points)
        MilestoneState state;
    }
    
    // State variables
    CampaignData public campaignData;
    Milestone[3] public milestones; // Simplified to 3 milestones
    uint256 public currentMilestone;
    
    // Mappings
    mapping(address => uint256) public contributions;
    address[] public contributors;
    
    // Events
    event FundReceived(address indexed contributor, uint256 amount);
    event FundingCompleted();
    event DevelopmentStarted();
    event MilestoneSubmitted(uint256 indexed milestoneId);
    event MilestoneCompleted(uint256 indexed milestoneId, uint256 fundsReleased);
    event CampaignCompleted();
    event CampaignFailed();
    
    // Custom errors
    error InvalidState();
    error InvalidMilestone();
    error MilestoneNotPending();
    error OnlyFounder();
    error FundingGoalNotReached();
    error FundingGoalReached();
    error InsufficientFunds();
    
    modifier onlyFounder() {
        if (msg.sender != campaignData.founder) revert OnlyFounder();
        _;
    }
    
    modifier inState(CampaignState _state) {
        if (campaignData.state != _state) revert InvalidState();
        _;
    }
    
    constructor(
        address _founder,
        string memory _title,
        string memory _description,
        uint256 _fundingGoal,
        string[3] memory _milestoneDescriptions,
        uint256[3] memory _milestonePercentages
    ) Ownable(_founder) {
        campaignData = CampaignData({
            title: _title,
            description: _description,
            founder: _founder,
            fundingGoal: _fundingGoal,
            totalRaised: 0,
            state: CampaignState.Funding,
            createdAt: block.timestamp
        });
        
        // Initialize 3 milestones
        for (uint256 i = 0; i < 3; i++) {
            milestones[i] = Milestone({
                description: _milestoneDescriptions[i],
                releasePercentage: _milestonePercentages[i],
                state: MilestoneState.Pending
            });
        }
    }
    
    /**
     * @notice Fund the campaign (only during Funding stage)
     */
    function fund() external payable nonReentrant inState(CampaignState.Funding) {
        require(msg.value > 0, "Must send ETH");
        
        // Check if funding goal would be exceeded
        if (campaignData.totalRaised + msg.value > campaignData.fundingGoal) {
            revert FundingGoalReached();
        }
        
        // Track new contributors
        if (contributions[msg.sender] == 0) {
            contributors.push(msg.sender);
        }
        
        contributions[msg.sender] += msg.value;
        campaignData.totalRaised += msg.value;
        
        emit FundReceived(msg.sender, msg.value);
        
        // Auto-transition to Development if funding goal reached
        if (campaignData.totalRaised >= campaignData.fundingGoal) {
            campaignData.state = CampaignState.Development;
            emit FundingCompleted();
            emit DevelopmentStarted();
        }
    }
    
    /**
     * @notice Start development phase (founder only, when funding goal is reached)
     */
    function startDevelopment() external onlyFounder inState(CampaignState.Funding) {
        if (campaignData.totalRaised < campaignData.fundingGoal) {
            revert FundingGoalNotReached();
        }
        
        campaignData.state = CampaignState.Development;
        emit FundingCompleted();
        emit DevelopmentStarted();
    }
    
    /**
     * @notice Submit a milestone for review (founder only)
     */
    function submitMilestone(uint256 milestoneId) external onlyFounder inState(CampaignState.Development) {
        if (milestoneId != currentMilestone) revert InvalidMilestone();
        if (milestones[milestoneId].state != MilestoneState.Pending) revert MilestoneNotPending();
        
        // Mark milestone as submitted
        milestones[milestoneId].state = MilestoneState.Submitted;
        emit MilestoneSubmitted(milestoneId);
    }
    
    /**
     * @notice Complete a milestone (founder only, after submission)
     * @dev For now, founder can complete directly. In production, this would require voting/approval
     */
    function completeMilestone(uint256 milestoneId) external onlyFounder inState(CampaignState.Development) {
        if (milestoneId != currentMilestone) revert InvalidMilestone();
        
        // Milestone must be either Submitted or Pending (allowing direct completion for simplified flow)
        if (milestones[milestoneId].state != MilestoneState.Submitted && 
            milestones[milestoneId].state != MilestoneState.Pending) {
            revert MilestoneNotPending();
        }
        
        // Mark milestone as completed
        milestones[milestoneId].state = MilestoneState.Completed;
        
        // Calculate and release funds
        uint256 releaseAmount = (campaignData.totalRaised * milestones[milestoneId].releasePercentage) / 10000;
        
        if (releaseAmount > 0) {
            (bool success, ) = payable(campaignData.founder).call{value: releaseAmount}("");
            require(success, "Fund transfer failed");
            
            emit MilestoneCompleted(milestoneId, releaseAmount);
        }
        
        // Move to next milestone
        currentMilestone++;
        
        // Check if all milestones completed
        if (currentMilestone >= 3) {
            campaignData.state = CampaignState.Completed;
            emit CampaignCompleted();
        }
    }
    
    /**
     * @notice Fail the campaign and allow refunds
     * @dev Can be called during Funding or Development phase
     */
    function failCampaign() external onlyFounder {
        if (campaignData.state == CampaignState.Completed || campaignData.state == CampaignState.Failed) {
            revert InvalidState();
        }
        
        campaignData.state = CampaignState.Failed;
        emit CampaignFailed();
    }
    
    /**
     * @notice Claim refund (contributors only, when campaign failed)
     */
    function claimRefund() external nonReentrant {
        require(campaignData.state == CampaignState.Failed, "Campaign not failed");
        require(contributions[msg.sender] > 0, "No contribution to refund");
        
        // Calculate refund based on unreleased funds
        uint256 totalContribution = contributions[msg.sender];
        uint256 totalReleased = 0;
        
        // Calculate how much has been released so far
        for (uint256 i = 0; i < currentMilestone; i++) {
            if (milestones[i].state == MilestoneState.Completed) {
                totalReleased += (totalContribution * milestones[i].releasePercentage) / 10000;
            }
        }
        
        uint256 refundAmount = totalContribution - totalReleased;
        contributions[msg.sender] = 0;
        
        if (refundAmount > 0) {
            (bool success, ) = payable(msg.sender).call{value: refundAmount}("");
            require(success, "Refund transfer failed");
        }
    }
    
    // View functions
    function getCampaignData() external view returns (CampaignData memory) {
        return campaignData;
    }
    
    function getMilestone(uint256 milestoneId) external view returns (Milestone memory) {
        return milestones[milestoneId];
    }
    
    function getContributors() external view returns (address[] memory) {
        return contributors;
    }
    
    function getContribution(address contributor) external view returns (uint256) {
        return contributions[contributor];
    }
}
