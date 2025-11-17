import { create, IPFSHTTPClient } from 'ipfs-http-client';

export class IPFSService {
  private client: IPFSHTTPClient;

  constructor() {
    const projectId = process.env.IPFS_PROJECT_ID;
    const projectSecret = process.env.IPFS_PROJECT_SECRET;

    const auth = projectId && projectSecret
      ? 'Basic ' + Buffer.from(projectId + ':' + projectSecret).toString('base64')
      : undefined;

    this.client = create({
      url: process.env.IPFS_API_URL || 'https://ipfs.infura.io:5001',
      headers: auth ? { authorization: auth } : {},
    });
  }

  /**
   * Upload JSON data to IPFS
   */
  async uploadJSON(data: any): Promise<string> {
    try {
      const json = JSON.stringify(data);
      const result = await this.client.add(json);
      return result.cid.toString();
    } catch (error) {
      console.error('Error uploading to IPFS:', error);
      throw new Error('Failed to upload to IPFS');
    }
  }

  /**
   * Retrieve JSON data from IPFS
   */
  async getJSON(cid: string): Promise<any> {
    try {
      const chunks = [];
      for await (const chunk of this.client.cat(cid)) {
        chunks.push(chunk);
      }
      const data = Buffer.concat(chunks).toString();
      return JSON.parse(data);
    } catch (error) {
      console.error('Error retrieving from IPFS:', error);
      throw new Error('Failed to retrieve from IPFS');
    }
  }

  /**
   * Pin content to ensure persistence
   */
  async pin(cid: string): Promise<void> {
    try {
      await this.client.pin.add(cid);
    } catch (error) {
      console.error('Error pinning to IPFS:', error);
      throw new Error('Failed to pin to IPFS');
    }
  }

  /**
   * Get IPFS gateway URL for a CID
   */
  getGatewayUrl(cid: string): string {
    const gateway = process.env.IPFS_GATEWAY || 'https://ipfs.io/ipfs/';
    return `${gateway}${cid}`;
  }
}

export default new IPFSService();
