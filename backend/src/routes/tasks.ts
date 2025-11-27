import express from 'express';

const router = express.Router();

router.get('/', async (req, res) => {
  res.json({ tasks: [] });
});

router.get('/:id', async (req, res) => {
  res.json({ task: null });
});

router.post('/', async (req, res) => {
  res.json({ success: true });
});

export default router;
