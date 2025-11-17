const { create } = require('ipfs-http-client');

class IPFSService {
  constructor() {
    // Connect to local IPFS node or use Infura/Pinata
    this.ipfs = create({
      host: process.env.IPFS_HOST || 'ipfs.infura.io',
      port: process.env.IPFS_PORT || 5001,
      protocol: process.env.IPFS_PROTOCOL || 'https',
      headers: process.env.INFURA_PROJECT_ID ? {
        authorization: `Basic ${Buffer.from(
          process.env.INFURA_PROJECT_ID + ':' + process.env.INFURA_PROJECT_SECRET
        ).toString('base64')}`
      } : undefined
    });
  }

  /**
   * Uploads content to IPFS and returns the hash
   */
  async uploadToIPFS(content) {
    try {
      const result = await this.ipfs.add(JSON.stringify(content));
      return result.path; // Returns IPFS hash
    } catch (error) {
      console.error('IPFS upload error:', error);
      throw new Error('Failed to upload to IPFS');
    }
  }

  /**
   * Retrieves content from IPFS using hash
   */
  async getFromIPFS(hash) {
    try {
      const chunks = [];
      for await (const chunk of this.ipfs.cat(hash)) {
        chunks.push(chunk);
      }
      const content = Buffer.concat(chunks).toString();
      return JSON.parse(content);
    } catch (error) {
      console.error('IPFS retrieval error:', error);
      throw new Error('Failed to retrieve from IPFS');
    }
  }

  /**
   * Pins content to ensure it stays available
   */
  async pinContent(hash) {
    try {
      await this.ipfs.pin.add(hash);
      return true;
    } catch (error) {
      console.error('IPFS pin error:', error);
      return false;
    }
  }

  /**
   * Uploads a file buffer to IPFS
   */
  async uploadFile(buffer, filename) {
    try {
      const result = await this.ipfs.add({
        path: filename,
        content: buffer
      });
      return result.path;
    } catch (error) {
      console.error('IPFS file upload error:', error);
      throw new Error('Failed to upload file to IPFS');
    }
  }
}

module.exports = new IPFSService();
