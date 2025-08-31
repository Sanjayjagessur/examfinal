import { ExamCard } from '../types';
import { 
  Educator, 
  Room, 
  Hall, 
  InvigilationSession, 
  InvigilationSettings, 
  InvigilationAssignment,
  InvigilationConflict 
} from '../types/invigilation';
import { v4 as uuidv4 } from 'uuid';
import { addMinutes, parseISO, format, isWithinInterval, isAfter, isBefore } from 'date-fns';

// Default invigilation settings
export const DEFAULT_INVIGILATION_SETTINGS: InvigilationSettings = {
  sessionDuration: 30,
  breakBetweenSessions: 15,
  maxSessionsPerEducatorPerDay: 4,
  maxConsecutiveSessions: 2,
  requireBreakAfterConsecutive: true,
  hallInvigilatorRatio: 50,
  classroomInvigilatorRatio: 30
};

// Enhanced educator workload tracking
export interface EducatorWorkload {
  educatorId: string;
  educatorName: string;
  totalSessions: number;
  morningSessions: number;
  afternoonSessions: number;
  consecutiveSessions: number;
  lastSessionTime?: string;
  lastSessionDate?: string;
}

// Fairness report interface
export interface FairnessReport {
  educatorStats: EducatorWorkload[];
  totalSessions: number;
  averageSessionsPerEducator: number;
  mostSessions: number;
  leastSessions: number;
  morningSessionsTotal: number;
  afternoonSessionsTotal: number;
  fairnessScore: number; // 0-100, higher is more fair
  recommendations: string[];
}

// Calculate required invigilators for a room
export const calculateRequiredInvigilators = (
  studentCount: number,
  roomType: 'classroom' | 'laboratory' | 'hall',
  settings: InvigilationSettings
): number => {
  const ratio = roomType === 'hall' ? settings.hallInvigilatorRatio : settings.classroomInvigilatorRatio;
  return Math.ceil(studentCount / ratio);
};

// Generate invigilation sessions for an exam
export const generateInvigilationSessions = (
  exam: ExamCard,
  rooms: (Room | Hall)[],
  settings: InvigilationSettings
): InvigilationAssignment => {
  if (!exam.date || !exam.startTime || !exam.endTime) {
    throw new Error('Exam must have date, start time, and end time');
  }

  const examStart = parseISO(`${exam.date}T${exam.startTime}`);
  const examEnd = parseISO(`${exam.date}T${exam.endTime}`);
  const examDuration = Math.abs(examEnd.getTime() - examStart.getTime()) / (1000 * 60); // in minutes

  // Calculate total sessions needed
  const totalSessions = Math.ceil(examDuration / settings.sessionDuration);
  
  // Distribute students across available rooms
  const roomAssignments = distributeStudentsAcrossRooms(exam.studentCount, rooms, settings);

  return {
    examId: exam.id,
    examName: exam.paperName,
    examDate: exam.date,
    examStartTime: exam.startTime,
    examEndTime: exam.endTime,
    studentCount: exam.studentCount,
    duration: exam.duration,
    roomAssignments
  };
};

// Distribute students across available rooms
export const distributeStudentsAcrossRooms = (
  totalStudents: number,
  rooms: (Room | Hall)[],
  settings: InvigilationSettings
) => {
  const availableRooms = rooms.filter(room => room.isAvailable);
  const assignments: InvigilationAssignment['roomAssignments'] = [];
  
  let remainingStudents = totalStudents;
  
  // Sort rooms by capacity (largest first)
  const sortedRooms = [...availableRooms].sort((a, b) => b.capacity - a.capacity);
  
  for (const room of sortedRooms) {
    if (remainingStudents <= 0) break;
    
    const assignedStudents = Math.min(remainingStudents, room.capacity);
    const requiredInvigilators = calculateRequiredInvigilators(assignedStudents, room.type, settings);
    
    assignments.push({
      roomId: room.id,
      roomName: room.name,
      roomType: room.type,
      capacity: room.capacity,
      assignedStudents,
      requiredInvigilators,
      assignedInvigilators: [] // Will be filled by assignment algorithm
    });
    
    remainingStudents -= assignedStudents;
  }
  
  if (remainingStudents > 0) {
    throw new Error(`Not enough room capacity. ${remainingStudents} students cannot be accommodated.`);
  }
  
  return assignments;
};

