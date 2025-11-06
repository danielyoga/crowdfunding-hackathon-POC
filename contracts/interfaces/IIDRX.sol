// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title IIDRX
 * @notice Interface for IDRX token (Indonesian Rupiah stablecoin)
 * @dev Extends standard ERC20 interface
 * 
 * IDRX is a regulated stablecoin pegged to Indonesian Rupiah (IDR)
 * 1 IDRX = 1 IDR
 * 
 * Contract addresses:
 * - Lisk Sepolia Testnet: TBD (reference lisk-idrx documentation)
 * - Lisk Mainnet: TBD (post-testnet validation)
 * 
 * Standard ERC20 functions inherited:
 * - totalSupply()
 * - balanceOf(address account)
 * - transfer(address to, uint256 amount)
 * - allowance(address owner, address spender)
 * - approve(address spender, uint256 amount)
 * - transferFrom(address from, address to, uint256 amount)
 * 
 * Events inherited:
 * - Transfer(address indexed from, address indexed to, uint256 value)
 * - Approval(address indexed owner, address indexed spender, uint256 value)
 */
interface IIDRX is IERC20 {
    // Standard ERC20 interface is sufficient for MVP
    // Add IDRX-specific functions here if needed in future phases
    
    /**
     * @notice Get the number of decimals
     * @return Number of decimals (typically 18)
     */
    function decimals() external view returns (uint8);
    
    /**
     * @notice Get the token name
     * @return Token name (e.g., "IDRX")
     */
    function name() external view returns (string memory);
    
    /**
     * @notice Get the token symbol
     * @return Token symbol (e.g., "IDRX")
     */
    function symbol() external view returns (string memory);
}

