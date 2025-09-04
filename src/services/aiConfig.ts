// AI Configuration for ChatGPT API
export const AI_CONFIG = {
  // API Configuration
  OPENAI_API_KEY: process.env.REACT_APP_OPENAI_API_KEY || '',
  MODEL: 'gpt-4o-mini', // Using the most cost-effective model
  MAX_TOKENS: 2000,
  TEMPERATURE: 0.3, // Lower temperature for more consistent, logical responses
  
  // Feature Flags
  ENABLE_AI_SUGGESTIONS: true,
  ENABLE_INVIGILATION_AI: true,
  ENABLE_TIMETABLE_AI: true,
  
  // Rate Limiting
  MAX_REQUESTS_PER_MINUTE: 10,
  REQUEST_TIMEOUT: 30000, // 30 seconds
  
  // Safety Settings
  MAX_DATA_SENT_TO_API: 5000, // Maximum characters to send to API
  SENSITIVE_FIELDS: ['password', 'apiKey', 'secret'], // Fields to never send
};

// AI Prompt Templates
export const AI_PROMPTS = {
  INVIGILATION_SUGGESTIONS: `
    You are an expert school administrator helping with exam invigilation scheduling.
    Analyze the provided exam schedule, invigilator availability, and room assignments.
    Provide specific, actionable suggestions for:
    1. Optimal invigilator assignments based on workload and expertise
    2. Room allocation optimization for student capacity and efficiency
    3. Conflict detection and resolution suggestions
    4. Workload balancing recommendations
    
    Format your response as:
    - Clear, numbered suggestions
    - Specific reasoning for each suggestion
    - Alternative options when applicable
    - Priority level (High/Medium/Low) for each suggestion
    
    Keep suggestions practical and implementable.
  `,
  
  TIMETABLE_OPTIMIZATION: `
    You are an expert educational scheduler analyzing exam timetables.
    Review the provided exam schedule and suggest improvements for:
    1. Student workload distribution across days
    2. Break time optimization between exams
    3. Resource utilization efficiency
    4. Potential scheduling conflicts
    
    Provide specific, actionable recommendations with clear reasoning.
  `
};

// AI Response Types
export interface AISuggestion {
  id: string;
  type: 'invigilation' | 'timetable' | 'conflict';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  reasoning: string;
  action: string;
  alternatives?: string[];
  impact: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface AIAnalysisResult {
  suggestions: AISuggestion[];
  summary: string;
  confidence: number;
  timestamp: string;
  dataAnalyzed: string[];
}
