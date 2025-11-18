import { useState } from 'react';

// IPFS upload hook for storing task metadata
export function useIPFS() {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadJSON = async (data: object): Promise<string> => {
    setIsUploading(true);
    setError(null);

    try {
      // Using Pinata API for IPFS pinning
      const apiKey = process.env.NEXT_PUBLIC_PINATA_API_KEY;
      const apiSecret = process.env.NEXT_PUBLIC_PINATA_SECRET_KEY;

      if (!apiKey || !apiSecret) {
        // Fallback: Use local storage simulation for development
        const hash = `Qm${btoa(JSON.stringify(data)).slice(0, 44)}`;
        console.log('IPFS simulation (no Pinata keys):', hash);
        return hash;
      }

      const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'pinata_api_key': apiKey,
          'pinata_secret_api_key': apiSecret,
        },
        body: JSON.stringify({
          pinataContent: data,
          pinataMetadata: {
            name: `taskchainz-${Date.now()}`,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`IPFS upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result.IpfsHash;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setError(message);
      throw new Error(message);
    } finally {
      setIsUploading(false);
    }
  };

  const fetchJSON = async <T>(ipfsHash: string): Promise<T> => {
    try {
      // Try multiple IPFS gateways
      const gateways = [
        `https://gateway.pinata.cloud/ipfs/${ipfsHash}`,
        `https://ipfs.io/ipfs/${ipfsHash}`,
        `https://cloudflare-ipfs.com/ipfs/${ipfsHash}`,
      ];

      for (const gateway of gateways) {
        try {
          const response = await fetch(gateway);
          if (response.ok) {
            return await response.json();
          }
        } catch {
          continue;
        }
      }

      throw new Error('Failed to fetch from all gateways');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Fetch failed';
      setError(message);
      throw new Error(message);
    }
  };

  return {
    uploadJSON,
    fetchJSON,
    isUploading,
    error,
  };
}

// Task metadata interface
export interface TaskMetadata {
  title: string;
  description: string;
  requirements?: string[];
  tags?: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
  estimatedTime?: string;
}

// Completion proof interface
export interface CompletionProof {
  description: string;
  evidence?: string[];
  submittedAt: string;
}
