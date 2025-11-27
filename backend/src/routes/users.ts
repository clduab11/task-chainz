import express from 'express';

const router = express.Router();

router.get('/:address', async (req, res) => {
  res.json({ user: null });
});

export default router;
