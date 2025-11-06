// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./interfaces/IIDRX.sol";

/**
 * @title Campaign
 * @notice IDRX-based crowdfunding campaign contract
 * @dev MVP implementation - simple all-or-nothing funding model
 * 
 * Features:
 * - IDRX token contributions (ERC20)
 * - All-or-nothing funding model
 * - Automatic state management
 * - Refund mechanism for failed campaigns
 * 
 * Deferred to Phase 2:
 * - Milestone-based releases
 * - Voting mechanisms
 * - Partial withdrawals
 */
contract Campaign is ReentrancyGuard, Pausable {
    
    // ============ State Variables ============
    
    /// @notice IDRX token contract
    IIDRX public immutable idrxToken;
    
    /// @notice Campaign creator address
    address public immutable creator;
    
    /// @notice Factory contract that deployed this campaign
    address public immutable factory;
    
    /// @notice Campaign title
    string public title;
    
    /// @notice Campaign description
    string public description;
    
    /// @notice Funding goal in IDRX wei
    uint256 public goal;
    
    /// @notice Campaign deadline (Unix timestamp)
    uint256 public deadline;
    
    /// @notice Total IDRX raised
    uint256 public totalRaised;
    
    /// @notice Minimum contribution amount (10,000 IDRX)
    uint256 public constant MIN_CONTRIBUTION = 10_000 * 10**18;
    
    /// @notice Campaign state
    enum State { Active, Successful, Failed, Cancelled }
    State public state;
    
    /// @notice Mapping of contributor addresses to their contribution amounts
    mapping(address => uint256) public contributions;
    
    /// @notice Array of all contributor addresses
    address[] public contributors;
    
    /// @notice Mapping to track if address is already in contributors array
    mapping(address => bool) private isContributor;
    
    // ============ Events ============
    
    /**
     * @notice Emitted when a contribution is made
     * @param contributor Address of the contributor
     * @param amount Amount contributed in IDRX wei
     * @param totalRaised New total amount raised
     */
    event Contributed(
        address indexed contributor,
        uint256 amount,
        uint256 totalRaised
    );
    
    /**
     * @notice Emitted when funds are withdrawn by creator
     * @param creator Address of the creator
     * @param amount Amount withdrawn in IDRX wei
     */
    event Withdrawn(
        address indexed creator,
        uint256 amount
    );
    
    /**
     * @notice Emitted when a refund is claimed
     * @param contributor Address of the contributor
     * @param amount Amount refunded in IDRX wei
     */
    event Refunded(
        address indexed contributor,
        uint256 amount
    );
    
    /**
     * @notice Emitted when campaign state changes
     * @param oldState Previous state
     * @param newState New state
     */
    event StateChanged(
        State oldState,
        State newState
    );
    
    // ============ Modifiers ============
    
    /**
     * @dev Modifier to restrict access to campaign creator only
     */
    modifier onlyCreator() {
        require(msg.sender == creator, "Campaign: Only creator");
        _;
    }
    
    /**
     * @dev Modifier to restrict access to factory contract only
     */
    modifier onlyFactory() {
        require(msg.sender == factory, "Campaign: Only factory");
        _;
    }
    
    /**
     * @dev Modifier to check if campaign is in specific state
     * @param _state Required state
     */
    modifier inState(State _state) {
        require(state == _state, "Campaign: Invalid state");
        _;
    }
    
    // ============ Constructor ============
    
    /**
     * @notice Initialize a new campaign
     * @param _idrxToken Address of IDRX token contract
     * @param _creator Address of campaign creator
     * @param _title Campaign title
     * @param _description Campaign description
     * @param _goal Funding goal in IDRX wei
     * @param _duration Campaign duration in seconds
     */
    constructor(
        address _idrxToken,
        address _creator,
        string memory _title,
        string memory _description,
        uint256 _goal,
        uint256 _duration
    ) {
        require(_idrxToken != address(0), "Campaign: Invalid IDRX address");
        require(_creator != address(0), "Campaign: Invalid creator");
        require(_goal > 0, "Campaign: Goal must be positive");
        require(_duration > 0, "Campaign: Duration must be positive");
        require(_duration <= 365 days, "Campaign: Duration too long");
        require(bytes(_title).length > 0, "Campaign: Title required");
        require(bytes(_title).length <= 100, "Campaign: Title too long");
        require(bytes(_description).length <= 1000, "Campaign: Description too long");
        
        idrxToken = IIDRX(_idrxToken);
        creator = _creator;
        factory = msg.sender;
        title = _title;
        description = _description;
        goal = _goal;
        deadline = block.timestamp + _duration;
        state = State.Active;
    }
    
    // ============ External Functions ============
    
    /**
     * @notice Contribute IDRX to the campaign
     * @param _amount Amount of IDRX to contribute (in wei)
     * @dev Requires prior approval of IDRX spending
     */
    function contribute(uint256 _amount) 
        external 
        nonReentrant 
        whenNotPaused 
        inState(State.Active) 
    {
        require(block.timestamp < deadline, "Campaign: Campaign ended");
        require(_amount >= MIN_CONTRIBUTION, "Campaign: Below minimum");
        require(
            idrxToken.balanceOf(msg.sender) >= _amount,
            "Campaign: Insufficient balance"
        );
        
        // Transfer IDRX from contributor to campaign
        require(
            idrxToken.transferFrom(msg.sender, address(this), _amount),
            "Campaign: Transfer failed"
        );
        
        // Track contribution
        if (!isContributor[msg.sender]) {
            contributors.push(msg.sender);
            isContributor[msg.sender] = true;
        }
        contributions[msg.sender] += _amount;
        totalRaised += _amount;
        
        emit Contributed(msg.sender, _amount, totalRaised);
        
        // Auto-check if goal reached
        if (totalRaised >= goal) {
            _updateState(State.Successful);
        }
    }
    
    /**
     * @notice Creator withdraws funds after successful campaign
     * @dev Can only be called once by creator after campaign succeeds
     */
    function withdraw() 
        external 
        onlyCreator 
        nonReentrant 
        inState(State.Successful) 
    {
        uint256 amount = totalRaised;
        require(amount > 0, "Campaign: No funds to withdraw");
        
        totalRaised = 0; // Prevent re-withdrawal
        
        require(
            idrxToken.transfer(creator, amount),
            "Campaign: Withdrawal failed"
        );
        
        emit Withdrawn(creator, amount);
    }
    
    /**
     * @notice Contributors claim refund if campaign fails
     * @dev Can be called by any contributor after campaign fails
     */
    function refund() 
        external 
        nonReentrant 
    {
        require(
            state == State.Failed || state == State.Cancelled,
            "Campaign: Cannot refund"
        );
        
        uint256 contribution = contributions[msg.sender];
        require(contribution > 0, "Campaign: No contribution");
        
        contributions[msg.sender] = 0; // Prevent double refund
        
        require(
            idrxToken.transfer(msg.sender, contribution),
            "Campaign: Refund failed"
        );
        
        emit Refunded(msg.sender, contribution);
    }
    
    /**
     * @notice Check and update campaign state based on deadline
     * @dev Can be called by anyone to update state after deadline
     */
    function checkState() external {
        require(state == State.Active, "Campaign: Not active");
        require(block.timestamp >= deadline, "Campaign: Deadline not reached");
        
        if (totalRaised >= goal) {
            _updateState(State.Successful);
        } else {
            _updateState(State.Failed);
        }
    }
    
    /**
     * @notice Creator can cancel campaign before any contributions
     * @dev Can only cancel if no contributions have been made
     */
    function cancel() 
        external 
        onlyCreator 
        inState(State.Active) 
    {
        require(totalRaised == 0, "Campaign: Cannot cancel with contributions");
        _updateState(State.Cancelled);
    }
    
    /**
     * @notice Emergency pause (factory only)
     * @dev Pauses contributions but allows refunds
     */
    function pause() external onlyFactory {
        _pause();
    }
    
    /**
     * @notice Unpause campaign (factory only)
     * @dev Resumes normal operations
     */
    function unpause() external onlyFactory {
        _unpause();
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Get all contributor addresses
     * @return Array of contributor addresses
     */
    function getContributors() external view returns (address[] memory) {
        return contributors;
    }
    
    /**
     * @notice Get total number of contributors
     * @return Number of unique contributors
     */
    function getContributorCount() external view returns (uint256) {
        return contributors.length;
    }
    
    /**
     * @notice Get time remaining until deadline
     * @return Seconds remaining (0 if deadline passed)
     */
    function getTimeRemaining() external view returns (uint256) {
        if (block.timestamp >= deadline) {
            return 0;
        }
        return deadline - block.timestamp;
    }
    
    /**
     * @notice Get campaign funding progress percentage
     * @return Progress as percentage (0-100+)
     */
    function getProgress() external view returns (uint256) {
        if (goal == 0) return 0;
        return (totalRaised * 100) / goal;
    }
    
    /**
     * @notice Check if campaign has reached its goal
     * @return True if goal reached, false otherwise
     */
    function isGoalReached() external view returns (bool) {
        return totalRaised >= goal;
    }
    
    /**
     * @notice Check if campaign deadline has passed
     * @return True if deadline passed, false otherwise
     */
    function isDeadlinePassed() external view returns (bool) {
        return block.timestamp >= deadline;
    }
    
    /**
     * @notice Get campaign information
     * @return _title Campaign title
     * @return _description Campaign description
     * @return _creator Campaign creator address
     * @return _goal Funding goal in IDRX wei
     * @return _deadline Campaign deadline timestamp
     * @return _totalRaised Total amount raised in IDRX wei
     * @return _state Current campaign state
     * @return _contributorCount Number of unique contributors
     */
    function getCampaignInfo() external view returns (
        string memory _title,
        string memory _description,
        address _creator,
        uint256 _goal,
        uint256 _deadline,
        uint256 _totalRaised,
        State _state,
        uint256 _contributorCount
    ) {
        return (
            title,
            description,
            creator,
            goal,
            deadline,
            totalRaised,
            state,
            contributors.length
        );
    }
    
    // ============ Internal Functions ============
    
    /**
     * @notice Update campaign state and emit event
     * @param _newState New state to transition to
     */
    function _updateState(State _newState) internal {
        State oldState = state;
        state = _newState;
        emit StateChanged(oldState, _newState);
    }
}

