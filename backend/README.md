# Task-Chainz Backend

Node.js backend API server for Task-Chainz with AI features and IPFS integration.

## Features

- **AI Task Matching**: Claude API integration for intelligent task operations
- **IPFS Service**: Decentralized storage for task data
- **RESTful API**: Express-based API endpoints
- **Input Validation**: Express-validator for request validation

## API Endpoints

### Tasks
- `GET /api/tasks` - Get all tasks
- `GET /api/tasks/:id` - Get specific task
- `GET /api/tasks/user/:address` - Get tasks for a user

### AI
- `POST /api/ai/categorize` - Categorize a task
- `POST /api/ai/recommend` - Get task recommendations
- `POST /api/ai/fraud-detection` - Detect fraudulent content
- `POST /api/ai/quality-score` - Score task quality

### IPFS
- `POST /api/ipfs/upload` - Upload content to IPFS
- `GET /api/ipfs/:hash` - Retrieve content from IPFS
- `POST /api/ipfs/pin` - Pin content on IPFS

## Setup

### Install Dependencies
```bash
npm install
```

### Configure Environment
```bash
cp .env.example .env
# Edit .env with your values
```

Required environment variables:
- `ANTHROPIC_API_KEY` - Get from https://console.anthropic.com/
- `IPFS_HOST` - IPFS node host
- `IPFS_PORT` - IPFS node port
- `INFURA_PROJECT_ID` - (Optional) Infura IPFS credentials

### Development
```bash
npm run dev
```

Server runs on http://localhost:3001

### Production
```bash
npm start
```

## AI Features

### Task Categorization
Automatically categorizes tasks using Claude AI:
```json
POST /api/ai/categorize
{
  "title": "Build a React Dashboard",
  "description": "Create a responsive admin dashboard..."
}

Response:
{
  "category": "Development",
  "subcategory": "Frontend Development",
  "skills": ["React", "TypeScript", "CSS"],
  "difficulty": "Intermediate",
  "estimatedHours": 40
}
```

### Task Recommendations
Get personalized task recommendations:
```json
POST /api/ai/recommend
{
  "userSkills": ["React", "TypeScript"],
  "userHistory": {
    "tasksCompleted": 10,
    "averageRating": 4.5
  },
  "availableTasks": [...]
}
```

### Fraud Detection
Analyze content for potential fraud:
```json
POST /api/ai/fraud-detection
{
  "content": "Task description or submission",
  "context": { "userId": "0x...", "taskId": 1 }
}

Response:
{
  "isFraudulent": false,
  "confidence": 85,
  "reasons": [],
  "riskLevel": "Low"
}
```

## IPFS Integration

Upload and retrieve decentralized content:

```javascript
// Upload
POST /api/ipfs/upload
{ "content": { "title": "...", "description": "..." } }

// Retrieve
GET /api/ipfs/QmHash123...

// Pin
POST /api/ipfs/pin
{ "hash": "QmHash123..." }
```

## Error Handling

All endpoints return standardized error responses:
```json
{
  "error": "Error message",
  "details": "Additional context"
}
```

## Rate Limiting

Consider implementing rate limiting for production:
- Use `express-rate-limit` package
- Limit AI API calls per user
- Throttle IPFS operations

## Testing

```bash
npm test
```

## Deployment

### Railway
```bash
railway init
railway up
```

### AWS/Heroku
Standard Node.js deployment process applies.

## Monitoring

Recommended tools:
- PM2 for process management
- Winston for logging
- Sentry for error tracking
