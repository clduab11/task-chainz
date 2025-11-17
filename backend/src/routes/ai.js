const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const aiService = require('../services/aiService');

/**
 * POST /api/ai/categorize
 * Categorizes a task using AI
 */
router.post('/categorize', [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description } = req.body;
    const result = await aiService.categorizeTask(title, description);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/ai/recommend
 * Recommends tasks based on user profile
 */
router.post('/recommend', [
  body('userSkills').isArray().withMessage('User skills must be an array'),
  body('userHistory').isObject().withMessage('User history must be an object'),
  body('availableTasks').isArray().withMessage('Available tasks must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userSkills, userHistory, availableTasks } = req.body;
    const result = await aiService.recommendTasks(userSkills, userHistory, availableTasks);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/ai/fraud-detection
 * Detects potential fraud in content
 */
router.post('/fraud-detection', [
  body('content').notEmpty().withMessage('Content is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content, context } = req.body;
    const result = await aiService.detectFraud(content, context || {});
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/ai/quality-score
 * Scores task quality
 */
router.post('/quality-score', [
  body('taskData').isObject().withMessage('Task data must be an object')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { taskData } = req.body;
    const result = await aiService.scoreTaskQuality(taskData);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