// Enhanced educator assignment with fairness
export const assignEducatorsToSessions = (
  assignments: InvigilationAssignment[],
  educators: Educator[],
  settings: InvigilationSettings
): { sessions: InvigilationSession[], conflicts: InvigilationConflict[] } => {
  const sessions: InvigilationSession[] = [];
  const conflicts: InvigilationConflict[] = [];
  
  // Group assignments by date
  const assignmentsByDate = groupAssignmentsByDate(assignments);
  
  for (const [date, dateAssignments] of Object.entries(assignmentsByDate)) {
    const dateEducators = getAvailableEducatorsForDate(educators, date);
    
    // Initialize workload tracking for this date
    const educatorWorkload: { [educatorId: string]: EducatorWorkload } = {};
    dateEducators.forEach(educator => {
      educatorWorkload[educator.id] = {
        educatorId: educator.id,
        educatorName: educator.name,
        totalSessions: 0,
        morningSessions: 0,
        afternoonSessions: 0,
        consecutiveSessions: 0
      };
    });
    
    for (const assignment of dateAssignments) {
      const examStart = parseISO(`${assignment.examDate}T${assignment.examStartTime}`);
      const examEnd = parseISO(`${assignment.examDate}T${assignment.examEndTime}`);
      
      for (const roomAssignment of assignment.roomAssignments) {
        const sessionsForRoom = generateSessionsForRoom(
          assignment,
          roomAssignment,
          examStart,
          examEnd,
          settings
        );
        
        // Assign educators to sessions with fairness
        const assignedSessions = assignEducatorsToRoomSessionsWithFairness(
          sessionsForRoom,
          dateEducators,
          date,
          educatorWorkload,
          conflicts
        );
        
        sessions.push(...assignedSessions);
      }
    }
  }
  
  return { sessions, conflicts };
};

// Generate sessions for a specific room
export const generateSessionsForRoom = (
  assignment: InvigilationAssignment,
  roomAssignment: InvigilationAssignment['roomAssignments'][0],
  examStart: Date,
  examEnd: Date,
  settings: InvigilationSettings
): Omit<InvigilationSession, 'educatorId' | 'educatorName'>[] => {
  const sessions: Omit<InvigilationSession, 'educatorId' | 'educatorName'>[] = [];
  let currentTime = new Date(examStart);
  let sessionNumber = 1;
  
  // Calculate total exam duration in minutes
  const examDurationMinutes = Math.abs(examEnd.getTime() - examStart.getTime()) / (1000 * 60);
  
  // Calculate how many sessions we need for the entire exam duration
  const totalSessionsNeeded = Math.ceil(examDurationMinutes / settings.sessionDuration);
  
  console.log(`Exam duration: ${examDurationMinutes} minutes, Session duration: ${settings.sessionDuration} minutes, Total sessions needed: ${totalSessionsNeeded}`);
  
  for (let i = 0; i < totalSessionsNeeded; i++) {
    const sessionEnd = addMinutes(currentTime, settings.sessionDuration);
    
    // Don't create sessions that extend beyond exam end time
    if (isAfter(sessionEnd, examEnd)) {
      // Adjust session end to match exam end time
      const adjustedSessionEnd = new Date(examEnd);
      sessions.push({
        id: uuidv4(),
        examId: assignment.examId,
        examName: assignment.examName,
        examDate: assignment.examDate,
        examStartTime: assignment.examStartTime,
        examEndTime: assignment.examEndTime,
        sessionStartTime: format(currentTime, 'HH:mm'),
        sessionEndTime: format(adjustedSessionEnd, 'HH:mm'),
        roomId: roomAssignment.roomId,
        roomName: roomAssignment.roomName,
        roomType: roomAssignment.roomType,
        studentCount: roomAssignment.assignedStudents,
        sessionNumber,
        isMainInvigilator: sessionNumber === 1, // First session is main invigilator
        notes: ''
      });
      break;
    }
    
    sessions.push({
      id: uuidv4(),
      examId: assignment.examId,
      examName: assignment.examName,
      examDate: assignment.examDate,
      examStartTime: assignment.examStartTime,
      examEndTime: assignment.examEndTime,
      sessionStartTime: format(currentTime, 'HH:mm'),
      sessionEndTime: format(sessionEnd, 'HH:mm'),
      roomId: roomAssignment.roomId,
      roomName: roomAssignment.roomName,
      roomType: roomAssignment.roomType,
      studentCount: roomAssignment.assignedStudents,
      sessionNumber,
      isMainInvigilator: sessionNumber === 1, // First session is main invigilator
      notes: ''
    });
    
    // Move to next session (with break)
    currentTime = addMinutes(sessionEnd, settings.breakBetweenSessions);
    sessionNumber++;
  }
  
  console.log(`Generated ${sessions.length} sessions for room ${roomAssignment.roomName}`);
  return sessions;
};

