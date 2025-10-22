import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatEther, parseEther } from 'viem';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format ETH amount for display
 */
export function formatETH(amount: bigint | string, decimals: number = 4): string {
  if (typeof amount === 'string') {
    return parseFloat(amount).toFixed(decimals);
  }
  return parseFloat(formatEther(amount)).toFixed(decimals);
}

/**
 * Format large numbers with K, M, B suffixes
 */
export function formatNumber(num: number): string {
  if (num >= 1e9) {
    return (num / 1e9).toFixed(1) + 'B';
  }
  if (num >= 1e6) {
    return (num / 1e6).toFixed(1) + 'M';
  }
  if (num >= 1e3) {
    return (num / 1e3).toFixed(1) + 'K';
  }
  return num.toString();
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format address for display
 */
export function formatAddress(address: string, startLength: number = 6, endLength: number = 4): string {
  if (!address) return '';
  if (address.length <= startLength + endLength) return address;
  return `${address.slice(0, startLength)}...${address.slice(-endLength)}`;
}

/**
 * Format time duration
 */
export function formatDuration(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Format time remaining
 */
export function formatTimeRemaining(endTime: bigint | number): string {
  const now = Math.floor(Date.now() / 1000);
  const end = typeof endTime === 'bigint' ? Number(endTime) : endTime;
  const remaining = end - now;

  if (remaining <= 0) {
    return 'Expired';
  }

  return formatDuration(remaining);
}

/**
 * Check if time has passed
 */
export function isExpired(endTime: bigint | number): boolean {
  const now = Math.floor(Date.now() / 1000);
  const end = typeof endTime === 'bigint' ? Number(endTime) : endTime;
  return now >= end;
}

/**
 * Calculate progress percentage
 */
export function calculateProgress(current: bigint | number, total: bigint | number): number {
  const currentNum = typeof current === 'bigint' ? Number(current) : current;
  const totalNum = typeof total === 'bigint' ? Number(total) : total;
  
  if (totalNum === 0) return 0;
  return Math.min((currentNum / totalNum) * 100, 100);
}

/**
 * Validate ETH amount
 */
export function validateETHAmount(amount: string): { isValid: boolean; error?: string } {
  if (!amount || amount.trim() === '') {
    return { isValid: false, error: 'Amount is required' };
  }

  const numAmount = parseFloat(amount);
  
  if (isNaN(numAmount)) {
    return { isValid: false, error: 'Invalid amount format' };
  }

  if (numAmount <= 0) {
    return { isValid: false, error: 'Amount must be greater than 0' };
  }

  if (numAmount > 1000000) {
    return { isValid: false, error: 'Amount is too large' };
  }

  // Check decimal places (max 18 for ETH)
  const decimalPlaces = (amount.split('.')[1] || '').length;
  if (decimalPlaces > 18) {
    return { isValid: false, error: 'Too many decimal places' };
  }

  return { isValid: true };
}

/**
 * Parse ETH amount safely
 */
export function parseETHSafe(amount: string): bigint | null {
  const validation = validateETHAmount(amount);
  if (!validation.isValid) {
    return null;
  }

  try {
    return parseEther(amount);
  } catch {
    return null;
  }
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch {
      document.body.removeChild(textArea);
      return false;
    }
  }
}

/**
 * Generate random color for avatars
 */
export function generateAvatarColor(seed: string): string {
  const colors = [
    'bg-red-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-teal-500',
  ];
  
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Sleep function
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if string is valid IPFS hash
 */
export function isValidIPFSHash(hash: string): boolean {
  // Basic IPFS hash validation (CIDv0 and CIDv1)
  const cidv0Regex = /^Qm[1-9A-HJ-NP-Za-km-z]{44}$/;
  const cidv1Regex = /^b[a-z2-7]{58}$/;
  
  return cidv0Regex.test(hash) || cidv1Regex.test(hash);
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get file extension
 */
export function getFileExtension(filename: string): string {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
}

/**
 * Check if file is image
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * Check if file is document
 */
export function isDocumentFile(file: File): boolean {
  const documentTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown'
  ];
  
  return documentTypes.includes(file.type);
}

/**
 * Truncate text
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

/**
 * Check if value is empty
 */
export function isEmpty(value: any): boolean {
  if (value == null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}


