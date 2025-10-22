// Web3 utility functions for the crowdfunding platform

import { ethers } from "ethers";
import { RiskProfile, RISK_PROFILE_SPLITS } from "./contracts";

/**
 * Generate a valid mock Ethereum address (40 hex chars)
 */
export function generateMockAddress(): string {
  let address = '0x';
  for (let i = 0; i < 40; i++) {
    address += Math.floor(Math.random() * 16).toString(16);
  }
  return address;
}

/**
 * Check if a string is a valid Ethereum address format
 */
export function isValidAddress(address: string): boolean {
  if (!address || typeof address !== 'string') return false;
  if (!address.startsWith('0x')) return false;
  if (address.length !== 42) return false;
  return /^0x[0-9a-fA-F]{40}$/.test(address);
}

/**
 * Validate and normalize an Ethereum address
 * Returns null if invalid
 */
export function validateAddress(address: string): string | null {
  try {
    if (!isValidAddress(address)) return null;
    return ethers.getAddress(address);
  } catch {
    return null;
  }
}

/**
 * Format wallet address (0x1234...5678)
 */
export function truncateAddress(address: string, startChars = 6, endChars = 4): string {
  if (!address) return "";
  if (address.length <= startChars + endChars) return address;
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Format ETH amount with proper decimals
 */
export function formatEth(wei: bigint | string, decimals = 4): string {
  try {
    const ethAmount = ethers.formatEther(wei);
    const num = parseFloat(ethAmount);
    return num.toFixed(decimals);
  } catch (error) {
    return "0.0000";
  }
}

/**
 * Format ETH with unit
 */
export function formatEthWithUnit(wei: bigint | string, decimals = 4): string {
  return `${formatEth(wei, decimals)} ETH`;
}

/**
 * Parse ETH input to wei
 */
export function parseEthInput(ethAmount: string): bigint {
  try {
    if (!ethAmount || ethAmount.trim() === "") return BigInt(0);
    return ethers.parseEther(ethAmount);
  } catch (error) {
    throw new Error("Invalid ETH amount");
  }
}

/**
 * Calculate risk profile splits
 */
export function calculateSplit(
  amount: bigint,
  riskProfile: RiskProfile
): { committed: bigint; reserve: bigint } {
  const split = RISK_PROFILE_SPLITS[riskProfile];
  const committed = (amount * BigInt(split.committed)) / BigInt(100);
  const reserve = amount - committed;
  return { committed, reserve };
}

/**
 * Format USD amount
 */
export function formatUsd(amount: number, decimals = 2): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
}

/**
 * Convert ETH to USD (requires price)
 */
export function ethToUsd(ethAmount: string, ethPrice: number): number {
  return parseFloat(ethAmount) * ethPrice;
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals = 2): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Calculate percentage
 */
export function calculatePercentage(part: bigint, total: bigint): number {
  if (total === BigInt(0)) return 0;
  return (Number(part) / Number(total)) * 100;
}

/**
 * Format date relative to now
 */
export function formatRelativeTime(timestamp: number | bigint): string {
  const date = new Date(Number(timestamp) * 1000);
  const now = Date.now();
  const diff = now - date.getTime();
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  const years = Math.floor(months / 12);

  if (years > 0) return `${years} year${years > 1 ? "s" : ""} ago`;
  if (months > 0) return `${months} month${months > 1 ? "s" : ""} ago`;
  if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  return "just now";
}

/**
 * Format absolute date
 */
