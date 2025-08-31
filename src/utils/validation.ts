import { ExamCard, ValidationError } from '../types';

export const validateExamCard = (examCard: Partial<ExamCard>): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (!examCard.paperName?.trim()) {
    errors.push({ field: 'paperName', message: 'Paper name is required' });
  }

  if (!examCard.paperNumber?.trim()) {
    errors.push({ field: 'paperNumber', message: 'Paper number is required' });
  }

  if (!examCard.className?.trim()) {
    errors.push({ field: 'className', message: 'Class is required' });
  }

  if (!examCard.duration || examCard.duration <= 0) {
    errors.push({ field: 'duration', message: 'Duration must be greater than 0' });
  }

  if (!examCard.studentCount || examCard.studentCount <= 0) {
    errors.push({ field: 'studentCount', message: 'Number of students must be greater than 0' });
  }

  if (!examCard.startTime) {
    errors.push({ field: 'startTime', message: 'Start time is required' });
  }

  if (!examCard.endTime) {
    errors.push({ field: 'endTime', message: 'End time is required' });
  }

  if (examCard.startTime && examCard.endTime) {
    const startTime = new Date(`2000-01-01T${examCard.startTime}`);
    const endTime = new Date(`2000-01-01T${examCard.endTime}`);
    
    if (startTime >= endTime) {
      errors.push({ field: 'endTime', message: 'End time must be after start time' });
    }
  }

  return errors;
};

export const checkTimeConflict = (
  newExam: Partial<ExamCard>,
  existingExams: ExamCard[],
  minBreakMinutes: number = 15
): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (!newExam.startTime || !newExam.endTime) {
    return errors;
  }
  
  const newStart = new Date(`2000-01-01T${newExam.startTime}`);
  const newEnd = new Date(`2000-01-01T${newExam.endTime}`);

  for (const existing of existingExams) {
    if (existing.id === newExam.id) continue;
    
    const existingStart = new Date(`2000-01-01T${existing.startTime}`);
    const existingEnd = new Date(`2000-01-01T${existing.endTime}`);

    // Check for overlap
    if (
      (newStart < existingEnd && newEnd > existingStart) ||
      (existingStart < newEnd && existingEnd > newStart)
    ) {
      errors.push({
        field: 'time',
        message: `Time conflict with ${existing.paperName} (${existing.startTime} - ${existing.endTime})`
      });
    }

    // Check minimum break requirement
    const breakBefore = Math.abs((existingEnd.getTime() - newStart.getTime()) / (1000 * 60));
    const breakAfter = Math.abs((newEnd.getTime() - existingStart.getTime()) / (1000 * 60));
    
    if (breakBefore < minBreakMinutes && breakBefore > 0) {
      errors.push({
        field: 'time',
        message: `Minimum ${minBreakMinutes} minutes break required before ${existing.paperName}`
      });
    }
    
    if (breakAfter < minBreakMinutes && breakAfter > 0) {
      errors.push({
        field: 'time',
        message: `Minimum ${minBreakMinutes} minutes break required after ${existing.paperName}`
      });
    }
  }

  return errors;
};

export const validateTimeSlot = (time: string): boolean => {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

export const isWithinSession = (time: string, session: 'morning' | 'afternoon'): boolean => {
  const hour = parseInt(time.split(':')[0]);
  
  if (session === 'morning') {
    return hour >= 8 && hour < 12;
  } else {
    return hour >= 12 && hour < 14.5;
  }
};

export const getSessionForTime = (time: string): 'morning' | 'afternoon' => {
  const hour = parseInt(time.split(':')[0]);
  return hour >= 8 && hour < 12 ? 'morning' : 'afternoon';
};
