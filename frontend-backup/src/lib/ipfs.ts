// IPFS integration using Pinata
// Note: In production, you'd want to use a more modern IPFS client like Helia

interface PinataResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

interface IPFSFile {
  name: string;
  content: string | File;
  type?: string;
}

class IPFSService {
  private apiKey: string;
  private secretKey: string;
  private jwt: string;
  private baseUrl = 'https://api.pinata.cloud';

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY || '';
    this.secretKey = process.env.NEXT_PUBLIC_PINATA_SECRET_API_KEY || '';
    this.jwt = process.env.NEXT_PUBLIC_PINATA_JWT || '';
  }

  /**
   * Upload a file to IPFS via Pinata
   */
  async uploadFile(file: File, metadata?: any): Promise<string> {
    if (!this.jwt) {
      throw new Error('Pinata JWT not configured');
    }

    const formData = new FormData();
    formData.append('file', file);

    if (metadata) {
      formData.append('pinataMetadata', JSON.stringify({
        name: metadata.name || file.name,
        keyvalues: metadata.keyvalues || {}
      }));
    }

    const response = await fetch(`${this.baseUrl}/pinning/pinFileToIPFS`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.jwt}`
      },
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Failed to upload file to IPFS: ${response.statusText}`);
    }

    const result: PinataResponse = await response.json();
    return result.IpfsHash;
  }

  /**
   * Upload JSON data to IPFS via Pinata
   */
  async uploadJSON(data: any, metadata?: any): Promise<string> {
    if (!this.jwt) {
      throw new Error('Pinata JWT not configured');
    }

    const body: any = {
      pinataContent: data
    };

    if (metadata) {
      body.pinataMetadata = {
        name: metadata.name || 'JSON Data',
        keyvalues: metadata.keyvalues || {}
      };
    }

    const response = await fetch(`${this.baseUrl}/pinning/pinJSONToIPFS`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.jwt}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`Failed to upload JSON to IPFS: ${response.statusText}`);
    }

    const result: PinataResponse = await response.json();
    return result.IpfsHash;
  }

  /**
   * Get content from IPFS
   */
  async getContent(hash: string): Promise<any> {
    const response = await fetch(`https://gateway.pinata.cloud/ipfs/${hash}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch content from IPFS: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      return await response.json();
    } else {
      return await response.text();
    }
  }

  /**
   * Get IPFS URL for a hash
   */
  getUrl(hash: string): string {
    return `https://gateway.pinata.cloud/ipfs/${hash}`;
  }

  /**
   * Upload milestone evidence (combines files and metadata)
   */
  async uploadMilestoneEvidence(evidence: {
    description: string;
    files: File[];
    metadata: any;
  }): Promise<string> {
    const fileHashes: string[] = [];

    // Upload each file
    for (const file of evidence.files) {
      const hash = await this.uploadFile(file, {
        name: `milestone-evidence-${file.name}`,
        keyvalues: {
          type: 'milestone-evidence-file',
          originalName: file.name
        }
      });
      fileHashes.push(hash);
    }

    // Create evidence metadata
    const evidenceData = {
      description: evidence.description,
      files: fileHashes.map((hash, index) => ({
        hash,
        name: evidence.files[index].name,
        size: evidence.files[index].size,
        type: evidence.files[index].type
      })),
      metadata: evidence.metadata,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };

    // Upload the evidence metadata
    const evidenceHash = await this.uploadJSON(evidenceData, {
      name: 'milestone-evidence-metadata',
      keyvalues: {
        type: 'milestone-evidence',
        fileCount: evidence.files.length.toString()
      }
    });

    return evidenceHash;
  }

  /**
   * Get milestone evidence
   */
  async getMilestoneEvidence(hash: string): Promise<{
    description: string;
    files: Array<{
      hash: string;
      name: string;
      size: number;
      type: string;
      url: string;
    }>;
    metadata: any;
    timestamp: string;
    version: string;
  }> {
    const evidence = await this.getContent(hash);
    
    // Add URLs to files
    evidence.files = evidence.files.map((file: any) => ({
      ...file,
      url: this.getUrl(file.hash)
    }));

    return evidence;
  }

  /**
   * Test connection to Pinata
   */
  async testConnection(): Promise<boolean> {
    if (!this.jwt) {
      return false;
    }

    try {
      const response = await fetch(`${this.baseUrl}/data/testAuthentication`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.jwt}`
        }
      });

      return response.ok;
    } catch (error) {
      console.error('IPFS connection test failed:', error);
      return false;
    }
  }
}

// Create singleton instance
export const ipfsService = new IPFSService();

// Helper functions for common operations
export const uploadToIPFS = async (file: File): Promise<string> => {
  return await ipfsService.uploadFile(file);
};

export const uploadJSONToIPFS = async (data: any): Promise<string> => {
  return await ipfsService.uploadJSON(data);
};

export const getFromIPFS = async (hash: string): Promise<any> => {
  return await ipfsService.getContent(hash);
};

export const getIPFSUrl = (hash: string): string => {
  return ipfsService.getUrl(hash);
};

// Mock IPFS service for development when Pinata is not configured
class MockIPFSService {
  private storage = new Map<string, any>();
  private hashCounter = 0;

  async uploadFile(file: File): Promise<string> {
    const hash = `mock-hash-${++this.hashCounter}`;
    this.storage.set(hash, {
      name: file.name,
      size: file.size,
      type: file.type,
      content: await file.text()
    });
    return hash;
  }

  async uploadJSON(data: any): Promise<string> {
    const hash = `mock-hash-${++this.hashCounter}`;
    this.storage.set(hash, data);
    return hash;
  }

  async getContent(hash: string): Promise<any> {
    return this.storage.get(hash) || null;
  }

  getUrl(hash: string): string {
    return `mock://ipfs/${hash}`;
  }

  async uploadMilestoneEvidence(evidence: any): Promise<string> {
    return await this.uploadJSON(evidence);
  }

  async getMilestoneEvidence(hash: string): Promise<any> {
    return await this.getContent(hash);
  }

  async testConnection(): Promise<boolean> {
    return true;
  }
}

// Export mock service for development
export const mockIPFSService = new MockIPFSService();


