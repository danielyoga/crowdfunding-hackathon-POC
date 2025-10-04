// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Governance
 * @notice Advanced governance contract for platform-wide decisions and emergency actions
 * @dev Handles platform governance, emergency votes, and dispute resolution
 */
contract Governance is Ownable, ReentrancyGuard {
    
    // Enums
    enum ProposalType { PlatformFee, EmergencyPause, CampaignDispute, FeatureUpgrade }
    enum ProposalState { Active, Passed, Failed, Executed, Cancelled }
    
    // Structs
    struct Proposal {
        uint256 id;
        ProposalType proposalType;
        string title;
        string description;
        address proposer;
        uint256 startTime;
        uint256 endTime;
        uint256 yesVotes;
        uint256 noVotes;
        uint256 totalVotingPower;
        ProposalState state;
        bytes executionData;
        address targetContract;
        uint256 executionTime;
    }
    
    struct Voter {
        uint256 votingPower;
        bool hasVoted;
        bool support;
        uint256 votedAt;
    }
    
    // State variables
    uint256 public proposalCount;
    uint256 public constant VOTING_PERIOD = 7 days;
    uint256 public constant EXECUTION_DELAY = 2 days;
    uint256 public constant QUORUM_THRESHOLD = 3000; // 30% in basis points
    uint256 public constant APPROVAL_THRESHOLD = 6000; // 60% in basis points
    uint256 public constant MIN_PROPOSAL_POWER = 1000; // 10% to create proposal
    
    // Mappings
    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => Voter)) public votes;
    mapping(address => uint256) public votingPower; // Based on platform usage/stake
    mapping(address => bool) public authorizedContracts;
    
    // Arrays
    uint256[] public activeProposals;
    
    // Events
    event ProposalCreated(
        uint256 indexed proposalId,
        ProposalType proposalType,
        string title,
        address indexed proposer,
        uint256 endTime
    );
    
    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        bool support,
        uint256 votingPower
    );
    
    event ProposalExecuted(
        uint256 indexed proposalId,
        bool success,
        bytes returnData
    );
    
    event ProposalStateChanged(
        uint256 indexed proposalId,
        ProposalState oldState,
        ProposalState newState
    );
    
    event VotingPowerUpdated(
        address indexed user,
        uint256 oldPower,
        uint256 newPower
    );
    
    event ContractAuthorized(address indexed contractAddress, bool authorized);
    
    // Custom errors
    error InsufficientVotingPower();
    error ProposalNotActive();
    error AlreadyVoted();
    error ProposalNotPassed();
    error ExecutionDelayNotMet();
    error ExecutionFailed();
    error UnauthorizedContract();
    error InvalidProposalType();
    error QuorumNotMet();
    
    constructor(address initialOwner) Ownable(initialOwner) {}
    
    /**
     * @notice Create a new governance proposal
     */
    function createProposal(
        ProposalType proposalType,
        string calldata title,
        string calldata description,
        bytes calldata executionData,
        address targetContract
    ) external returns (uint256 proposalId) {
        
        // Check if proposer has enough voting power
        if (votingPower[msg.sender] < (getTotalVotingPower() * MIN_PROPOSAL_POWER) / 10000) {
            revert InsufficientVotingPower();
        }
        
        proposalId = proposalCount++;
        
        proposals[proposalId] = Proposal({
            id: proposalId,
            proposalType: proposalType,
            title: title,
            description: description,
            proposer: msg.sender,
            startTime: block.timestamp,
            endTime: block.timestamp + VOTING_PERIOD,
            yesVotes: 0,
            noVotes: 0,
            totalVotingPower: 0,
            state: ProposalState.Active,
            executionData: executionData,
            targetContract: targetContract,
            executionTime: 0
        });
        
        activeProposals.push(proposalId);
        
        emit ProposalCreated(
            proposalId,
            proposalType,
            title,
            msg.sender,
            proposals[proposalId].endTime
        );
        
        return proposalId;
    }
    
    /**
     * @notice Vote on a proposal
     */
    function vote(uint256 proposalId, bool support) external {
        Proposal storage proposal = proposals[proposalId];
        
        if (proposal.state != ProposalState.Active) revert ProposalNotActive();
        if (votes[proposalId][msg.sender].hasVoted) revert AlreadyVoted();
        if (block.timestamp > proposal.endTime) {
            _finalizeProposal(proposalId);
            return;
        }
        
        uint256 voterPower = votingPower[msg.sender];
        require(voterPower > 0, "No voting power");
        
        // Record vote
        votes[proposalId][msg.sender] = Voter({
            votingPower: voterPower,
            hasVoted: true,
            support: support,
            votedAt: block.timestamp
        });
        
        // Update proposal vote counts
        if (support) {
            proposal.yesVotes += voterPower;
        } else {
            proposal.noVotes += voterPower;
        }
        
        proposal.totalVotingPower += voterPower;
        
        emit VoteCast(proposalId, msg.sender, support, voterPower);
    }
    
    /**
     * @notice Finalize a proposal after voting period
     */
    function finalizeProposal(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        
        if (proposal.state != ProposalState.Active) revert ProposalNotActive();
        require(block.timestamp > proposal.endTime, "Voting still active");
        
        _finalizeProposal(proposalId);
    }
    
    /**
     * @notice Internal function to finalize proposal
     */
    function _finalizeProposal(uint256 proposalId) internal {
        Proposal storage proposal = proposals[proposalId];
        
        // Check quorum
        uint256 totalPower = getTotalVotingPower();
        uint256 quorumRequired = (totalPower * QUORUM_THRESHOLD) / 10000;
        
        if (proposal.totalVotingPower < quorumRequired) {
            proposal.state = ProposalState.Failed;
            emit ProposalStateChanged(proposalId, ProposalState.Active, ProposalState.Failed);
            _removeFromActiveProposals(proposalId);
            return;
        }
        
        // Check approval
        uint256 totalVotes = proposal.yesVotes + proposal.noVotes;
        bool approved = false;
        
        if (totalVotes > 0) {
            uint256 approvalPercentage = (proposal.yesVotes * 10000) / totalVotes;
            approved = approvalPercentage >= APPROVAL_THRESHOLD;
        }
        
        if (approved) {
            proposal.state = ProposalState.Passed;
            proposal.executionTime = block.timestamp + EXECUTION_DELAY;
            emit ProposalStateChanged(proposalId, ProposalState.Active, ProposalState.Passed);
        } else {
            proposal.state = ProposalState.Failed;
            emit ProposalStateChanged(proposalId, ProposalState.Active, ProposalState.Failed);
            _removeFromActiveProposals(proposalId);
        }
    }
    
    /**
     * @notice Execute a passed proposal
     */
    function executeProposal(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        
        if (proposal.state != ProposalState.Passed) revert ProposalNotPassed();
        if (block.timestamp < proposal.executionTime) revert ExecutionDelayNotMet();
        
        // Mark as executed before external call
        proposal.state = ProposalState.Executed;
        _removeFromActiveProposals(proposalId);
        
        // Execute the proposal
        bool success = false;
        bytes memory returnData;
        
        if (proposal.executionData.length > 0 && proposal.targetContract != address(0)) {
            if (!authorizedContracts[proposal.targetContract]) revert UnauthorizedContract();
            
            (success, returnData) = proposal.targetContract.call(proposal.executionData);
        } else {
            // Handle special governance actions
            success = _executeGovernanceAction(proposal);
        }
        
        emit ProposalExecuted(proposalId, success, returnData);
        emit ProposalStateChanged(proposalId, ProposalState.Passed, ProposalState.Executed);
        
        if (!success) revert ExecutionFailed();
    }
    
    /**
     * @notice Execute special governance actions
     */
    function _executeGovernanceAction(Proposal memory proposal) internal returns (bool) {
        if (proposal.proposalType == ProposalType.EmergencyPause) {
            // Handle emergency pause logic
            return true;
        } else if (proposal.proposalType == ProposalType.FeatureUpgrade) {
            // Handle feature upgrade logic
            return true;
        }
        
        return false;
    }
    
    /**
     * @notice Remove proposal from active proposals array
     */
    function _removeFromActiveProposals(uint256 proposalId) internal {
        for (uint256 i = 0; i < activeProposals.length; i++) {
            if (activeProposals[i] == proposalId) {
                activeProposals[i] = activeProposals[activeProposals.length - 1];
                activeProposals.pop();
                break;
            }
        }
    }
    
    /**
     * @notice Update voting power for a user (called by authorized contracts)
     */
    function updateVotingPower(address user, uint256 newPower) external {
        require(authorizedContracts[msg.sender] || msg.sender == owner(), "Not authorized");
        
        uint256 oldPower = votingPower[user];
        votingPower[user] = newPower;
        
        emit VotingPowerUpdated(user, oldPower, newPower);
    }
    
    /**
     * @notice Authorize/deauthorize contracts to call governance functions
     */
    function setContractAuthorization(address contractAddress, bool authorized) external onlyOwner {
        authorizedContracts[contractAddress] = authorized;
        emit ContractAuthorized(contractAddress, authorized);
    }
    
    /**
     * @notice Cancel a proposal (owner only, for emergencies)
     */
    function cancelProposal(uint256 proposalId) external onlyOwner {
        Proposal storage proposal = proposals[proposalId];
        require(proposal.state == ProposalState.Active || proposal.state == ProposalState.Passed, "Cannot cancel");
        
        ProposalState oldState = proposal.state;
        proposal.state = ProposalState.Cancelled;
        _removeFromActiveProposals(proposalId);
        
        emit ProposalStateChanged(proposalId, oldState, ProposalState.Cancelled);
    }
    
    // View functions
    
    /**
     * @notice Get total voting power in the system
     */
    function getTotalVotingPower() public view returns (uint256) {
        // This would be calculated based on all users' voting power
        // For now, return a placeholder - in production, this would aggregate all users
        return 1000000; // 1M total voting power
    }
    
    /**
     * @notice Get proposal details
     */
    function getProposal(uint256 proposalId) external view returns (Proposal memory) {
        return proposals[proposalId];
    }
    
    /**
     * @notice Get vote details for a user on a proposal
     */
    function getVote(uint256 proposalId, address voter) external view returns (Voter memory) {
        return votes[proposalId][voter];
    }
    
    /**
     * @notice Get all active proposal IDs
     */
    function getActiveProposals() external view returns (uint256[] memory) {
        return activeProposals;
    }
    
    /**
     * @notice Check if a proposal can be executed
     */
    function canExecuteProposal(uint256 proposalId) external view returns (bool) {
        Proposal memory proposal = proposals[proposalId];
        return proposal.state == ProposalState.Passed && 
               block.timestamp >= proposal.executionTime;
    }
    
    /**
     * @notice Get proposal results
     */
    function getProposalResults(uint256 proposalId) external view returns (
        uint256 yesVotes,
        uint256 noVotes,
        uint256 totalVotingPower,
        uint256 quorumRequired,
        bool quorumMet,
        bool approved
    ) {
        Proposal memory proposal = proposals[proposalId];
        uint256 totalPower = getTotalVotingPower();
        uint256 quorum = (totalPower * QUORUM_THRESHOLD) / 10000;
        
        bool quorumReached = proposal.totalVotingPower >= quorum;
        bool isApproved = false;
        
        if (proposal.yesVotes + proposal.noVotes > 0) {
            uint256 approvalPercentage = (proposal.yesVotes * 10000) / (proposal.yesVotes + proposal.noVotes);
            isApproved = approvalPercentage >= APPROVAL_THRESHOLD;
        }
        
        return (
            proposal.yesVotes,
            proposal.noVotes,
            proposal.totalVotingPower,
            quorum,
            quorumReached,
            isApproved && quorumReached
        );
    }
}


