// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title Campaign
 * @notice Individual milestone-based crowdfunding campaign contract
 * @dev Manages funding, milestones, voting, and fund distribution with user-defined risk profiles
 */
contract Campaign is Ownable, ReentrancyGuard, Pausable {
    
    // Enums
    enum CampaignState { Active, Completed, Failed, Cancelled }
    enum MilestoneState { Pending, Submitted, Voting, Approved, Rejected, Completed }
    enum RiskProfile { Conservative, Balanced, Aggressive } // 50/50, 70/30, 90/10
    
    // Structs
    struct CampaignData {
        string title;
        string description;
        address founder;
        uint256 fundingGoal;
        uint256 totalRaised;
        uint256 totalCommittedPool;    // Sum of all funders' committed amounts
        uint256 totalReservePool;      // Sum of all funders' reserve amounts
        uint8 currentMilestone;        // 0-4 (5 milestones)
        CampaignState state;
        uint256 createdAt;
        uint256 platformFeePercentage;
    }
    
    struct Milestone {
        string description;
        uint256 releasePercentage;     // % of committed pool (in basis points)
        uint256 deadline;              // Days from campaign creation
        MilestoneState state;
        uint256 votingDeadline;
        uint256 yesVotes;
        uint256 noVotes;
        uint256 totalVotingPower;
        string evidenceIPFS;
        uint8 rejectionCount;          // Track resubmissions (max 1)
        uint256 submittedAt;
    }
    
    struct Funder {
        uint256 totalContribution;
        uint256 committedAmount;       // User-chosen % (50-90%)
        uint256 reserveAmount;         // User-chosen % (10-50%)
        RiskProfile riskProfile;       // Locked at funding time
        bool[5] hasVoted;              // Voted per milestone
        uint8 missedVotes;             // Track consecutive non-votes
        bool isAutoYes;                // Flagged for auto-YES after 2 misses
        bool hasRefunded;
        uint256 fundedAt;
    }
    
    // State variables
    CampaignData public campaignData;
    Milestone[5] public milestones;
    
    // Mappings
    mapping(address => Funder) public funders;
    mapping(uint256 => mapping(address => bool)) public hasVotedOnMilestone;
    address[] public fundersList;
    
    // Constants
    uint256 public constant VOTING_PERIOD = 7 days;
    uint256 public constant APPROVAL_THRESHOLD = 6000; // 60% in basis points
    uint256 public constant MAX_WHALE_POWER = 2000;    // 20% max voting power per funder
    
    // Events
    event FundReceived(
        address indexed funder,
        uint256 amount,
        RiskProfile riskProfile,
        uint256 committedAmount,
        uint256 reserveAmount
    );
    
    event MilestoneSubmitted(
        uint256 indexed milestoneId,
        string evidenceIPFS,
        uint256 votingDeadline
    );
    
    event VoteCast(
        uint256 indexed milestoneId,
        address indexed voter,
        bool support,
        uint256 votingPower
    );
    
    event MilestoneCompleted(
        uint256 indexed milestoneId,
        uint256 fundsReleased,
        uint256 yesVotes,
        uint256 noVotes
    );
    
    event MilestoneRejected(
        uint256 indexed milestoneId,
        uint256 yesVotes,
        uint256 noVotes,
        uint8 rejectionCount
    );
    
    event FundsReleased(
        uint256 indexed milestoneId,
        uint256 amount,
        address indexed founder
    );
    
    event RefundClaimed(
        address indexed funder,
        uint256 refundAmount,
        uint256 originalContribution
    );
    
    event CampaignStateChanged(CampaignState oldState, CampaignState newState);
    
    event EmergencyFailureTriggered(address indexed initiator, uint256 votingDeadline);
    
    // Custom errors
    error CampaignNotActive();
    error InvalidMilestone();
    error MilestoneNotPending();
    error MilestoneNotSubmitted();
    error VotingNotActive();
    error AlreadyVoted();
    error NotFunder();
    error OnlyFounder();
    error InvalidRiskProfile();
    error FundingGoalReached();
    error InsufficientFunds();
    error RefundNotAvailable();
    error AlreadyRefunded();
    error DeadlineNotPassed();
    error VotingStillActive();
    error MaxRejectionsReached();
    error InvalidVotingPower();
    
    modifier onlyFounder() {
        if (msg.sender != campaignData.founder) revert OnlyFounder();
        _;
    }
    
    modifier onlyFunder() {
        if (funders[msg.sender].totalContribution == 0) revert NotFunder();
        _;
    }
    
    modifier campaignActive() {
        if (campaignData.state != CampaignState.Active) revert CampaignNotActive();
        _;
    }
    
    constructor(
        address _founder,
        string memory _title,
        string memory _description,
        uint256 _fundingGoal,
        string[5] memory _milestoneDescriptions,
        uint256[5] memory _milestoneDeadlines,
        uint256[5] memory _milestonePercentages,
        uint256 _platformFeePercentage
    ) Ownable(_founder) {
        campaignData = CampaignData({
            title: _title,
            description: _description,
            founder: _founder,
            fundingGoal: _fundingGoal,
            totalRaised: 0,
            totalCommittedPool: 0,
            totalReservePool: 0,
            currentMilestone: 0,
            state: CampaignState.Active,
            createdAt: block.timestamp,
            platformFeePercentage: _platformFeePercentage
        });
        
        // Initialize milestones
        for (uint256 i = 0; i < 5; i++) {
            milestones[i] = Milestone({
                description: _milestoneDescriptions[i],
                releasePercentage: _milestonePercentages[i],
                deadline: block.timestamp + (_milestoneDeadlines[i] * 1 days),
                state: MilestoneState.Pending,
                votingDeadline: 0,
                yesVotes: 0,
                noVotes: 0,
                totalVotingPower: 0,
                evidenceIPFS: "",
                rejectionCount: 0,
                submittedAt: 0
            });
        }
    }
    
    /**
     * @notice Fund the campaign with chosen risk profile
     * @param riskProfile 0=Conservative(50/50), 1=Balanced(70/30), 2=Aggressive(90/10)
     */
    function fund(RiskProfile riskProfile) external payable nonReentrant campaignActive {
        require(msg.value > 0, "Must send ETH");
        
        if (uint8(riskProfile) > 2) revert InvalidRiskProfile();
        
        // Check if funding goal would be exceeded
        if (campaignData.totalRaised + msg.value > campaignData.fundingGoal) {
            revert FundingGoalReached();
        }
        
        // Calculate split based on risk profile
        uint256 committedPercent;
        if (riskProfile == RiskProfile.Conservative) {
            committedPercent = 5000; // 50%
        } else if (riskProfile == RiskProfile.Balanced) {
            committedPercent = 7000; // 70%
        } else {
            committedPercent = 9000; // 90%
        }
        
        uint256 committedAmount = (msg.value * committedPercent) / 10000;
        uint256 reserveAmount = msg.value - committedAmount;
        
        // Update or create funder record
        if (funders[msg.sender].totalContribution == 0) {
            // New funder
            fundersList.push(msg.sender);
            funders[msg.sender] = Funder({
                totalContribution: msg.value,
                committedAmount: committedAmount,
                reserveAmount: reserveAmount,
                riskProfile: riskProfile,
                hasVoted: [false, false, false, false, false],
                missedVotes: 0,
                isAutoYes: false,
                hasRefunded: false,
                fundedAt: block.timestamp
            });
        } else {
            // Existing funder - must use same risk profile
            require(funders[msg.sender].riskProfile == riskProfile, "Cannot change risk profile");
            
            funders[msg.sender].totalContribution += msg.value;
            funders[msg.sender].committedAmount += committedAmount;
            funders[msg.sender].reserveAmount += reserveAmount;
        }
        
        // Update campaign totals
        campaignData.totalRaised += msg.value;
        campaignData.totalCommittedPool += committedAmount;
        campaignData.totalReservePool += reserveAmount;
        
        emit FundReceived(msg.sender, msg.value, riskProfile, committedAmount, reserveAmount);
    }
    
    /**
     * @notice Submit milestone evidence (founder only)
     */
    function submitMilestone(uint256 milestoneId, string calldata evidenceIPFS) 
        external 
        onlyFounder 
        campaignActive 
    {
        if (milestoneId != campaignData.currentMilestone) revert InvalidMilestone();
        if (milestones[milestoneId].state != MilestoneState.Pending) revert MilestoneNotPending();
        
        // Check deadline
        if (block.timestamp > milestones[milestoneId].deadline) {
            _failCampaign();
            return;
        }
        
        // Update milestone
        milestones[milestoneId].state = MilestoneState.Voting;
        milestones[milestoneId].evidenceIPFS = evidenceIPFS;
        milestones[milestoneId].votingDeadline = block.timestamp + VOTING_PERIOD;
        milestones[milestoneId].submittedAt = block.timestamp;
        
        // Reset voting data
        milestones[milestoneId].yesVotes = 0;
        milestones[milestoneId].noVotes = 0;
        milestones[milestoneId].totalVotingPower = 0;
        
        // Reset all funders' voting status for this milestone
        for (uint256 i = 0; i < fundersList.length; i++) {
            hasVotedOnMilestone[milestoneId][fundersList[i]] = false;
        }
        
        emit MilestoneSubmitted(milestoneId, evidenceIPFS, milestones[milestoneId].votingDeadline);
    }
    
    /**
     * @notice Vote on milestone (funders only)
     */
    function vote(uint256 milestoneId, bool support) external onlyFunder campaignActive {
        if (milestones[milestoneId].state != MilestoneState.Voting) revert VotingNotActive();
        if (hasVotedOnMilestone[milestoneId][msg.sender]) revert AlreadyVoted();
        if (block.timestamp > milestones[milestoneId].votingDeadline) {
            _finalizeMilestone(milestoneId);
            return;
        }
        
        // Calculate voting power (capped at MAX_WHALE_POWER)
        uint256 votingPower = funders[msg.sender].totalContribution;
        uint256 maxAllowedPower = (campaignData.totalRaised * MAX_WHALE_POWER) / 10000;
        if (votingPower > maxAllowedPower) {
            votingPower = maxAllowedPower;
        }
        
        // Record vote
        hasVotedOnMilestone[milestoneId][msg.sender] = true;
        funders[msg.sender].hasVoted[milestoneId] = true;
        funders[msg.sender].missedVotes = 0; // Reset missed votes counter
        
        if (support) {
            milestones[milestoneId].yesVotes += votingPower;
        } else {
            milestones[milestoneId].noVotes += votingPower;
        }
        
        milestones[milestoneId].totalVotingPower += votingPower;
        
        emit VoteCast(milestoneId, msg.sender, support, votingPower);
    }
    
    /**
     * @notice Finalize milestone voting
     */
    function finalizeMilestone(uint256 milestoneId) external campaignActive {
        if (milestones[milestoneId].state != MilestoneState.Voting) revert VotingNotActive();
        if (block.timestamp <= milestones[milestoneId].votingDeadline) revert VotingStillActive();
        
        _finalizeMilestone(milestoneId);
    }
    
    /**
     * @notice Internal function to finalize milestone
     */
    function _finalizeMilestone(uint256 milestoneId) internal {
        // Process non-voters
        for (uint256 i = 0; i < fundersList.length; i++) {
            address funder = fundersList[i];
            if (!funders[funder].hasVoted[milestoneId]) {
                funders[funder].missedVotes++;
                
                // Auto-YES for chronic non-voters
                if (funders[funder].missedVotes >= 2) {
                    funders[funder].isAutoYes = true;
                    
                    // Calculate their voting power and add as YES vote
                    uint256 votingPower = funders[funder].totalContribution;
                    uint256 maxAllowedPower = (campaignData.totalRaised * MAX_WHALE_POWER) / 10000;
                    if (votingPower > maxAllowedPower) {
                        votingPower = maxAllowedPower;
                    }
                    
                    milestones[milestoneId].yesVotes += votingPower;
                    milestones[milestoneId].totalVotingPower += votingPower;
                }
            }
        }
        
        // Calculate approval percentage
        uint256 totalVotes = milestones[milestoneId].yesVotes + milestones[milestoneId].noVotes;
        bool approved = false;
        
        if (totalVotes > 0) {
            uint256 approvalPercentage = (milestones[milestoneId].yesVotes * 10000) / totalVotes;
            approved = approvalPercentage >= APPROVAL_THRESHOLD;
        }
        
        if (approved) {
            // Milestone approved
            milestones[milestoneId].state = MilestoneState.Approved;
            _releaseFunds(milestoneId);
            
            emit MilestoneCompleted(
                milestoneId,
                _calculateReleaseAmount(milestoneId),
                milestones[milestoneId].yesVotes,
                milestones[milestoneId].noVotes
            );
            
            // Move to next milestone or complete campaign
            if (milestoneId == 4) {
                // All milestones completed
                campaignData.state = CampaignState.Completed;
                _releaseReserves();
                emit CampaignStateChanged(CampaignState.Active, CampaignState.Completed);
            } else {
                campaignData.currentMilestone++;
            }
        } else {
            // Milestone rejected
            milestones[milestoneId].state = MilestoneState.Rejected;
            milestones[milestoneId].rejectionCount++;
            
            emit MilestoneRejected(
                milestoneId,
                milestones[milestoneId].yesVotes,
                milestones[milestoneId].noVotes,
                milestones[milestoneId].rejectionCount
            );
            
            // Check if this was the second rejection
            if (milestones[milestoneId].rejectionCount >= 2) {
                _failCampaign();
            } else {
                // Allow resubmission
                milestones[milestoneId].state = MilestoneState.Pending;
            }
        }
    }
    
    /**
     * @notice Calculate fund release amount for milestone
     */
    function _calculateReleaseAmount(uint256 milestoneId) internal view returns (uint256) {
        return (campaignData.totalCommittedPool * milestones[milestoneId].releasePercentage) / 10000;
    }
    
    /**
     * @notice Release funds to founder
     */
    function _releaseFunds(uint256 milestoneId) internal {
        uint256 releaseAmount = _calculateReleaseAmount(milestoneId);
        
        if (releaseAmount > 0) {
            payable(campaignData.founder).transfer(releaseAmount);
            emit FundsReleased(milestoneId, releaseAmount, campaignData.founder);
        }
        
        milestones[milestoneId].state = MilestoneState.Completed;
    }
    
    /**
     * @notice Release all reserve funds to founder (called when campaign completes)
     */
    function _releaseReserves() internal {
        if (campaignData.totalReservePool > 0) {
            payable(campaignData.founder).transfer(campaignData.totalReservePool);
        }
    }
    
    /**
     * @notice Fail the campaign
     */
    function _failCampaign() internal {
        CampaignState oldState = campaignData.state;
        campaignData.state = CampaignState.Failed;
        emit CampaignStateChanged(oldState, CampaignState.Failed);
    }
    
    /**
     * @notice Claim refund (funders only, when campaign failed)
     */
    function claimRefund() external nonReentrant onlyFunder {
        if (campaignData.state != CampaignState.Failed) revert RefundNotAvailable();
        if (funders[msg.sender].hasRefunded) revert AlreadyRefunded();
        
        Funder storage funder = funders[msg.sender];
        
        // Calculate refund based on funder's risk profile
        uint256 refundAmount = _calculateRefund(msg.sender);
        
        if (refundAmount == 0) revert InsufficientFunds();
        
        // Mark as refunded
        funder.hasRefunded = true;
        
        // Transfer refund
        payable(msg.sender).transfer(refundAmount);
        
        emit RefundClaimed(msg.sender, refundAmount, funder.totalContribution);
    }
    
    /**
     * @notice Calculate refund amount for a funder
     */
    function _calculateRefund(address funderAddress) internal view returns (uint256) {
        Funder memory funder = funders[funderAddress];
        
        // Calculate unreleased committed capital
        uint256 unreleasedCommitted = funder.committedAmount;
        for (uint256 i = 0; i < campaignData.currentMilestone; i++) {
            if (milestones[i].state == MilestoneState.Completed) {
                uint256 released = (funder.committedAmount * milestones[i].releasePercentage) / 10000;
                unreleasedCommitted -= released;
            }
        }
        
        // Total refund = unreleased committed + full reserve - platform fee
        uint256 totalRefund = unreleasedCommitted + funder.reserveAmount;
        uint256 platformFee = (totalRefund * campaignData.platformFeePercentage) / 10000;
        
        return totalRefund - platformFee;
    }
    
    /**
     * @notice Emergency failure vote (funders can trigger)
     */
    function triggerEmergencyFailure() external onlyFunder {
        // Implementation for emergency failure voting
        // This would require a separate voting mechanism
        emit EmergencyFailureTriggered(msg.sender, block.timestamp + VOTING_PERIOD);
    }
    
    // View functions
    function getCampaignData() external view returns (CampaignData memory) {
        return campaignData;
    }
    
    function getMilestone(uint256 milestoneId) external view returns (Milestone memory) {
        return milestones[milestoneId];
    }
    
    function getFunder(address funderAddress) external view returns (Funder memory) {
        return funders[funderAddress];
    }
    
    function getFundersList() external view returns (address[] memory) {
        return fundersList;
    }
    
    function getRefundAmount(address funderAddress) external view returns (uint256) {
        if (campaignData.state != CampaignState.Failed) return 0;
        return _calculateRefund(funderAddress);
    }
    
    function getCurrentMilestoneInfo() external view returns (
        uint256 milestoneId,
        string memory description,
        MilestoneState state,
        uint256 deadline,
        uint256 votingDeadline
    ) {
        uint256 current = campaignData.currentMilestone;
        return (
            current,
            milestones[current].description,
            milestones[current].state,
            milestones[current].deadline,
            milestones[current].votingDeadline
        );
    }
}