export function formatDate(timestamp: number | bigint): string {
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format datetime
 */
export function formatDateTime(timestamp: number | bigint): string {
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Calculate time remaining
 */
export function getTimeRemaining(deadline: number | bigint): {
  total: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
} {
  const deadlineMs = Number(deadline) * 1000;
  const now = Date.now();
  const total = deadlineMs - now;

  if (total <= 0) {
    return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }

  const seconds = Math.floor(total / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  return {
    total,
    days,
    hours: hours % 24,
    minutes: minutes % 60,
    seconds: seconds % 60,
    isExpired: false,
  };
}

/**
 * Format countdown
 */
export function formatCountdown(deadline: number | bigint): string {
  const { days, hours, minutes, isExpired } = getTimeRemaining(deadline);

  if (isExpired) return "Expired";
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

/**
 * Get risk profile label
 */
export function getRiskProfileLabel(riskProfile: RiskProfile): string {
  switch (riskProfile) {
    case RiskProfile.Conservative:
      return "Conservative (50/50)";
    case RiskProfile.Balanced:
      return "Balanced (70/30)";
    case RiskProfile.Aggressive:
      return "Aggressive (90/10)";
    default:
      return "Unknown";
  }
}

/**
 * Get risk profile color
 */
export function getRiskProfileColor(riskProfile: RiskProfile): string {
  switch (riskProfile) {
    case RiskProfile.Conservative:
      return "text-green-500";
    case RiskProfile.Balanced:
      return "text-blue-500";
    case RiskProfile.Aggressive:
      return "text-red-500";
    default:
      return "text-gray-500";
  }
}

/**
 * Get campaign state label
 */
export function getCampaignStateLabel(state: number): string {
  const labels = ["Active", "Completed", "Failed", "Paused"];
  return labels[state] || "Unknown";
}

/**
 * Get campaign state color
 */
export function getCampaignStateColor(state: number): string {
  const colors = ["text-green-500", "text-blue-500", "text-red-500", "text-yellow-500"];
  return colors[state] || "text-gray-500";
}

/**
 * Get milestone state label
 */
export function getMilestoneStateLabel(state: number): string {
  const labels = ["Pending", "Submitted", "Voting", "Approved", "Rejected", "Completed"];
  return labels[state] || "Unknown";
}

/**
 * Get milestone state color
 */
export function getMilestoneStateColor(state: number): string {
  const colors = [
    "text-gray-500",    // Pending
    "text-blue-500",    // Submitted
    "text-purple-500",  // Voting
    "text-green-500",   // Approved
    "text-red-500",     // Rejected
    "text-green-700",   // Completed
  ];
  return colors[state] || "text-gray-500";
}

/**
 * Validate ETH amount
 */
export function validateEthAmount(amount: string, min?: bigint, max?: bigint): {
  isValid: boolean;
  error?: string;
} {
  try {
    if (!amount || amount.trim() === "") {
      return { isValid: false, error: "Amount is required" };
    }

    const wei = parseEthInput(amount);

    if (wei <= BigInt(0)) {
      return { isValid: false, error: "Amount must be greater than 0" };
    }

    if (min && wei < min) {
      return { isValid: false, error: `Amount must be at least ${formatEth(min)} ETH` };
    }

    if (max && wei > max) {
      return { isValid: false, error: `Amount cannot exceed ${formatEth(max)} ETH` };
    }

    return { isValid: true };
  } catch (error) {
    return { isValid: false, error: "Invalid amount format" };
  }
}

/**
 * Get IPFS gateway URL
 */
export function getIpfsUrl(hash: string): string {
  if (!hash) return "";
  // Remove ipfs:// prefix if present
  const cleanHash = hash.replace(/^ipfs:\/\//, "");
  return `https://ipfs.io/ipfs/${cleanHash}`;
}

/**
 * Compare addresses (case-insensitive)
 */
export function isSameAddress(address1: string, address2: string): boolean {
  try {
    return address1.toLowerCase() === address2.toLowerCase();
  } catch {
    return false;
  }
}

/**
 * Get block explorer URL
 */
export function getExplorerUrl(chainId: number, type: "tx" | "address", value: string): string {
  const explorers: Record<number, string> = {
    84532: "https://sepolia.basescan.org", // Base Sepolia
    8453: "https://basescan.org",           // Base Mainnet
    31337: "http://localhost:8545",         // Localhost (no explorer)
  };

  const baseUrl = explorers[chainId];
  if (!baseUrl || chainId === 31337) return "#";

  return `${baseUrl}/${type}/${value}`;
}

/**
 * Copy to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error("Failed to copy:", error);
    return false;
  }
}

/**
 * Format large numbers
 */
export function formatNumber(num: number, decimals = 0): string {
  if (num >= 1e9) return `${(num / 1e9).toFixed(decimals)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(decimals)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(decimals)}K`;
  return num.toFixed(decimals);
}

/**
 * Calculate refund amount
 */
export function calculateRefund(
  contribution: {
    totalAmount: bigint;
    committedAmount: bigint;
    reserveAmount: bigint;
  },
  releasedAmount: bigint,
  platformFeePercentage = 2
): {
  unreleased: bigint;
  reserve: bigint;
  subtotal: bigint;
  fee: bigint;
  refund: bigint;
} {
  const unreleased = contribution.committedAmount - releasedAmount;
  const reserve = contribution.reserveAmount;
  const subtotal = unreleased + reserve;
  const fee = (subtotal * BigInt(platformFeePercentage)) / BigInt(100);
  const refund = subtotal - fee;

  return { unreleased, reserve, subtotal, fee, refund };
}

