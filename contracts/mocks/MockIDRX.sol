// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockIDRX
 * @notice Mock IDRX token for local testing
 * @dev This contract mimics the IDRX stablecoin for Hardhat testing
 * 
 * Features:
 * - Standard ERC20 functionality
 * - Minting capability for testing
 * - Burning capability for testing
 * - 18 decimals (standard)
 * 
 * Usage:
 * - Deploy on local Hardhat network
 * - Mint tokens to test accounts
 * - Use for campaign contribution testing
 * 
 * WARNING: FOR TESTING ONLY - DO NOT USE IN PRODUCTION
 */
contract MockIDRX is ERC20, Ownable {
    
    // ============ Constants ============
    
    /// @notice Number of decimals for the token
    uint8 private constant DECIMALS = 18;
    
    /// @notice Initial supply minted to deployer (1 million IDRX)
    uint256 private constant INITIAL_SUPPLY = 1_000_000 * 10**DECIMALS;
    
    // ============ Events ============
    
    /// @notice Emitted when tokens are minted
    event TokensMinted(address indexed to, uint256 amount);
    
    /// @notice Emitted when tokens are burned
    event TokensBurned(address indexed from, uint256 amount);
    
    // ============ Constructor ============
    
    /**
     * @notice Initialize the MockIDRX token
     * @dev Mints initial supply to the deployer
     */
    constructor() ERC20("Mock IDRX", "mIDRX") Ownable(msg.sender) {
        _mint(msg.sender, INITIAL_SUPPLY);
    }
    
    // ============ External Functions ============
    
    /**
     * @notice Mint tokens to a specific address (testing only)
     * @param to Address to receive the minted tokens
     * @param amount Amount of tokens to mint (in wei)
     * @dev Only owner can mint. Use for setting up test scenarios.
     */
    function mint(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "MockIDRX: mint to zero address");
        require(amount > 0, "MockIDRX: mint amount must be positive");
        
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }
    
    /**
     * @notice Burn tokens from a specific address (testing only)
     * @param from Address to burn tokens from
     * @param amount Amount of tokens to burn (in wei)
     * @dev Only owner can burn. Use for testing edge cases.
     */
    function burn(address from, uint256 amount) external onlyOwner {
        require(from != address(0), "MockIDRX: burn from zero address");
        require(amount > 0, "MockIDRX: burn amount must be positive");
        require(balanceOf(from) >= amount, "MockIDRX: insufficient balance");
        
        _burn(from, amount);
        emit TokensBurned(from, amount);
    }
    
    /**
     * @notice Get the number of decimals
     * @return Number of decimals (18)
     */
    function decimals() public pure override returns (uint8) {
        return DECIMALS;
    }
    
    // ============ Helper Functions for Testing ============
    
    /**
     * @notice Batch mint tokens to multiple addresses
     * @param recipients Array of addresses to receive tokens
     * @param amounts Array of amounts to mint
     * @dev Useful for setting up multiple test accounts at once
     */
    function batchMint(
        address[] calldata recipients, 
        uint256[] calldata amounts
    ) external onlyOwner {
        require(
            recipients.length == amounts.length, 
            "MockIDRX: arrays length mismatch"
        );
        require(recipients.length > 0, "MockIDRX: empty arrays");
        require(recipients.length <= 100, "MockIDRX: too many recipients");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "MockIDRX: mint to zero address");
            require(amounts[i] > 0, "MockIDRX: mint amount must be positive");
            
            _mint(recipients[i], amounts[i]);
            emit TokensMinted(recipients[i], amounts[i]);
        }
    }
    
    /**
     * @notice Reset balance of an address (testing only)
     * @param account Address to reset
     * @param newBalance New balance to set
     * @dev Useful for testing specific balance scenarios
     */
    function setBalance(address account, uint256 newBalance) external onlyOwner {
        require(account != address(0), "MockIDRX: zero address");
        
        uint256 currentBalance = balanceOf(account);
        
        if (newBalance > currentBalance) {
            // Mint the difference
            _mint(account, newBalance - currentBalance);
            emit TokensMinted(account, newBalance - currentBalance);
        } else if (newBalance < currentBalance) {
            // Burn the difference
            _burn(account, currentBalance - newBalance);
            emit TokensBurned(account, currentBalance - newBalance);
        }
        // If equal, do nothing
    }
}