// Enhanced assignment with fairness considerations
export const assignEducatorsToRoomSessionsWithFairness = (
  sessions: Omit<InvigilationSession, 'educatorId' | 'educatorName'>[],
  availableEducators: Educator[],
  date: string,
  educatorWorkload: { [educatorId: string]: EducatorWorkload },
  conflicts: InvigilationConflict[]
): InvigilationSession[] => {
  const assignedSessions: InvigilationSession[] = [];
  
  for (const session of sessions) {
    // Find best available educator with fairness considerations
    const bestEducator = findBestAvailableEducatorWithFairness(
      session,
      availableEducators,
      educatorWorkload,
      assignedSessions,
      date
    );
    
    if (bestEducator) {
      assignedSessions.push({
        ...session,
        educatorId: bestEducator.id,
        educatorName: bestEducator.name
      });
      
      // Update workload
      const workload = educatorWorkload[bestEducator.id];
      workload.totalSessions++;
      
      // Determine if morning or afternoon session
      const sessionHour = parseInt(session.sessionStartTime.split(':')[0]);
      if (sessionHour < 12) {
        workload.morningSessions++;
      } else {
        workload.afternoonSessions++;
      }
      
      // Update consecutive sessions
      if (workload.lastSessionDate === date && workload.lastSessionTime) {
        const lastSessionHour = parseInt(workload.lastSessionTime.split(':')[0]);
        const currentSessionHour = parseInt(session.sessionStartTime.split(':')[0]);
        if (Math.abs(currentSessionHour - lastSessionHour) <= 2) {
          workload.consecutiveSessions++;
        } else {
          workload.consecutiveSessions = 1;
        }
      } else {
        workload.consecutiveSessions = 1;
      }
      
      workload.lastSessionTime = session.sessionStartTime;
      workload.lastSessionDate = date;
    } else {
      // Create conflict for unassigned session
      conflicts.push({
        type: 'overload',
        educatorId: '',
        educatorName: 'No available educator',
        sessionId: session.id,
        message: `No available educator for session in ${session.roomName}`,
        severity: 'error'
      });
    }
  }
  
  return assignedSessions;
};

// Enhanced educator selection with fairness
export const findBestAvailableEducatorWithFairness = (
  session: Omit<InvigilationSession, 'educatorId' | 'educatorName'>,
  educators: Educator[],
  workload: { [educatorId: string]: EducatorWorkload },
  existingSessions: InvigilationSession[],
  date: string
): Educator | null => {
  const availableEducators = educators.filter(educator => {
    const educatorWorkload = workload[educator.id];
    
    // Check workload limit
    if (educatorWorkload.totalSessions >= (educator.maxSessionsPerDay || 4)) {
      return false;
    }
    
    // Check for overlapping sessions
    const hasOverlap = existingSessions.some(existing => 
      existing.educatorId === educator.id && 
      existing.examDate === date &&
      sessionsOverlap(session, existing)
    );
    
    if (hasOverlap) {
      return false;
    }
    
    // Check for consecutive session limit
    if (educatorWorkload.consecutiveSessions >= 2) {
      return false;
    }
    
    return true;
  });
  
  if (availableEducators.length === 0) {
    return null;
  }
  
  // Enhanced scoring system for fairness
  const scoredEducators = availableEducators.map(educator => {
    const educatorWorkload = workload[educator.id];
    let score = 0;
    
    // Prefer educators with fewer total sessions
    score += (10 - educatorWorkload.totalSessions) * 10;
    
    // Balance morning/afternoon sessions
    const sessionHour = parseInt(session.sessionStartTime.split(':')[0]);
    const isMorning = sessionHour < 12;
    
    if (isMorning && educatorWorkload.morningSessions < educatorWorkload.afternoonSessions) {
      score += 20; // Bonus for balancing morning sessions
    } else if (!isMorning && educatorWorkload.afternoonSessions < educatorWorkload.morningSessions) {
      score += 20; // Bonus for balancing afternoon sessions
    }
    
    // Prefer educators with no consecutive sessions
    if (educatorWorkload.consecutiveSessions === 0) {
      score += 15;
    }
    
    // Consider educator preferences if available
    if (educator.preferredTimes && educator.preferredTimes.length > 0) {
      const sessionTime = session.sessionStartTime;
      if (educator.preferredTimes.includes(sessionTime)) {
        score += 10;
      }
    }
    
    return { educator, score };
  });
  
  // Sort by score (highest first) and return the best
  scoredEducators.sort((a, b) => b.score - a.score);
  return scoredEducators[0]?.educator || null;
};

