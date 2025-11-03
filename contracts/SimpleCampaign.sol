// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title SimpleProject
 * @notice Simplified milestone-based crowdfunding project
 * @dev Core features: funding, milestones, and fund release
 */
contract SimpleProject is Ownable, ReentrancyGuard {
    
    // Enums
    enum ProjectState { Funding, Development, Completed, Failed }
    enum MilestoneState { Pending, Submitted, Completed }
    
    // Structs
    struct ProjectData {
        string title;
        string description;
        address founder;
        uint256 fundingGoal;
        uint256 totalRaised;
        ProjectState state;
        uint256 createdAt;
    }
    
    struct Milestone {
        string description;
        uint256 releasePercentage; // % of total raised (in basis points)
        MilestoneState state;
        uint256 submittedAt; // Timestamp when milestone was submitted
        uint256 votingDeadline; // Deadline for voting (7 days after submission)
        uint256 yesVotes; // Total contribution amount that voted YES
        uint256 noVotes; // Total contribution amount that voted NO
    }
    
    // State variables
    ProjectData public projectData;
    Milestone[3] public milestones; // Simplified to 3 milestones
    uint256 public currentMilestone;
    
    // Mappings
    mapping(address => uint256) public contributions;
    address[] public contributors;
    mapping(uint256 => mapping(address => bool)) public hasVoted; // milestoneId => contributor => hasVoted
    mapping(uint256 => mapping(address => bool)) public voteChoice; // milestoneId => contributor => voteYes
    
    // Constants
    uint256 public constant VOTING_PERIOD = 7 days;
    uint256 public constant APPROVAL_THRESHOLD = 50; // 50% of contributions must vote YES
    
    // Events
    event FundReceived(address indexed contributor, uint256 amount);
    event FundingCompleted();
    event DevelopmentStarted();
    event MilestoneSubmitted(uint256 indexed milestoneId, uint256 votingDeadline);
    event VoteCast(uint256 indexed milestoneId, address indexed voter, bool voteYes, uint256 weight);
    event MilestoneApproved(uint256 indexed milestoneId);
    event MilestoneRejected(uint256 indexed milestoneId);
    event MilestoneCompleted(uint256 indexed milestoneId, uint256 fundsReleased);
    event ProjectCompleted();
    event ProjectFailed();
    
    // Custom errors
    error InvalidState();
    error InvalidMilestone();
    error MilestoneNotPending();
    error MilestoneNotSubmitted();
    error OnlyFounder();
    error OnlyContributor();
    error FundingGoalNotReached();
    error FundingGoalReached();
    error InsufficientFunds();
    error VotingNotActive();
    error VotingStillActive();
    error AlreadyVoted();
    error MilestoneNotApproved();
    
    modifier onlyFounder() {
        if (msg.sender != projectData.founder) revert OnlyFounder();
        _;
    }
    
    modifier inState(ProjectState _state) {
        if (projectData.state != _state) revert InvalidState();
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
        projectData = ProjectData({
            title: _title,
            description: _description,
            founder: _founder,
            fundingGoal: _fundingGoal,
            totalRaised: 0,
            state: ProjectState.Funding,
            createdAt: block.timestamp
        });
        
        // Initialize 3 milestones
        for (uint256 i = 0; i < 3; i++) {
            milestones[i] = Milestone({
                description: _milestoneDescriptions[i],
                releasePercentage: _milestonePercentages[i],
                state: MilestoneState.Pending,
                submittedAt: 0,
                votingDeadline: 0,
                yesVotes: 0,
                noVotes: 0
            });
        }
    }
    
    /**
     * @notice Fund the project (only during Funding stage)
     */
    function fund() external payable nonReentrant inState(ProjectState.Funding) {
        require(msg.value > 0, "Must send ETH");
        
        // Check if funding goal would be exceeded
        if (projectData.totalRaised + msg.value > projectData.fundingGoal) {
            revert FundingGoalReached();
        }
        
        // Track new contributors
        if (contributions[msg.sender] == 0) {
            contributors.push(msg.sender);
        }
        
        contributions[msg.sender] += msg.value;
        projectData.totalRaised += msg.value;
        
        emit FundReceived(msg.sender, msg.value);
        
        // Auto-transition to Development if funding goal reached
        if (projectData.totalRaised >= projectData.fundingGoal) {
            projectData.state = ProjectState.Development;
            emit FundingCompleted();
            emit DevelopmentStarted();
        }
    }
    
    /**
     * @notice Start development phase (founder only, when funding goal is reached)
     */
    function startDevelopment() external onlyFounder inState(ProjectState.Funding) {
        if (projectData.totalRaised < projectData.fundingGoal) {
            revert FundingGoalNotReached();
        }
        
        projectData.state = ProjectState.Development;
        emit FundingCompleted();
        emit DevelopmentStarted();
    }
    
    /**
     * @notice Submit a milestone for review (founder only)
     * @dev Starts a 7-day voting period for investors to validate the submission
     */
    function submitMilestone(uint256 milestoneId) external onlyFounder inState(ProjectState.Development) {
        if (milestoneId != currentMilestone) revert InvalidMilestone();
        if (milestones[milestoneId].state != MilestoneState.Pending) revert MilestoneNotPending();
        
        // Mark milestone as submitted and set voting deadline
        milestones[milestoneId].state = MilestoneState.Submitted;
        milestones[milestoneId].submittedAt = block.timestamp;
        milestones[milestoneId].votingDeadline = block.timestamp + VOTING_PERIOD;
        
        emit MilestoneSubmitted(milestoneId, milestones[milestoneId].votingDeadline);
    }
    
    /**
     * @notice Vote on a submitted milestone (contributors only)
     * @param milestoneId The milestone to vote on
     * @param voteYes True for YES, false for NO
     * @dev Each contributor's vote is weighted by their contribution amount
     */
    function vote(uint256 milestoneId, bool voteYes) external inState(ProjectState.Development) {
        // Only contributors can vote
        if (contributions[msg.sender] == 0) revert OnlyContributor();
        
        // Milestone must be in Submitted state
        if (milestones[milestoneId].state != MilestoneState.Submitted) revert MilestoneNotSubmitted();
        
        // Voting must be active
        if (block.timestamp > milestones[milestoneId].votingDeadline) revert VotingNotActive();
        
        // Can only vote once
        if (hasVoted[milestoneId][msg.sender]) revert AlreadyVoted();
        
        // Record the vote
        hasVoted[milestoneId][msg.sender] = true;
        voteChoice[milestoneId][msg.sender] = voteYes;
        
        // Add vote weight based on contribution
        uint256 voteWeight = contributions[msg.sender];
        if (voteYes) {
            milestones[milestoneId].yesVotes += voteWeight;
        } else {
            milestones[milestoneId].noVotes += voteWeight;
        }
        
        emit VoteCast(milestoneId, msg.sender, voteYes, voteWeight);
        
        // Check if voting passed early (more than 50% YES votes)
        if (milestones[milestoneId].yesVotes * 100 > projectData.totalRaised * APPROVAL_THRESHOLD) {
            emit MilestoneApproved(milestoneId);
        }
    }
    
    /**
     * @notice Finalize voting and complete milestone if approved (founder only)
     * @param milestoneId The milestone to finalize
     * @dev Can only be called after voting deadline. Requires majority approval.
     */
    function finalizeVoting(uint256 milestoneId) external onlyFounder inState(ProjectState.Development) {
        if (milestoneId != currentMilestone) revert InvalidMilestone();
        if (milestones[milestoneId].state != MilestoneState.Submitted) revert MilestoneNotSubmitted();
        
        // Voting period must be over
        if (block.timestamp <= milestones[milestoneId].votingDeadline) revert VotingStillActive();
        
        uint256 totalVotes = milestones[milestoneId].yesVotes + milestones[milestoneId].noVotes;
        uint256 yesPercentage = totalVotes > 0 ? (milestones[milestoneId].yesVotes * 100) / totalVotes : 0;
        
        // Check if milestone is approved (>50% YES votes)
        if (yesPercentage > APPROVAL_THRESHOLD) {
            _completeMilestone(milestoneId);
            emit MilestoneApproved(milestoneId);
        } else {
            // Milestone rejected - reset to Pending for resubmission
            milestones[milestoneId].state = MilestoneState.Pending;
            milestones[milestoneId].yesVotes = 0;
            milestones[milestoneId].noVotes = 0;
            emit MilestoneRejected(milestoneId);
        }
    }
    
    /**
     * @notice Internal function to complete a milestone and release funds
     */
    function _completeMilestone(uint256 milestoneId) internal {
        // Mark milestone as completed
        milestones[milestoneId].state = MilestoneState.Completed;
        
        // Calculate and release funds
        uint256 releaseAmount = (projectData.totalRaised * milestones[milestoneId].releasePercentage) / 10000;
        
        if (releaseAmount > 0) {
            (bool success, ) = payable(projectData.founder).call{value: releaseAmount}("");
            require(success, "Fund transfer failed");
            
            emit MilestoneCompleted(milestoneId, releaseAmount);
        }
        
        // Move to next milestone
        currentMilestone++;
        
        // Check if all milestones completed
        if (currentMilestone >= 3) {
            projectData.state = ProjectState.Completed;
            emit ProjectCompleted();
        }
    }
    
    /**
     * @notice Fail the project and allow refunds
     * @dev Can be called during Funding or Development phase
     */
    function failProject() external onlyFounder {
        if (projectData.state == ProjectState.Completed || projectData.state == ProjectState.Failed) {
            revert InvalidState();
        }
        
        projectData.state = ProjectState.Failed;
        emit ProjectFailed();
    }
    
    /**
     * @notice Claim refund (contributors only, when project failed)
     */
    function claimRefund() external nonReentrant {
        require(projectData.state == ProjectState.Failed, "Project not failed");
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
    function getProjectData() external view returns (ProjectData memory) {
        return projectData;
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
    
    /**
     * @notice Check if a contributor has voted on a milestone
     */
    function getHasVoted(uint256 milestoneId, address contributor) external view returns (bool) {
        return hasVoted[milestoneId][contributor];
    }
    
    /**
     * @notice Get voting stats for a milestone
     */
    function getVotingStats(uint256 milestoneId) external view returns (
        uint256 yesVotes,
        uint256 noVotes,
        uint256 totalVotes,
        uint256 yesPercentage,
        uint256 votingDeadline,
        bool isActive
    ) {
        Milestone memory milestone = milestones[milestoneId];
        yesVotes = milestone.yesVotes;
        noVotes = milestone.noVotes;
        totalVotes = yesVotes + noVotes;
        yesPercentage = totalVotes > 0 ? (yesVotes * 100) / totalVotes : 0;
        votingDeadline = milestone.votingDeadline;
        isActive = milestone.state == MilestoneState.Submitted && block.timestamp <= milestone.votingDeadline;
    }
}
