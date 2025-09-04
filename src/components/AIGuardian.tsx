import React, { useState, useEffect, useCallback } from 'react';
import { 
  Brain, 
  AlertTriangle, 
  CheckCircle, 
  Zap, 
  Users, 
  Clock, 
  Target,
  Lightbulb,
  RefreshCw,
  Shield
} from 'lucide-react';

interface Educator {
  id: string;
  name: string;
}

interface Room {
  id: string;
  name: string;
  capacity: number;
}

interface ExamSession {
  id: string;
  examId: string;
  examName: string;
  examDate: string;
  startTime: string;
  endTime: string;
  duration: number;
  sessionNumber: number;
  sessionStartTime: string;
  sessionEndTime: string;
  roomsNeeded: number;
  assignedRooms: string[];
  status: 'pending' | 'assigned' | 'completed';
}

interface RoomSession {
  id: string;
  examSessionId: string;
  roomId: string;
  roomName: string;
  sessionNumber: number;
  sessionStartTime: string;
  sessionEndTime: string;
  assignedInvigilator: string | null;
}

interface AIGuardianProps {
  educators: Educator[];
  rooms: Room[];
  examSessions: ExamSession[];
  roomSessions: RoomSession[];
  onUpdateRoomSessions: (updatedSessions: RoomSession[]) => void;
}

interface AIInsight {
  type: 'warning' | 'error' | 'suggestion' | 'success';
  message: string;
  severity: 'low' | 'medium' | 'high';
  action?: string;
}

interface WorkloadAnalysis {
  educatorId: string;
  educatorName: string;
  currentSessions: number;
  recommendedMax: number;
  status: 'underloaded' | 'balanced' | 'overloaded';
  score: number; // 0-100, higher is better
}