// Generate fairness report
export const generateFairnessReport = (
  sessions: InvigilationSession[],
  educators: Educator[]
): FairnessReport => {
  const educatorStats: EducatorWorkload[] = [];
  const educatorSessionCounts: { [educatorId: string]: { total: number, morning: number, afternoon: number } } = {};
  
  // Initialize counts
  educators.forEach(educator => {
    educatorSessionCounts[educator.id] = { total: 0, morning: 0, afternoon: 0 };
  });
  
  // Count sessions per educator
  sessions.forEach(session => {
    const counts = educatorSessionCounts[session.educatorId];
    if (counts) {
      counts.total++;
      const sessionHour = parseInt(session.sessionStartTime.split(':')[0]);
      if (sessionHour < 12) {
        counts.morning++;
      } else {
        counts.afternoon++;
      }
    }
  });
  
  // Create educator stats
  educators.forEach(educator => {
    const counts = educatorSessionCounts[educator.id];
    educatorStats.push({
      educatorId: educator.id,
      educatorName: educator.name,
      totalSessions: counts.total,
      morningSessions: counts.morning,
      afternoonSessions: counts.afternoon,
      consecutiveSessions: 0 // Would need to calculate this from session data
    });
  });
  
  // Calculate report metrics
  const totalSessions = sessions.length;
  const averageSessionsPerEducator = totalSessions / educators.length;
  const sessionCounts = Object.values(educatorSessionCounts).map(c => c.total);
  const mostSessions = Math.max(...sessionCounts);
  const leastSessions = Math.min(...sessionCounts);
  const morningSessionsTotal = Object.values(educatorSessionCounts).reduce((sum, c) => sum + c.morning, 0);
  const afternoonSessionsTotal = Object.values(educatorSessionCounts).reduce((sum, c) => sum + c.afternoon, 0);
  
  // Calculate fairness score (0-100)
  const sessionVariance = Math.sqrt(sessionCounts.reduce((sum, count) => sum + Math.pow(count - averageSessionsPerEducator, 2), 0) / sessionCounts.length);
  const maxPossibleVariance = totalSessions / 2; // Theoretical maximum variance
  const fairnessScore = Math.max(0, 100 - (sessionVariance / maxPossibleVariance) * 100);
  
  // Generate recommendations
  const recommendations: string[] = [];
  
  if (fairnessScore < 70) {
    recommendations.push("Consider redistributing sessions to improve fairness");
  }
  
  if (Math.abs(morningSessionsTotal - afternoonSessionsTotal) > totalSessions * 0.2) {
    recommendations.push("Morning and afternoon session distribution is uneven");
  }
  
  const educatorsWithNoSessions = educatorStats.filter(stat => stat.totalSessions === 0);
  if (educatorsWithNoSessions.length > 0) {
    recommendations.push(`${educatorsWithNoSessions.length} educators have no sessions assigned`);
  }
  
  const educatorsWithManySessions = educatorStats.filter(stat => stat.totalSessions > averageSessionsPerEducator * 1.5);
  if (educatorsWithManySessions.length > 0) {
    recommendations.push(`${educatorsWithManySessions.length} educators have significantly more sessions than average`);
  }
  
  return {
    educatorStats,
    totalSessions,
    averageSessionsPerEducator,
    mostSessions,
    leastSessions,
    morningSessionsTotal,
    afternoonSessionsTotal,
    fairnessScore,
    recommendations
  };
};

// Check if two sessions overlap
export const sessionsOverlap = (
  session1: Omit<InvigilationSession, 'educatorId' | 'educatorName'>,
  session2: InvigilationSession
): boolean => {
  if (session1.examDate !== session2.examDate) return false;
  
  const start1 = parseISO(`${session1.examDate}T${session1.sessionStartTime}`);
  const end1 = parseISO(`${session1.examDate}T${session1.sessionEndTime}`);
  const start2 = parseISO(`${session2.examDate}T${session2.sessionStartTime}`);
  const end2 = parseISO(`${session2.examDate}T${session2.sessionEndTime}`);
  
  return start1 < end2 && start2 < end1;
};

