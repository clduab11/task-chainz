import express from 'express';
import ipfsService from '../services/ipfs';

const router = express.Router();

router.post('/upload', async (req, res, next) => {
  try {
    const { data } = req.body;
    const cid = await ipfsService.uploadJSON(data);
    res.json({ cid, url: ipfsService.getGatewayUrl(cid) });
  } catch (error) {
    next(error);
  }
});

router.get('/:cid', async (req, res, next) => {
  try {
    const { cid } = req.params;
    const data = await ipfsService.getJSON(cid);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});

export default router;
