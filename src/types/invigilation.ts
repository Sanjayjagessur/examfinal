import { ExamCard } from './index';

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

export interface InvigilatorAbsence {
  id: string;
  educatorId: string;
  educatorName: string;
  date: string; // ISO date string
  reason: 'illness' | 'emergency' | 'personal' | 'other';
  description?: string;
  status: 'pending' | 'approved' | 'rejected';
  reportedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  replacementEducatorId?: string;
  replacementEducatorName?: string;
  sessionsAffected: string[]; // session IDs that need replacement
}

// Multi-Class System Interfaces
export interface Class {
  id: string;
  name: string; // "Class 10A", "Class 11B", "Grade 12 Science"
  academicYear: string; // "2024-2025"
  totalStudents: number;
  assignedRooms: string[]; // Room IDs assigned to this class
  assignedEducators: string[]; // Educator IDs assigned to this class
  examSchedule: string[]; // ExamCard IDs for this class
  invigilationScheme: string[]; // InvigilationSession IDs for this class
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface ClassExamCard extends Omit<ExamCard, 'id'> {
  id: string;
  classId: string; // Reference to the class this exam belongs to
  className: string; // Display name for the class
}

export interface ClassInvigilationSession extends Omit<InvigilationSession, 'id'> {
  id: string;
  classId: string; // Reference to the class this session belongs to
  className: string; // Display name for the class
}

export interface ClassInvigilationSettings extends InvigilationSettings {
  classId: string;
  className: string;
  maxSessionsPerEducatorPerClass: number;
  preferredClassEducators: string[]; // Educator IDs preferred for this class
}

export interface MultiClassSchedule {
  id: string;
  name: string; // "Mid-Term Examination Schedule 2024"
  academicYear: string;
  classes: Class[];
  totalExams: number;
  totalSessions: number;
  startDate: string;
  endDate: string;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
}

// Class-Exam Assignment System
export interface ClassExamAssignment {
  id: string;
  classId: string;
  className: string;
  examCardId: string;
  examName: string;
  examDate: string;
  examStartTime: string;
  examEndTime: string;
  studentCount: number;
  assignedRooms: string[]; // Room IDs where this exam will be conducted
  roomAllocations: RoomAllocation[]; // How students are distributed across rooms
  createdAt: string;
  updatedAt: string;
}

export interface RoomAllocation {
  roomId: string;
  roomName: string;
  roomCapacity: number;
  allocatedStudents: number;
  remainingCapacity: number;
  isFull: boolean;
}

export interface ClassExamSchedule {
  id: string;
  classId: string;
  className: string;
  academicYear: string;
  examAssignments: ClassExamAssignment[];
  totalExams: number;
  totalStudents: number;
  createdAt: string;
  updatedAt: string;
}
