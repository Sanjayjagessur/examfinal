export interface Educator {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  department?: string;
  maxSessionsPerDay?: number;
  preferredTimes?: string[]; // e.g., ["09:00", "14:00"]
  unavailableDates?: string[]; // ISO date strings
}

export interface Room {
  id: string;
  name: string;
  capacity: number;
  type: 'classroom' | 'laboratory' | 'hall';
  building?: string;
  floor?: string;
  isAvailable: boolean;
}

export interface Hall extends Room {
  type: 'hall';
  sections?: string[]; // e.g., ["Section A", "Section B"]
  requiresMultipleInvigilators: boolean;
  invigilatorsPerSection: number;
}

export interface InvigilationSession {
  id: string;
  educatorId: string;
  educatorName: string;
  examId: string;
  examName: string;
  examDate: string;
  examStartTime: string;
  examEndTime: string;
  sessionStartTime: string;
  sessionEndTime: string;
  roomId: string;
  roomName: string;
  roomType: 'classroom' | 'laboratory' | 'hall';
  studentCount: number;
  sessionNumber: number; // 1, 2, 3, etc. for the same exam
  isMainInvigilator: boolean; // true for primary invigilator
  notes?: string;
}

export interface InvigilationSettings {
  sessionDuration: number; // in minutes, default 30
  breakBetweenSessions: number; // in minutes, default 15
  maxSessionsPerEducatorPerDay: number; // default 4
  maxConsecutiveSessions: number; // default 2
  requireBreakAfterConsecutive: boolean; // default true
  hallInvigilatorRatio: number; // students per invigilator in halls, default 50
  classroomInvigilatorRatio: number; // students per invigilator in classrooms, default 30
}

export interface InvigilationSchedule {
  id: string;
  name: string;
  examPeriod: {
    startDate: string;
    endDate: string;
  };
  settings: InvigilationSettings;
  educators: Educator[];
  rooms: Room[];
  halls: Hall[];
  sessions: InvigilationSession[];
  createdAt: string;
  updatedAt: string;
}

export interface InvigilationAssignment {
  examId: string;
  examName: string;
  examDate: string;
  examStartTime: string;
  examEndTime: string;
  studentCount: number;
  duration: number;
  roomAssignments: {
    roomId: string;
    roomName: string;
    roomType: 'classroom' | 'laboratory' | 'hall';
    capacity: number;
    assignedStudents: number;
    requiredInvigilators: number;
    assignedInvigilators: string[]; // educator IDs
  }[];
}

export interface InvigilationConflict {
  type: 'overlap' | 'overload' | 'unavailable' | 'consecutive_limit' | 'consecutive';
  educatorId: string;
  educatorName: string;
  sessionId: string;
  message: string;
  severity: 'warning' | 'error';
}
