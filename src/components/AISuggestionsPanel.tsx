import React, { useState } from 'react';
import { 
  Brain, 
  Lightbulb, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  TrendingUp,
  Zap,
  Info,
  Settings
} from 'lucide-react';
import { AISuggestion, AIAnalysisResult } from '../services/aiConfig';

interface AISuggestionsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  suggestions: AIAnalysisResult | null;
  isLoading: boolean;
  onApplySuggestion?: (suggestion: AISuggestion) => void;
  onIgnoreSuggestion?: (suggestionId: string) => void;
}

const AISuggestionsPanel: React.FC<AISuggestionsPanelProps> = ({
  isOpen,
  onClose,
  suggestions,
  isLoading,
  onApplySuggestion,
  onIgnoreSuggestion
}) => {
  const [expandedSuggestion, setExpandedSuggestion] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  if (!isOpen) return null;

  const filteredSuggestions = suggestions?.suggestions.filter(suggestion => 
    filterPriority === 'all' || suggestion.priority === filterPriority
  ) || [];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertTriangle size={16} className="text-red-600" />;
      case 'medium': return <Clock size={16} className="text-yellow-600" />;
      case 'low': return <CheckCircle size={16} className="text-green-600" />;
      default: return <Info size={16} className="text-gray-600" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'hard': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white border-l border-gray-200 shadow-xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-indigo-50">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Brain size={20} className="text-purple-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">AI Suggestions</h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <XCircle size={20} />
        </button>
      </div>

      {/* Filter Controls */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700">Filter by Priority:</span>
          <div className="flex items-center space-x-1">
            <Settings size={14} className="text-gray-500" />
          </div>
        </div>
        <div className="flex space-x-2">
          {(['all', 'high', 'medium', 'low'] as const).map((priority) => (
            <button
              key={priority}
              onClick={() => setFilterPriority(priority)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                filterPriority === priority
                  ? 'bg-purple-100 text-purple-700 border border-purple-200'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {priority === 'all' ? 'All' : priority.charAt(0).toUpperCase() + priority.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">AI is analyzing your data...</p>
              <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
            </div>
          </div>
        ) : suggestions ? (
          <div className="p-4 space-y-4">
            {/* Summary */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <Info size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-blue-800 mb-1">AI Analysis Summary</p>
                  <p className="text-blue-700">{suggestions.summary}</p>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-blue-600">
                    <span>Confidence: {Math.round(suggestions.confidence * 100)}%</span>
                    <span>Analyzed: {suggestions.dataAnalyzed.join(', ')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Suggestions */}
            {filteredSuggestions.length > 0 ? (
              filteredSuggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Suggestion Header */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Lightbulb size={16} className="text-yellow-600" />
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(suggestion.priority)}`}>
                          {getPriorityIcon(suggestion.priority)}
                          <span className="ml-1">{suggestion.priority.toUpperCase()}</span>
                        </span>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(suggestion.difficulty)}`}>
                        {suggestion.difficulty}
                      </span>
                    </div>

                    <h3 className="font-medium text-gray-900 mb-2">{suggestion.title}</h3>
                    <p className="text-sm text-gray-600 mb-3">{suggestion.description}</p>

                    {/* Expandable Details */}
                    <button
                      onClick={() => setExpandedSuggestion(
                        expandedSuggestion === suggestion.id ? null : suggestion.id
                      )}
                      className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center space-x-1"
                    >
                      <span>
                        {expandedSuggestion === suggestion.id ? 'Show less' : 'Show details'}
                      </span>
                      <TrendingUp size={14} className={`transition-transform ${
                        expandedSuggestion === suggestion.id ? 'rotate-180' : ''
                      }`} />
                    </button>
                  </div>

                  {/* Expanded Content */}
                  {expandedSuggestion === suggestion.id && (
                    <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-3">
                      <div>
                        <span className="text-xs font-medium text-gray-500 uppercase">Reasoning</span>
                        <p className="text-sm text-gray-700 mt-1">{suggestion.reasoning}</p>
                      </div>
                      
                      <div>
                        <span className="text-xs font-medium text-gray-500 uppercase">Recommended Action</span>
                        <p className="text-sm text-gray-700 mt-1">{suggestion.action}</p>
                      </div>

                      {suggestion.alternatives && suggestion.alternatives.length > 0 && (
                        <div>
                          <span className="text-xs font-medium text-gray-500 uppercase">Alternatives</span>
                          <ul className="text-sm text-gray-700 mt-1 space-y-1">
                            {suggestion.alternatives.map((alt, index) => (
                              <li key={index} className="flex items-start space-x-2">
                                <span className="text-purple-500 mt-1">•</span>
                                <span>{alt}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div>
                        <span className="text-xs font-medium text-gray-500 uppercase">Expected Impact</span>
                        <p className="text-sm text-gray-700 mt-1">{suggestion.impact}</p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex space-x-2 pt-2">
                        {onApplySuggestion && (
                          <button
                            onClick={() => onApplySuggestion(suggestion)}
                            className="flex-1 bg-purple-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2"
                          >
                            <CheckCircle size={16} />
                            <span>Apply</span>
                          </button>
                        )}
                        
                        {onIgnoreSuggestion && (
                          <button
                            onClick={() => onIgnoreSuggestion(suggestion.id)}
                            className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
                          >
                            <XCircle size={16} />
                            <span>Ignore</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Zap size={48} className="mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No suggestions found</p>
                <p className="text-sm">Try adjusting the priority filter or refresh the analysis</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Brain size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No AI analysis yet</p>
            <p className="text-sm">Click "Get AI Suggestions" to start analyzing your data</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-500 text-center">
          <p>AI suggestions are recommendations only</p>
          <p>You maintain full control over all decisions</p>
        </div>
      </div>
    </div>
  );
};

export default AISuggestionsPanel;
