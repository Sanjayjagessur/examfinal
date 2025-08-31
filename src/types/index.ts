export interface ExamCard {
  id: string;
  paperName: string;
  paperNumber: string;
  className: string;
  duration: number; // in minutes
  studentCount: number;
  startTime: string;
  endTime: string;
  date?: string;
  session?: 'morning' | 'afternoon';
  position?: { x: number; y: number };
  venue?: string;
  color?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}
