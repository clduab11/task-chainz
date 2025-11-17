import express from 'express';
import claudeAI from '../services/claudeAI';

const router = express.Router();

router.post('/categorize', async (req, res, next) => {
  try {
    const { description } = req.body;
    const category = await claudeAI.categorizeTask(description);
    res.json({ category });
  } catch (error) {
    next(error);
  }
});

router.post('/estimate-complexity', async (req, res, next) => {
  try {
    const { description, requirements } = req.body;
    const estimate = await claudeAI.estimateTaskComplexity(description, requirements);
    res.json(estimate);
  } catch (error) {
    next(error);
  }
});

router.post('/detect-fraud', async (req, res, next) => {
  try {
    const { description, creatorHistory } = req.body;
    const result = await claudeAI.detectFraud(description, creatorHistory);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/recommend', async (req, res, next) => {
  try {
    const { userProfile, availableTasks } = req.body;
    const recommendations = await claudeAI.recommendTasks(userProfile, availableTasks);
    res.json({ recommendations });
  } catch (error) {
    next(error);
  }
});

router.post('/generate-template', async (req, res, next) => {
  try {
    const { briefDescription } = req.body;
    const template = await claudeAI.generateTaskTemplate(briefDescription);
    res.json(template);
  } catch (error) {
    next(error);
  }
});

export default router;
