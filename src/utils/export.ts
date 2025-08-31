import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { ExamCard } from '../types';

export const generateStudentTimetablePDF = (examCards: ExamCard[]): void => {
  const doc = new jsPDF();
  
  // Get unique classes
  const classNames = examCards.map(exam => exam.className);
  const uniqueClasses = classNames.filter((className, index) => classNames.indexOf(className) === index);
  const classHeader = uniqueClasses.length > 0 ? uniqueClasses.join(', ') : 'All Classes';
  
  // Title
  doc.setFontSize(20);
  doc.text('Student Exam Timetable', 105, 20, { align: 'center' });
  
  // Class header
  doc.setFontSize(14);
  doc.text(`Class: ${classHeader}`, 105, 30, { align: 'center' });
  
  // Date
  doc.setFontSize(12);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 40, { align: 'center' });
  
  // Table data
  const tableData = examCards
    .filter(exam => exam.startTime && exam.endTime)
    .sort((a, b) => {
      const dateA = new Date(`2000-01-01T${a.startTime}`);
      const dateB = new Date(`2000-01-01T${b.startTime}`);
      return dateA.getTime() - dateB.getTime();
    })
    .map(exam => [
      exam.paperName,
      exam.paperNumber,
      exam.className,
      exam.startTime,
      exam.endTime,
      `${exam.duration} min`,
      exam.studentCount.toString(),
      exam.venue || 'TBD'
    ]);

  // Create table
  (doc as any).autoTable({
    startY: 50,
    head: [['Paper Name', 'Paper #', 'Class', 'Start Time', 'End Time', 'Duration', 'Students', 'Venue']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 10,
      cellPadding: 5
    },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 18 },
      2: { cellWidth: 20 },
      3: { cellWidth: 22 },
      4: { cellWidth: 22 },
      5: { cellWidth: 22 },
      6: { cellWidth: 20 },
      7: { cellWidth: 25 }
    }
  });

  // Save PDF
  doc.save('student-timetable.pdf');
};



export const generateExamSummaryPDF = (examCards: ExamCard[]): void => {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(20);
  doc.text('Exam Summary Report', 105, 20, { align: 'center' });
  
  // Summary statistics
  const totalExams = examCards.length;
  const totalStudents = examCards.reduce((sum, exam) => sum + exam.studentCount, 0);
  const totalDuration = examCards.reduce((sum, exam) => sum + exam.duration, 0);
  
  const morningExams = examCards.filter(exam => 
    exam.startTime && getSessionForTime(exam.startTime) === 'morning'
  ).length;
  
  const afternoonExams = examCards.filter(exam => 
    exam.startTime && getSessionForTime(exam.startTime) === 'afternoon'
  ).length;

  doc.setFontSize(12);
  doc.text('Summary Statistics:', 20, 40);
  doc.setFontSize(10);
  doc.text(`Total Exams: ${totalExams}`, 30, 55);
  doc.text(`Total Students: ${totalStudents}`, 30, 65);
  doc.text(`Total Duration: ${totalDuration} minutes`, 30, 75);
  doc.text(`Morning Sessions: ${morningExams}`, 30, 85);
  doc.text(`Afternoon Sessions: ${afternoonExams}`, 30, 95);

  // Detailed exam list
  doc.setFontSize(14);
  doc.text('Exam Details', 20, 120);
  
  const examData = examCards.map(exam => [
    exam.paperName,
    exam.paperNumber,
    exam.className,
    exam.startTime,
    exam.endTime,
    `${exam.duration} min`,
    exam.studentCount.toString(),
    exam.venue || 'TBD'
  ]);

  (doc as any).autoTable({
    startY: 130,
    head: [['Paper Name', 'Paper #', 'Class', 'Start Time', 'End Time', 'Duration', 'Students', 'Venue']],
    body: examData,
    theme: 'grid',
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 9,
      cellPadding: 3
    }
  });

  // Save PDF
  doc.save('exam-summary.pdf');
};

const getSessionForTime = (time: string): 'morning' | 'afternoon' => {
  const hour = parseInt(time.split(':')[0]);
  return hour >= 8 && hour < 12 ? 'morning' : 'afternoon';
};
