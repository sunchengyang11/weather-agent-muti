import { Agent } from '@mastra/core/agent';
import { weatherTool } from '../tools';
import { scorers } from '../scorers';
import { LibSQLStore } from '@mastra/libsql';
import { Memory } from '@mastra/memory';

/**
 * ===== 原有 infra：完全保留 =====
 */
const memory = new Memory({
  storage: new LibSQLStore({
    id: 'weather-agent-memory-storage',
    url: 'file:../mastra.db',
  }),
});

/**
 * ===== 新增 Agent：只做拆分，不影响现有逻辑 =====
 */
export const activityPlannerAgent = new Agent({
  id: 'activity-planner-agent',
  name: 'Activity Planner Agent',
  instructions: `
You help users plan activities based on weather conditions.

- Assume weather data is already known or provided
- Focus on suggestions, not raw weather data
- Keep answers short and practical
`,
  model: process.env.MODEL || 'openai/gpt-4o',
  tools: { weatherTool },
  memory,
  scorers: {
    toolCallAppropriateness: {
      scorer: scorers.toolCallAppropriatenessScorer,
      sampling: { type: 'ratio', rate: 1 },
    },
    completeness: {
      scorer: scorers.completenessScorer,
      sampling: { type: 'ratio', rate: 1 },
    },
  },
});

/**
 * ===== 原有 Agent：不动，保证项目不受影响 =====
 */
export const weatherAgent = new Agent({
  id: 'weather-agent',
  name: 'Weather Agent',
  instructions: `
You are a helpful weather assistant that provides accurate weather information.

- Ask for a location if none is provided
- Translate location names to English if needed
- Include humidity, wind, precipitation
`,
  model: process.env.MODEL || 'openai/gpt-4o',
  tools: { weatherTool },
  memory,
  scorers: {
    toolCallAppropriateness: {
      scorer: scorers.toolCallAppropriatenessScorer,
      sampling: { type: 'ratio', rate: 1 },
    },
    completeness: {
      scorer: scorers.completenessScorer,
      sampling: { type: 'ratio', rate: 1 },
    },
    translation: {
      scorer: scorers.translationScorer,
      sampling: { type: 'ratio', rate: 1 },
    },
  },
});


