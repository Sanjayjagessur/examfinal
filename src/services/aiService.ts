import OpenAI from 'openai';
import { AI_CONFIG, AI_PROMPTS, AISuggestion, AIAnalysisResult } from './aiConfig';

class AIService {
  private openai: OpenAI | null = null;
  private requestCount = 0;
  private lastRequestTime = 0;
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    try {
      if (AI_CONFIG.OPENAI_API_KEY) {
        this.openai = new OpenAI({
          apiKey: AI_CONFIG.OPENAI_API_KEY,
          dangerouslyAllowBrowser: true, // Required for browser usage
        });
        this.isInitialized = true;
        console.log('AI Service initialized successfully');
      } else {
        console.warn('OpenAI API key not found. AI features will be disabled.');
        this.isInitialized = false;
      }
    } catch (error) {
      console.error('Failed to initialize AI Service:', error);
      this.isInitialized = false;
    }
  }

  // Check if AI service is available
  public isAvailable(): boolean {
    return this.isInitialized && this.openai !== null;
  }

  // Rate limiting check
  private checkRateLimit(): boolean {
    const now = Date.now();
    if (now - this.lastRequestTime < 60000) { // Within 1 minute
      if (this.requestCount >= AI_CONFIG.MAX_REQUESTS_PER_MINUTE) {
        return false;
      }
    } else {
      this.requestCount = 0;
      this.lastRequestTime = now;
    }
    return true;
  }

  // Sanitize data before sending to API
  private sanitizeData(data: any): string {
    try {
      const sanitized = JSON.stringify(data, (key, value) => {
        if (AI_CONFIG.SENSITIVE_FIELDS.includes(key)) {
          return '[REDACTED]';
        }
        return value;
      });
      
      if (sanitized.length > AI_CONFIG.MAX_DATA_SENT_TO_API) {
        return sanitized.substring(0, AI_CONFIG.MAX_DATA_SENT_TO_API) + '...';
      }
      
      return sanitized;
    } catch (error) {
      console.error('Error sanitizing data:', error);
      return '{}';
    }
  }

  // Get invigilation suggestions from AI
  public async getInvigilationSuggestions(
    examCards: any[],
    educators: any[],
    rooms: any[],
    examInvigilations: any[]
  ): Promise<AIAnalysisResult> {
    if (!this.isAvailable()) {
      throw new Error('AI service is not available');
    }

    if (!this.checkRateLimit()) {
      throw new Error('Rate limit exceeded. Please wait before making another request.');
    }

    try {
      this.requestCount++;

      // Prepare data for analysis
      const analysisData = {
        examCards: examCards.filter(card => card.date), // Only scheduled exams
        educators: educators.map(e => ({
          id: e.id,
          name: e.name,
          totalSlots: e.totalSlots,
          slotsByDate: e.slotsByDate
        })),
        rooms: rooms.map(r => ({
          id: r.id,
          name: r.name,
          type: r.type,
          capacity: r.capacity
        })),
        examInvigilations: examInvigilations.map(ei => ({
          id: ei.id,
          examCardId: ei.examCardId,
          date: ei.date,
          startTime: ei.startTime,
          endTime: ei.endTime,
          invigilatorsNeeded: ei.invigilatorsNeeded,
          roomsNeeded: ei.roomsNeeded,
          useHall: ei.useHall,
          selectedHall: ei.selectedHall,
          selectedRooms: ei.selectedRooms,
          assignedInvigilators: ei.assignedInvigilators,
          studentCount: ei.studentCount
        }))
      };

      const sanitizedData = this.sanitizeData(analysisData);
      
      const prompt = `${AI_PROMPTS.INVIGILATION_SUGGESTIONS}

Data to analyze:
${sanitizedData}

Please provide specific, actionable suggestions for improving the invigilation schedule.`;

      const response = await this.openai!.chat.completions.create({
        model: AI_CONFIG.MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are an expert school administrator specializing in exam invigilation scheduling. Provide practical, actionable advice.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: AI_CONFIG.MAX_TOKENS,
        temperature: AI_CONFIG.TEMPERATURE,
      });

      const aiResponse = response.choices[0]?.message?.content || '';
      
      // Parse AI response into structured suggestions
      const suggestions = this.parseAIResponse(aiResponse, 'invigilation');
      
      return {
        suggestions,
        summary: this.generateSummary(suggestions),
        confidence: this.calculateConfidence(aiResponse),
        timestamp: new Date().toISOString(),
        dataAnalyzed: Object.keys(analysisData)
      };

    } catch (error) {
      console.error('Error getting AI suggestions:', error);
      throw new Error(`AI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get timetable optimization suggestions
  public async getTimetableSuggestions(examCards: any[]): Promise<AIAnalysisResult> {
    if (!this.isAvailable()) {
      throw new Error('AI service is not available');
    }

    if (!this.checkRateLimit()) {
      throw new Error('Rate limit exceeded. Please wait before making another request.');
    }

    try {
      this.requestCount++;

      const scheduledExams = examCards.filter(card => card.date);
      const sanitizedData = this.sanitizeData(scheduledExams);
      
      const prompt = `${AI_PROMPTS.TIMETABLE_OPTIMIZATION}

Exam schedule to analyze:
${sanitizedData}

Please provide specific recommendations for optimizing this exam timetable.`;

      const response = await this.openai!.chat.completions.create({
        model: AI_CONFIG.MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are an expert educational scheduler. Provide practical optimization advice.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: AI_CONFIG.MAX_TOKENS,
        temperature: AI_CONFIG.TEMPERATURE,
      });

      const aiResponse = response.choices[0]?.message?.content || '';
      const suggestions = this.parseAIResponse(aiResponse, 'timetable');
      
      return {
        suggestions,
        summary: this.generateSummary(suggestions),
        confidence: this.calculateConfidence(aiResponse),
        timestamp: new Date().toISOString(),
        dataAnalyzed: ['examCards']
      };

    } catch (error) {
      console.error('Error getting timetable suggestions:', error);
      throw new Error(`AI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Parse AI response into structured suggestions
  private parseAIResponse(response: string, type: 'invigilation' | 'timetable'): AISuggestion[] {
    try {
      // Simple parsing - in production, you might want more sophisticated parsing
      const suggestions: AISuggestion[] = [];
      const lines = response.split('\n').filter(line => line.trim());
      
      let currentSuggestion: Partial<AISuggestion> = {};
      let suggestionIndex = 0;

      for (const line of lines) {
        const trimmedLine = line.trim();
        
        if (trimmedLine.match(/^\d+\./)) {
          // New suggestion
          if (currentSuggestion.title) {
            suggestions.push(this.completeSuggestion(currentSuggestion, suggestionIndex, type));
            suggestionIndex++;
          }
          
          currentSuggestion = {
            title: trimmedLine.replace(/^\d+\.\s*/, ''),
            type,
            priority: 'medium',
            difficulty: 'medium'
          };
        } else if (trimmedLine.toLowerCase().includes('priority') || trimmedLine.toLowerCase().includes('high') || trimmedLine.toLowerCase().includes('medium') || trimmedLine.toLowerCase().includes('low')) {
          if (trimmedLine.toLowerCase().includes('high')) currentSuggestion.priority = 'high';
          else if (trimmedLine.toLowerCase().includes('low')) currentSuggestion.priority = 'low';
          else currentSuggestion.priority = 'medium';
        } else if (currentSuggestion.title) {
          // Add to current suggestion
          if (!currentSuggestion.description) {
            currentSuggestion.description = trimmedLine;
          } else if (!currentSuggestion.reasoning) {
            currentSuggestion.reasoning = trimmedLine;
          } else if (!currentSuggestion.action) {
            currentSuggestion.action = trimmedLine;
          }
        }
      }

      // Add the last suggestion
      if (currentSuggestion.title) {
        suggestions.push(this.completeSuggestion(currentSuggestion, suggestionIndex, type));
      }

      return suggestions;
    } catch (error) {
      console.error('Error parsing AI response:', error);
      return [];
    }
  }

  // Complete a suggestion with default values
  private completeSuggestion(suggestion: Partial<AISuggestion>, index: number, type: 'invigilation' | 'timetable'): AISuggestion {
    return {
      id: `ai-suggestion-${type}-${index}`,
      type,
      priority: suggestion.priority || 'medium',
      title: suggestion.title || 'AI Suggestion',
      description: suggestion.description || 'No description provided',
      reasoning: suggestion.reasoning || 'AI analysis suggests this improvement',
      action: suggestion.action || 'Consider implementing this suggestion',
      impact: 'Improves efficiency and reduces conflicts',
      difficulty: suggestion.difficulty || 'medium'
    };
  }

  // Generate summary from suggestions
  private generateSummary(suggestions: AISuggestion[]): string {
    if (suggestions.length === 0) return 'No suggestions available';
    
    const highPriority = suggestions.filter(s => s.priority === 'high').length;
    const mediumPriority = suggestions.filter(s => s.priority === 'medium').length;
    const lowPriority = suggestions.filter(s => s.priority === 'low').length;
    
    return `AI provided ${suggestions.length} suggestions: ${highPriority} high priority, ${mediumPriority} medium priority, ${lowPriority} low priority.`;
  }

  // Calculate confidence based on response quality
  private calculateConfidence(response: string): number {
    const hasStructuredContent = response.includes('1.') || response.includes('2.') || response.includes('3.');
    const hasReasoning = response.toLowerCase().includes('because') || response.toLowerCase().includes('reason');
    const hasActions = response.toLowerCase().includes('suggest') || response.toLowerCase().includes('recommend');
    
    let confidence = 0.5; // Base confidence
    
    if (hasStructuredContent) confidence += 0.2;
    if (hasReasoning) confidence += 0.2;
    if (hasActions) confidence += 0.1;
    
    return Math.min(confidence, 1.0);
  }

  // Reset rate limiting (useful for testing)
  public resetRateLimit() {
    this.requestCount = 0;
    this.lastRequestTime = 0;
  }

  // Get service status
  public getStatus() {
    return {
      isAvailable: this.isAvailable(),
      isInitialized: this.isInitialized,
      requestCount: this.requestCount,
      lastRequestTime: this.lastRequestTime,
      rateLimitExceeded: !this.checkRateLimit()
    };
  }
}

// Export singleton instance
export const aiService = new AIService();
export default aiService;