// Count consecutive sessions for an educator
export const countConsecutiveSessions = (
  educatorId: string,
  sessions: InvigilationSession[],
  date: string
): number => {
  const educatorSessions = sessions
    .filter(session => session.educatorId === educatorId && session.examDate === date)
    .sort((a, b) => a.sessionStartTime.localeCompare(b.sessionStartTime));
  
  let consecutiveCount = 0;
  for (let i = 0; i < educatorSessions.length - 1; i++) {
    const currentEnd = parseISO(`${date}T${educatorSessions[i].sessionEndTime}`);
    const nextStart = parseISO(`${date}T${educatorSessions[i + 1].sessionStartTime}`);
    const timeDiff = Math.abs(nextStart.getTime() - currentEnd.getTime()) / (1000 * 60); // in minutes
    
    if (timeDiff <= 30) { // Consider consecutive if within 30 minutes
      consecutiveCount++;
    } else {
      consecutiveCount = 0;
    }
  }
  
  return consecutiveCount;
};

// Group assignments by date
export const groupAssignmentsByDate = (assignments: InvigilationAssignment[]): { [date: string]: InvigilationAssignment[] } => {
  const grouped: { [date: string]: InvigilationAssignment[] } = {};
  
  assignments.forEach(assignment => {
    if (!grouped[assignment.examDate]) {
      grouped[assignment.examDate] = [];
    }
    grouped[assignment.examDate].push(assignment);
  });
  
  return grouped;
};

// Get available educators for a specific date
export const getAvailableEducatorsForDate = (educators: Educator[], date: string): Educator[] => {
  return educators.filter(educator => {
    // Check if educator is unavailable on this date
    if (educator.unavailableDates && educator.unavailableDates.includes(date)) {
      return false;
    }
    return true;
  });
};

// Validate invigilation schedule
export const validateInvigilationSchedule = (
  sessions: InvigilationSession[],
  educators: Educator[],
  settings: InvigilationSettings
): InvigilationConflict[] => {
  const conflicts: InvigilationConflict[] = [];
  
  // Group sessions by educator and date
  const educatorSessions: { [educatorId: string]: { [date: string]: InvigilationSession[] } } = {};
  
  sessions.forEach(session => {
    if (!educatorSessions[session.educatorId]) {
      educatorSessions[session.educatorId] = {};
    }
    if (!educatorSessions[session.educatorId][session.examDate]) {
      educatorSessions[session.educatorId][session.examDate] = [];
    }
    educatorSessions[session.educatorId][session.examDate].push(session);
  });
  
  // Check for conflicts
  Object.entries(educatorSessions).forEach(([educatorId, dateSessions]) => {
    const educator = educators.find(e => e.id === educatorId);
    if (!educator) return;
    
    Object.entries(dateSessions).forEach(([date, daySessions]) => {
      // Check daily session limit
      if (daySessions.length > (educator.maxSessionsPerDay || settings.maxSessionsPerEducatorPerDay)) {
        conflicts.push({
          type: 'overload',
          educatorId,
          educatorName: educator.name,
          sessionId: '',
          message: `${educator.name} has ${daySessions.length} sessions on ${date}, exceeding limit of ${educator.maxSessionsPerDay || settings.maxSessionsPerEducatorPerDay}`,
          severity: 'warning'
        });
      }
      
      // Check for overlapping sessions
      for (let i = 0; i < daySessions.length; i++) {
        for (let j = i + 1; j < daySessions.length; j++) {
          if (sessionsOverlap(daySessions[i], daySessions[j])) {
            conflicts.push({
              type: 'overlap',
              educatorId,
              educatorName: educator.name,
              sessionId: daySessions[i].id,
              message: `${educator.name} has overlapping sessions on ${date}`,
              severity: 'error'
            });
          }
        }
      }
      
      // Check consecutive session limit
      const consecutiveCount = countConsecutiveSessions(educatorId, daySessions, date);
      if (consecutiveCount > settings.maxConsecutiveSessions) {
        conflicts.push({
          type: 'consecutive',
          educatorId,
          educatorName: educator.name,
          sessionId: '',
          message: `${educator.name} has ${consecutiveCount + 1} consecutive sessions on ${date}`,
          severity: 'warning'
        });
      }
    });
  });
  
  return conflicts;
};