const AIGuardian: React.FC<AIGuardianProps> = ({
  educators,
  rooms,
  examSessions,
  roomSessions,
  onUpdateRoomSessions
}) => {
  const [isWatching, setIsWatching] = useState(true);
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [workloadAnalysis, setWorkloadAnalysis] = useState<WorkloadAnalysis[]>([]);
  const [aiRecommendations, setAiRecommendations] = useState<string[]>([]);

  // Analyze workload distribution across educators
  const analyzeWorkloadDistribution = useCallback((): WorkloadAnalysis[] => {
    const totalSessions = roomSessions.filter(rs => rs.assignedInvigilator).length;
    const avgSessionsPerEducator = totalSessions / Math.max(educators.length, 1);
    const recommendedMax = Math.ceil(avgSessionsPerEducator * 1.5);

    return educators.map(educator => {
      const currentSessions = roomSessions.filter(rs => rs.assignedInvigilator === educator.id).length;
      
      let status: 'underloaded' | 'balanced' | 'overloaded';
      if (currentSessions < avgSessionsPerEducator * 0.7) status = 'underloaded';
      else if (currentSessions > recommendedMax) status = 'overloaded';
      else status = 'balanced';

      const score = Math.max(0, 100 - Math.abs(currentSessions - avgSessionsPerEducator) * 20);

      return {
        educatorId: educator.id,
        educatorName: educator.name,
        currentSessions,
        recommendedMax,
        status,
        score
      };
    });
  }, [roomSessions, educators]);

  // Detect time conflicts in the schedule
  const detectTimeConflicts = useCallback(() => {
    const conflicts: Array<{educator: string, sessions: string[]}> = [];
    
    educators.forEach(educator => {
      const educatorSessions = roomSessions.filter(rs => rs.assignedInvigilator === educator.id);
      
      // Group by date and check for overlapping times
      const sessionsByDate: { [date: string]: RoomSession[] } = {};
      educatorSessions.forEach(session => {
        const examSession = examSessions.find(es => es.id === session.examSessionId);
        if (examSession) {
          const date = examSession.examDate;
          if (!sessionsByDate[date]) sessionsByDate[date] = [];
          sessionsByDate[date].push(session);
        }
      });

      // Check for conflicts within each date
      Object.entries(sessionsByDate).forEach(([date, sessions]) => {
        if (sessions.length > 1) {
          // Sort by start time
          sessions.sort((a, b) => a.sessionStartTime.localeCompare(b.sessionStartTime));
          
          // Check for overlaps
          for (let i = 0; i < sessions.length - 1; i++) {
            const current = sessions[i];
            const next = sessions[i + 1];
            
            if (current.sessionEndTime > next.sessionStartTime) {
              conflicts.push({
                educator: educator.name,
                sessions: [current.roomName, next.roomName]
              });
            }
          }
        }
      });
    });

    return conflicts;
  }, [roomSessions, educators, examSessions]);

  // Analyze room allocation efficiency
  const analyzeRoomEfficiency = useCallback(() => {
    let totalScore = 0;
    let totalRooms = 0;

    examSessions.forEach(session => {
      if (session.assignedRooms.length > 0) {
        // Check if room capacities match student count (if available)
        // For now, just check if rooms are assigned
        const efficiency = session.assignedRooms.length === session.roomsNeeded ? 100 : 50;
        totalScore += efficiency;
        totalRooms++;
      }
    });

    return {
      score: totalRooms > 0 ? totalScore / totalRooms : 100,
      totalRooms
    };
  }, [examSessions]);

  // Analyze the entire system for insights
  const analyzeSystem = useCallback(() => {
    const insights: AIInsight[] = [];
    
    // Check for unassigned sessions
    const unassignedSessions = roomSessions.filter(rs => !rs.assignedInvigilator);
    if (unassignedSessions.length > 0) {
      insights.push({
        type: 'warning',
        message: `${unassignedSessions.length} room sessions still need invigilators assigned`,
        severity: 'medium',
        action: 'Consider using Auto-Fill to complete assignments'
      });
    }

    // Check for workload imbalances
    const workloads = analyzeWorkloadDistribution();
    const overloaded = workloads.filter(w => w.status === 'overloaded');
    if (overloaded.length > 0) {
      insights.push({
        type: 'error',
        message: `${overloaded.length} educators are overloaded with sessions`,
        severity: 'high',
        action: 'Redistribute sessions to balance workload'
      });
    }

    // Check for time conflicts
    const conflicts = detectTimeConflicts();
    if (conflicts.length > 0) {
      insights.push({
        type: 'error',
        message: `${conflicts.length} time conflicts detected in invigilation schedule`,
        severity: 'high',
        action: 'Review and resolve scheduling conflicts'
      });
    }

    // Check for room efficiency
    const roomEfficiency = analyzeRoomEfficiency();
    if (roomEfficiency.score < 70) {
      insights.push({
        type: 'suggestion',
        message: 'Room allocation could be more efficient',
        severity: 'low',
        action: 'Consider optimizing room assignments'
      });
    }

    setAiInsights(insights);
    setWorkloadAnalysis(workloads);
  }, [roomSessions, analyzeWorkloadDistribution, detectTimeConflicts, analyzeRoomEfficiency]);

  // AI Guardian watching over the system
  useEffect(() => {
    if (isWatching) {
      analyzeSystem();
    }
  }, [isWatching, analyzeSystem]);

  // AI Auto-Fill function - the main feature
  const autoFillInvigilationSlots = async () => {
    setIsAutoFilling(true);
    
    try {
      // Create a copy of room sessions to work with
      const updatedSessions = [...roomSessions];
      const unassignedSessions = updatedSessions.filter(rs => !rs.assignedInvigilator);
      
      if (unassignedSessions.length === 0) {
        setAiInsights(prev => [...prev, {
          type: 'success',
          message: 'All invigilation slots are already filled!',
          severity: 'low'
        }]);
        return;
      }

      // AI-powered allocation algorithm
      const allocationResult = await performAIAllocation(unassignedSessions);
      
      if (allocationResult.success) {
        // Apply the AI allocations
        const finalSessions = updatedSessions.map(session => {
          const aiAllocation = allocationResult.allocations.find(a => a.sessionId === session.id);
          if (aiAllocation) {
            return { ...session, assignedInvigilator: aiAllocation.educatorId };
          }
          return session;
        });

        onUpdateRoomSessions(finalSessions);
        
        setAiInsights(prev => [...prev, {
          type: 'success',
          message: `AI successfully allocated ${allocationResult.allocations.length} invigilators with ${allocationResult.fairnessScore}% fairness score`,
          severity: 'low'
        }]);
      } else {
        setAiInsights(prev => [...prev, {
          type: 'error',
          message: 'AI allocation failed. Please check system requirements.',
          severity: 'high'
        }]);
      }
    } catch (error) {
      setAiInsights(prev => [...prev, {
        type: 'error',
        message: 'Error during AI allocation. Please try again.',
        severity: 'high'
      }]);
    } finally {
      setIsAutoFilling(false);
    }
  };

  // Core AI allocation algorithm
  const performAIAllocation = async (unassignedSessions: RoomSession[]) => {
    // This is where we'd call the ChatGPT API for complex decisions
    // For now, implementing a smart algorithm locally
    
    const allocations: Array<{sessionId: string, educatorId: string}> = [];
    const educatorWorkloads = new Map<string, number>();
    
    // Initialize workloads
    educators.forEach(educator => {
      const currentWorkload = roomSessions.filter(rs => rs.assignedInvigilator === educator.id).length;
      educatorWorkloads.set(educator.id, currentWorkload);
    });

    // Sort sessions by priority (earlier dates first, then by time)
    const sortedSessions = unassignedSessions.sort((a, b) => {
      const examA = examSessions.find(es => es.id === a.examSessionId);
      const examB = examSessions.find(es => es.id === b.examSessionId);
      
      if (!examA || !examB) return 0;
      
      // First by date
      if (examA.examDate !== examB.examDate) {
        return examA.examDate.localeCompare(examB.examDate);
      }
      
      // Then by time
      return a.sessionStartTime.localeCompare(b.sessionStartTime);
    });

    // Allocate each session
    for (const session of sortedSessions) {
      const examSession = examSessions.find(es => es.id === session.examSessionId);
      if (!examSession) continue;

      // Find available educators (not assigned to overlapping sessions)
      const availableEducators = educators.filter(educator => {
        // Check if educator is already assigned to this session
        if (roomSessions.some(rs => 
          rs.examSessionId === session.examSessionId && 
          rs.assignedInvigilator === educator.id
        )) {
          return false;
        }

        // Check for time conflicts on the same date
        const hasConflict = roomSessions.some(otherSession => {
          if (otherSession.assignedInvigilator !== educator.id) return false;
          
          const otherExamSession = examSessions.find(es => es.id === otherSession.examSessionId);
          if (!otherExamSession) return false;
          
          return otherExamSession.examDate === examSession.examDate &&
                 otherSession.sessionNumber === session.sessionNumber;
        });

        return !hasConflict;
      });

      if (availableEducators.length === 0) {
        // No available educators, skip this session
        continue;
      }

      // Choose educator with lowest workload (fairness algorithm)
      const bestEducator = availableEducators.reduce((best, current) => {
        const bestWorkload = educatorWorkloads.get(best.id) || 0;
        const currentWorkload = educatorWorkloads.get(current.id) || 0;
        return currentWorkload < bestWorkload ? current : best;
      });

      // Assign the educator
      allocations.push({
        sessionId: session.id,
        educatorId: bestEducator.id
      });

      // Update workload
      const currentWorkload = educatorWorkloads.get(bestEducator.id) || 0;
      educatorWorkloads.set(bestEducator.id, currentWorkload + 1);
    }

    // Calculate fairness score
    const workloads = Array.from(educatorWorkloads.values());
    const avgWorkload = workloads.reduce((sum, w) => sum + w, 0) / workloads.length;
    const variance = workloads.reduce((sum, w) => sum + Math.pow(w - avgWorkload, 2), 0) / workloads.length;
    const fairnessScore = Math.max(0, 100 - Math.sqrt(variance) * 10);

    return {
      success: true,
      allocations,
      fairnessScore: Math.round(fairnessScore)
    };
  };

  // Generate AI recommendations
  const generateAIRecommendations = useCallback(() => {
    const recommendations: string[] = [];
    
    if (workloadAnalysis.length > 0) {
      const overloaded = workloadAnalysis.filter(w => w.status === 'overloaded');
      const underloaded = workloadAnalysis.filter(w => w.status === 'underloaded');
      
      if (overloaded.length > 0) {
        recommendations.push(`Consider redistributing ${overloaded.length} overloaded educators' sessions`);
      }
      
      if (underloaded.length > 0) {
        recommendations.push(`${underloaded.length} educators are underloaded - assign more sessions`);
      }
    }

    const unassignedCount = roomSessions.filter(rs => !rs.assignedInvigilator).length;
    if (unassignedCount > 0) {
      recommendations.push(`Use Auto-Fill to complete ${unassignedCount} remaining assignments`);
    }

    setAiRecommendations(recommendations);
  }, [workloadAnalysis, roomSessions]);

  useEffect(() => {
    generateAIRecommendations();
  }, [workloadAnalysis, roomSessions, generateAIRecommendations]);

  return (
    <div className="h-full bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI Guardian</h1>
              <p className="text-gray-600 mt-1">Your intelligent invigilation assistant</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsWatching(!isWatching)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium ${
                isWatching 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : 'bg-gray-100 text-gray-800 border border-gray-200'
              }`}
            >
              {isWatching ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
              <span>{isWatching ? 'Watching' : 'Paused'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* AI Auto-Fill Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Zap className="h-8 w-8 text-yellow-500" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">AI Auto-Fill</h2>
                <p className="text-gray-600">Automatically fill all invigilation slots with fairness</p>
              </div>
            </div>
            
            <button
              onClick={autoFillInvigilationSlots}
              disabled={isAutoFilling || roomSessions.filter(rs => !rs.assignedInvigilator).length === 0}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-medium"
            >
              {isAutoFilling ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  <span>AI Working...</span>
                </>
              ) : (
                <>
                  <Brain className="h-5 w-5" />
                  <span>Auto-Fill Slots</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-2 mb-2">
                <Users className="h-5 w-5 text-blue-600" />
                <span className="font-medium text-blue-800">Total Educators</span>
              </div>
              <p className="text-2xl font-bold text-blue-900">{educators.length}</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center space-x-2 mb-2">
                <Target className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-800">Assigned Sessions</span>
              </div>
              <p className="text-2xl font-bold text-green-900">
                {roomSessions.filter(rs => rs.assignedInvigilator).length}
              </p>
            </div>
            
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="h-5 w-5 text-orange-600" />
                <span className="font-medium text-orange-800">Pending Sessions</span>
              </div>
              <p className="text-2xl font-bold text-orange-900">
                {roomSessions.filter(rs => !rs.assignedInvigilator).length}
              </p>
            </div>
          </div>
        </div>

        {/* AI Insights Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Real-time Insights */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Shield className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">AI Insights</h3>
            </div>
            
            <div className="space-y-3">
              {aiInsights.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-2" />
                  <p>All systems running smoothly!</p>
                </div>
              ) : (
                aiInsights.slice(0, 5).map((insight, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border-l-4 ${
                      insight.type === 'error' ? 'border-red-500 bg-red-50' :
                      insight.type === 'warning' ? 'border-yellow-500 bg-yellow-50' :
                      insight.type === 'suggestion' ? 'border-blue-500 bg-blue-50' :
                      'border-green-500 bg-green-50'
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      {insight.type === 'error' && <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />}
                      {insight.type === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />}
                      {insight.type === 'suggestion' && <Lightbulb className="h-4 w-4 text-blue-600 mt-0.5" />}
                      {insight.type === 'success' && <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />}
                      
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${
                          insight.type === 'error' ? 'text-red-800' :
                          insight.type === 'warning' ? 'text-yellow-800' :
                          insight.type === 'suggestion' ? 'text-blue-800' :
                          'text-green-800'
                        }`}>
                          {insight.message}
                        </p>
                        {insight.action && (
                          <p className="text-xs text-gray-600 mt-1">{insight.action}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Workload Analysis */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Target className="h-6 w-6 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Workload Analysis</h3>
            </div>
            
            <div className="space-y-3">
              {workloadAnalysis.map((analysis) => (
                <div key={analysis.educatorId} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">{analysis.educatorName}</span>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      analysis.status === 'overloaded' ? 'bg-red-100 text-red-800' :
                      analysis.status === 'balanced' ? 'bg-green-100 text-green-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {analysis.status}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          analysis.status === 'overloaded' ? 'bg-red-500' :
                          analysis.status === 'balanced' ? 'bg-green-500' :
                          'bg-yellow-500'
                        }`}
                        style={{ width: `${Math.min(analysis.score, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-12 text-right">
                      {analysis.currentSessions}/{analysis.recommendedMax}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Recommendations */}
        {aiRecommendations.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Lightbulb className="h-6 w-6 text-yellow-600" />
              <h3 className="text-lg font-semibold text-gray-900">AI Recommendations</h3>
            </div>
            
            <div className="space-y-2">
              {aiRecommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start space-x-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <Lightbulb className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-yellow-800">{recommendation}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIGuardian;
