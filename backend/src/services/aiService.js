const Anthropic = require('@anthropic-ai/sdk');

class AIService {
  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * Categorizes a task using Claude API
   */
  async categorizeTask(taskTitle, taskDescription) {
    try {
      const message = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: `Categorize this task and extract key skills needed. Return a JSON response.

Task Title: ${taskTitle}
Task Description: ${taskDescription}

Return format:
{
  "category": "one of: Development, Design, Marketing, Writing, Data, Other",
  "subcategory": "specific subcategory",
  "skills": ["skill1", "skill2", "skill3"],
  "difficulty": "one of: Beginner, Intermediate, Advanced",
  "estimatedHours": number
}`
          }
        ]
      });

      const content = message.content[0].text;
      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      throw new Error('Failed to parse AI response');
    } catch (error) {
      console.error('AI categorization error:', error);
      throw error;
    }
  }

  /**
   * Recommends tasks to a user based on their skills and history
   */
  async recommendTasks(userSkills, userHistory, availableTasks) {
    try {
      const message = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: `Recommend the best matching tasks for this user. Return task IDs in order of best fit.

User Skills: ${JSON.stringify(userSkills)}
User History: Completed ${userHistory.tasksCompleted} tasks, Average rating: ${userHistory.averageRating}/5

Available Tasks:
${JSON.stringify(availableTasks, null, 2)}

Return format:
{
  "recommendations": [
    {
      "taskId": "task_id",
      "matchScore": 0-100,
      "reason": "brief explanation"
    }
  ]
}`
          }
        ]
      });

      const content = message.content[0].text;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      throw new Error('Failed to parse AI response');
    } catch (error) {
      console.error('AI recommendation error:', error);
      throw error;
    }
  }

  /**
   * Detects potential fraud in task submissions or descriptions
   */
  async detectFraud(content, context = {}) {
    try {
      const message = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: `Analyze this content for potential fraud, spam, or malicious intent.

Content: ${content}
Context: ${JSON.stringify(context)}

Return format:
{
  "isFraudulent": boolean,
  "confidence": 0-100,
  "reasons": ["reason1", "reason2"],
  "riskLevel": "one of: Low, Medium, High, Critical"
}`
          }
        ]
      });

      const responseContent = message.content[0].text;
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      throw new Error('Failed to parse AI response');
    } catch (error) {
      console.error('AI fraud detection error:', error);
      throw error;
    }
  }

  /**
   * Generates a task quality score
   */
  async scoreTaskQuality(taskData) {
    try {
      const message = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: `Score the quality of this task posting.

Task Data: ${JSON.stringify(taskData)}

Return format:
{
  "qualityScore": 0-100,
  "clarity": 0-100,
  "completeness": 0-100,
  "suggestions": ["improvement1", "improvement2"]
}`
          }
        ]
      });

      const content = message.content[0].text;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      throw new Error('Failed to parse AI response');
    } catch (error) {
      console.error('AI quality scoring error:', error);
      throw error;
    }
  }
}

module.exports = new AIService();
