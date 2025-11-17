import express from 'express';

const router = express.Router();

router.get('/stats', async (req, res) => {
  res.json({ stats: {} });
});

export default router;
