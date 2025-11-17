const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const ipfsService = require('../services/ipfsService');

/**
 * POST /api/ipfs/upload
 * Uploads content to IPFS
 */
router.post('/upload', [
  body('content').notEmpty().withMessage('Content is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content } = req.body;
    const hash = await ipfsService.uploadToIPFS(content);
    
    res.json({ 
      hash,
      url: `ipfs://${hash}`,
      gateway: `https://ipfs.io/ipfs/${hash}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/ipfs/:hash
 * Retrieves content from IPFS
 */
router.get('/:hash', async (req, res) => {
  try {
    const { hash } = req.params;
    const content = await ipfsService.getFromIPFS(hash);
    
    res.json({ content });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/ipfs/pin
 * Pins content on IPFS
 */
router.post('/pin', [
  body('hash').notEmpty().withMessage('Hash is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { hash } = req.body;
    const success = await ipfsService.pinContent(hash);
    
    res.json({ success, hash });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
