/**
 * Automatic localStorage cleanup for Hardhat development
 * Detects Hardhat restarts and clears stale campaign data
 */

const FACTORY_ADDRESS_KEY = 'hardhat_factory_address';
const LAST_BLOCK_KEY = 'hardhat_last_block';
const STORAGE_VERSION_KEY = 'storage_version';
const CURRENT_VERSION = '2.0.0';

// Expected factory address for localhost (always the same on Hardhat)
const EXPECTED_FACTORY_ADDRESS = '0x5fbdb2315678afecb367f032d93f642f64180aa3';

/**
 * Check if Hardhat was restarted and clean stale data
 */
export async function detectAndCleanStaleData(
  chainId: number,
  provider: any
): Promise<{ wasCleared: boolean; reason?: string }> {
  // Only run on localhost (Hardhat)
  if (chainId !== 31337) {
    return { wasCleared: false };
  }

  try {
    const savedFactoryAddress = localStorage.getItem(FACTORY_ADDRESS_KEY);
    const savedVersion = localStorage.getItem(STORAGE_VERSION_KEY);
    
    // Check version mismatch
    if (savedVersion !== CURRENT_VERSION) {
      clearAllCampaignData();
      localStorage.setItem(STORAGE_VERSION_KEY, CURRENT_VERSION);
      localStorage.setItem(FACTORY_ADDRESS_KEY, EXPECTED_FACTORY_ADDRESS);
      return { wasCleared: true, reason: 'Version mismatch' };
    }

    // Check if factory address changed (Hardhat restart)
    if (savedFactoryAddress && savedFactoryAddress.toLowerCase() !== EXPECTED_FACTORY_ADDRESS.toLowerCase()) {
      clearAllCampaignData();
      localStorage.setItem(FACTORY_ADDRESS_KEY, EXPECTED_FACTORY_ADDRESS);
      return { wasCleared: true, reason: 'Factory address mismatch (Hardhat restarted)' };
    }

    // Check if blockchain was reset by comparing block numbers
    if (provider) {
      try {
        const currentBlock = await provider.getBlockNumber();
        const savedBlock = parseInt(localStorage.getItem(LAST_BLOCK_KEY) || '0');
        
        // If current block is less than saved block, Hardhat was restarted
        if (savedBlock > 0 && currentBlock < savedBlock) {
          clearAllCampaignData();
          localStorage.setItem(LAST_BLOCK_KEY, currentBlock.toString());
          return { wasCleared: true, reason: `Blockchain reset detected (block ${currentBlock} < ${savedBlock})` };
        }
        
        // Update last seen block
        localStorage.setItem(LAST_BLOCK_KEY, currentBlock.toString());
      } catch (error) {
        console.warn('Could not check block number:', error);
      }
    }

    // First time setup
    if (!savedFactoryAddress) {
      localStorage.setItem(FACTORY_ADDRESS_KEY, EXPECTED_FACTORY_ADDRESS);
      localStorage.setItem(STORAGE_VERSION_KEY, CURRENT_VERSION);
    }

    return { wasCleared: false };
  } catch (error) {
    console.error('Error in detectAndCleanStaleData:', error);
    return { wasCleared: false };
  }
}

/**
 * Clear all campaign-related data from localStorage
 */
function clearAllCampaignData() {
  const keysToRemove: string[] = [];
  
  // Find all campaign/project related keys
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (
      key.startsWith('campaign_') ||
      key.startsWith('project_') ||
      key.startsWith('mock_campaign') ||
      key.startsWith('mock_project') ||
      key.includes('campaign') ||
      key.includes('project')
    )) {
      keysToRemove.push(key);
    }
  }
  
  // Remove all found keys
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    console.log(`🧹 Removed stale data: ${key}`);
  });
  
  if (keysToRemove.length > 0) {
    console.log(`✅ Cleared ${keysToRemove.length} stale campaign entries`);
  }
}

/**
 * Manual cleanup function (for debugging)
 */
export function manualCleanup() {
  clearAllCampaignData();
  localStorage.removeItem(FACTORY_ADDRESS_KEY);
  localStorage.removeItem(LAST_BLOCK_KEY);
  localStorage.setItem(STORAGE_VERSION_KEY, CURRENT_VERSION);
  console.log('✅ Manual cleanup completed');
}

/**
 * Get cleanup status for debugging
 */
export function getCleanupStatus() {
  return {
    factoryAddress: localStorage.getItem(FACTORY_ADDRESS_KEY),
    lastBlock: localStorage.getItem(LAST_BLOCK_KEY),
    version: localStorage.getItem(STORAGE_VERSION_KEY),
    expectedFactory: EXPECTED_FACTORY_ADDRESS,
    currentVersion: CURRENT_VERSION,
  };
}

// Make available in browser console for debugging
if (typeof window !== 'undefined') {
  (window as any).cleanupStorage = manualCleanup;
  (window as any).cleanupStatus = getCleanupStatus;
}


