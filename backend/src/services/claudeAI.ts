import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Zod schemas for AI response validation
const ComplexityResponseSchema = z.object({
  complexity: z.enum(['low', 'medium', 'high', 'expert']),
  estimatedHours: z.number().positive(),
  suggestedBounty: z.number().positive(),
  reasoning: z.string(),
});

const FraudDetectionSchema = z.object({
  isSuspicious: z.boolean(),
  riskLevel: z.enum(['low', 'medium', 'high']),
  flags: z.array(z.string()),
});

const TaskRecommendationSchema = z.array(z.number().int().nonnegative());

const TaskTemplateSchema = z.object({
  title: z.string(),
  description: z.string(),
  requirements: z.array(z.string()),
  deliverables: z.array(z.string()),
});

// Use environment variable for model version
const AI_MODEL = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-20241022';

export class ClaudeAIService {
  /**
   * Categorize a task based on its description
   */
  async categorizeTask(taskDescription: string): Promise<string> {
    try {
      const message = await anthropic.messages.create({
        model: AI_MODEL,
        max_tokens: 100,
        messages: [
          {
            role: 'user',
            content: `Categorize this task into ONE of these categories: Development, Design, Writing, Marketing, Research, DataEntry, Testing, Other.

Task: ${taskDescription}

Reply with only the category name.`,
          },
        ],
      });

      const content = message.content[0];
      if (content.type === 'text') {
        return content.text.trim();
      }
      return 'Other';
    } catch (error) {
      console.error('Error categorizing task:', error);
      return 'Other';
    }
  }

  /**
   * Estimate task complexity and suggested bounty
   */
  async estimateTaskComplexity(taskDescription: string, requirements: string): Promise<{
    complexity: 'low' | 'medium' | 'high' | 'expert';
    estimatedHours: number;
    suggestedBounty: number;
    reasoning: string;
  }> {
    try {
      const message = await anthropic.messages.create({
        model: AI_MODEL,
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: `Analyze this task and provide complexity estimation in JSON format:

Task Description: ${taskDescription}
Requirements: ${requirements}

Provide a JSON response with:
{
  "complexity": "low|medium|high|expert" (expert = requires specialized/senior expertise),
  "estimatedHours": number,
  "suggestedBounty": number (in TASKZ tokens, assuming $0.10 per token and $20-100/hr rate),
  "reasoning": "brief explanation"
}`,
          },
        ],
      });

      const content = message.content[0];
      if (content.type === 'text') {
        const parsed = JSON.parse(content.text);
        const validated = ComplexityResponseSchema.parse(parsed);
        return validated;
      }
      throw new Error('Invalid response');
    } catch (error) {
      console.error('Error estimating complexity:', error);
      return {
        complexity: 'medium',
        estimatedHours: 8,
        suggestedBounty: 1600,
        reasoning: 'Unable to analyze, providing default estimate',
      };
    }
  }

  /**
   * Detect potentially fraudulent tasks
   */
  async detectFraud(taskDescription: string, creatorHistory: any): Promise<{
    isSuspicious: boolean;
    riskLevel: 'low' | 'medium' | 'high';
    flags: string[];
  }> {
    try {
      const message = await anthropic.messages.create({
        model: AI_MODEL,
        max_tokens: 300,
        messages: [
          {
            role: 'user',
            content: `Analyze this task for potential fraud indicators:

Task: ${taskDescription}
Creator Stats: ${JSON.stringify(creatorHistory)}

Check for:
- Vague or impossible requirements
- Too-good-to-be-true bounties
- Requests for personal information
- Suspicious language patterns
- Mismatch with creator history

Respond in JSON:
{
  "isSuspicious": boolean,
  "riskLevel": "low|medium|high",
  "flags": ["flag1", "flag2"]
}`,
          },
        ],
      });

      const content = message.content[0];
      if (content.type === 'text') {
        const parsed = JSON.parse(content.text);
        const validated = FraudDetectionSchema.parse(parsed);
        return validated;
      }
      throw new Error('Invalid response');
    } catch (error) {
      console.error('Error detecting fraud:', error);
      return {
        isSuspicious: false,
        riskLevel: 'low',
        flags: [],
      };
    }
  }

  /**
   * Recommend tasks to users based on their skills and history
   */
  async recommendTasks(userProfile: any, availableTasks: any[]): Promise<number[]> {
    try {
      const message = await anthropic.messages.create({
        model: AI_MODEL,
        max_tokens: 200,
        messages: [
          {
            role: 'user',
            content: `Recommend the top 5 tasks for this user based on their profile:

User Profile: ${JSON.stringify(userProfile)}
Available Tasks: ${JSON.stringify(availableTasks.map((t, i) => ({ id: i, ...t })))}

Return JSON array of task indices (0-based): [0, 2, 5, ...]`,
          },
        ],
      });

      const content = message.content[0];
      if (content.type === 'text') {
        const parsed = JSON.parse(content.text);
        const validated = TaskRecommendationSchema.parse(parsed);
        return validated;
      }
      return [];
    } catch (error) {
      console.error('Error recommending tasks:', error);
      return [];
    }
  }

  /**
   * Generate task template based on user input
   */
  async generateTaskTemplate(briefDescription: string): Promise<{
    title: string;
    description: string;
    requirements: string[];
    deliverables: string[];
  }> {
    try {
      const message = await anthropic.messages.create({
        model: AI_MODEL,
        max_tokens: 800,
        messages: [
          {
            role: 'user',
            content: `Create a detailed task template from this brief description:

"${briefDescription}"

Provide JSON:
{
  "title": "clear task title",
  "description": "detailed description",
  "requirements": ["requirement1", "requirement2"],
  "deliverables": ["deliverable1", "deliverable2"]
}`,
          },
        ],
      });

      const content = message.content[0];
      if (content.type === 'text') {
        const parsed = JSON.parse(content.text);
        const validated = TaskTemplateSchema.parse(parsed);
        return validated;
      }
      throw new Error('Invalid response');
    } catch (error) {
      console.error('Error generating template:', error);
      return {
        title: briefDescription,
        description: briefDescription,
        requirements: [],
        deliverables: [],
      };
    }
  }
}

export default new ClaudeAIService();
