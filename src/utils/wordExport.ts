import { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel, BorderStyle } from 'docx';
import { ExamCard } from '../types';
import { format, parseISO } from 'date-fns';

export const generateStudentTimetableWord = async (examCards: ExamCard[]) => {
  const scheduledExams = examCards.filter(exam => exam.date);
  
  if (scheduledExams.length === 0) {
    alert('No exams scheduled. Please add exams to the calendar first.');
    return;
  }

  // Group exams by date
  const examsByDate: { [key: string]: ExamCard[] } = {};
  scheduledExams.forEach(exam => {
    if (exam.date) {
      if (!examsByDate[exam.date]) {
        examsByDate[exam.date] = [];
      }
      examsByDate[exam.date].push(exam);
    }
  });

  // Create document
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        // Title
        new Paragraph({
          text: 'JAGESAURUS - EXAM TIMETABLE',
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: {
            after: 400,
            before: 400
          }
        }),

        // Subtitle
        new Paragraph({
          text: 'Student Examination Schedule',
          heading: HeadingLevel.HEADING_2,
          alignment: AlignmentType.CENTER,
          spacing: {
            after: 600
          }
        }),

        // Generated date
        new Paragraph({
          text: `Generated on: ${format(new Date(), 'EEEE, MMMM do, yyyy')}`,
          alignment: AlignmentType.CENTER,
          spacing: {
            after: 800
          }
        }),

        // Table for each date
        ...Object.entries(examsByDate).map(([date, exams]) => [
          // Date header
          new Paragraph({
            text: format(parseISO(date), 'EEEE, MMMM do, yyyy'),
            heading: HeadingLevel.HEADING_3,
            spacing: {
              after: 200,
              before: 400
            }
          }),

          // Table for exams on this date
          new Table({
            width: {
              size: 100,
              type: WidthType.PERCENTAGE,
            },
            rows: [
              // Header row
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ text: 'Time', alignment: AlignmentType.CENTER })],
                    width: { size: 20, type: WidthType.PERCENTAGE },
                    shading: { fill: 'E6E6E6' }
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: 'Paper Name', alignment: AlignmentType.CENTER })],
                    width: { size: 30, type: WidthType.PERCENTAGE },
                    shading: { fill: 'E6E6E6' }
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: 'Paper #', alignment: AlignmentType.CENTER })],
                    width: { size: 15, type: WidthType.PERCENTAGE },
                    shading: { fill: 'E6E6E6' }
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: 'Class', alignment: AlignmentType.CENTER })],
                    width: { size: 20, type: WidthType.PERCENTAGE },
                    shading: { fill: 'E6E6E6' }
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: 'Duration', alignment: AlignmentType.CENTER })],
                    width: { size: 15, type: WidthType.PERCENTAGE },
                    shading: { fill: 'E6E6E6' }
                  })
                ],
              }),
              // Data rows
              ...exams.sort((a, b) => a.startTime.localeCompare(b.startTime)).map(exam =>
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ text: `${exam.startTime} - ${exam.endTime}` })],
                    }),
                    new TableCell({
                      children: [new Paragraph({ text: exam.paperName })],
                    }),
                    new TableCell({
                      children: [new Paragraph({ text: exam.paperNumber })],
                    }),
                    new TableCell({
                      children: [new Paragraph({ text: exam.className })],
                    }),
                    new TableCell({
                      children: [new Paragraph({ text: `${exam.duration} min` })],
                    })
                  ],
                })
              )
            ],
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1 },
              bottom: { style: BorderStyle.SINGLE, size: 1 },
              left: { style: BorderStyle.SINGLE, size: 1 },
              right: { style: BorderStyle.SINGLE, size: 1 },
              insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
              insideVertical: { style: BorderStyle.SINGLE, size: 1 },
            },
          }),

          // Spacing after table
          new Paragraph({
            text: '',
            spacing: { after: 400 }
          })
        ]).flat()
      ]
    }]
  });

  // Generate and download the document
  const blob = await Packer.toBlob(doc);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Jagesaurus-Exam-Timetable-${format(new Date(), 'yyyy-MM-dd')}.docx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const generateExamSummaryWord = async (examCards: ExamCard[]) => {
  const scheduledExams = examCards.filter(exam => exam.date);
  
  if (scheduledExams.length === 0) {
    alert('No exams scheduled. Please add exams to the calendar first.');
    return;
  }

  // Get unique classes
  const classNames = scheduledExams.map(exam => exam.className);
  const uniqueClasses = classNames.filter((className, index) => classNames.indexOf(className) === index);

  // Create document
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        // Title
        new Paragraph({
          text: 'JAGESAURUS - EXAM SUMMARY',
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: {
            after: 400,
            before: 400
          }
        }),

        // Subtitle
        new Paragraph({
          text: 'Administrative Exam Overview',
          heading: HeadingLevel.HEADING_2,
          alignment: AlignmentType.CENTER,
          spacing: {
            after: 600
          }
        }),

        // Generated date
        new Paragraph({
          text: `Generated on: ${format(new Date(), 'EEEE, MMMM do, yyyy')}`,
          alignment: AlignmentType.CENTER,
          spacing: {
            after: 800
          }
        }),

        // Summary statistics
        new Paragraph({
          text: `Total Exams: ${scheduledExams.length}`,
          heading: HeadingLevel.HEADING_3,
          spacing: { after: 200 }
        }),

        new Paragraph({
          text: `Total Classes: ${uniqueClasses.length}`,
          spacing: { after: 200 }
        }),

        new Paragraph({
          text: `Total Students: ${scheduledExams.reduce((sum, exam) => sum + exam.studentCount, 0)}`,
          spacing: { after: 400 }
        }),

        // Detailed table
        new Paragraph({
          text: 'Detailed Exam Schedule',
          heading: HeadingLevel.HEADING_3,
          spacing: { after: 200, before: 400 }
        }),

        new Table({
          width: {
            size: 100,
            type: WidthType.PERCENTAGE,
          },
          rows: [
            // Header row
            new TableRow({
              children: [
                new TableCell({
                  children: [new Paragraph({ text: 'Date', alignment: AlignmentType.CENTER })],
                  width: { size: 15, type: WidthType.PERCENTAGE },
                  shading: { fill: 'E6E6E6' }
                }),
                new TableCell({
                  children: [new Paragraph({ text: 'Time', alignment: AlignmentType.CENTER })],
                  width: { size: 15, type: WidthType.PERCENTAGE },
                  shading: { fill: 'E6E6E6' }
                }),
                new TableCell({
                  children: [new Paragraph({ text: 'Paper Name', alignment: AlignmentType.CENTER })],
                  width: { size: 25, type: WidthType.PERCENTAGE },
                  shading: { fill: 'E6E6E6' }
                }),
                new TableCell({
                  children: [new Paragraph({ text: 'Paper #', alignment: AlignmentType.CENTER })],
                  width: { size: 10, type: WidthType.PERCENTAGE },
                  shading: { fill: 'E6E6E6' }
                }),
                new TableCell({
                  children: [new Paragraph({ text: 'Class', alignment: AlignmentType.CENTER })],
                  width: { size: 15, type: WidthType.PERCENTAGE },
                  shading: { fill: 'E6E6E6' }
                }),
                new TableCell({
                  children: [new Paragraph({ text: 'Students', alignment: AlignmentType.CENTER })],
                  width: { size: 10, type: WidthType.PERCENTAGE },
                  shading: { fill: 'E6E6E6' }
                }),
                new TableCell({
                  children: [new Paragraph({ text: 'Duration', alignment: AlignmentType.CENTER })],
                  width: { size: 10, type: WidthType.PERCENTAGE },
                  shading: { fill: 'E6E6E6' }
                })
              ],
            }),
            // Data rows
            ...scheduledExams
              .sort((a, b) => {
                const dateCompare = a.date!.localeCompare(b.date!);
                return dateCompare !== 0 ? dateCompare : a.startTime.localeCompare(b.startTime);
              })
              .map(exam =>
                new TableRow({
                  children: [
                    new TableCell({
                      children: [new Paragraph({ text: format(parseISO(exam.date!), 'MMM dd, yyyy') })],
                    }),
                    new TableCell({
                      children: [new Paragraph({ text: `${exam.startTime} - ${exam.endTime}` })],
                    }),
                    new TableCell({
                      children: [new Paragraph({ text: exam.paperName })],
                    }),
                    new TableCell({
                      children: [new Paragraph({ text: exam.paperNumber })],
                    }),
                    new TableCell({
                      children: [new Paragraph({ text: exam.className })],
                    }),
                    new TableCell({
                      children: [new Paragraph({ text: exam.studentCount.toString() })],
                    }),
                    new TableCell({
                      children: [new Paragraph({ text: `${exam.duration} min` })],
                    })
                  ],
                })
              )
          ],
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1 },
            bottom: { style: BorderStyle.SINGLE, size: 1 },
            left: { style: BorderStyle.SINGLE, size: 1 },
            right: { style: BorderStyle.SINGLE, size: 1 },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
            insideVertical: { style: BorderStyle.SINGLE, size: 1 },
          },
        })
      ]
    }]
  });

  // Generate and download the document
  const blob = await Packer.toBlob(doc);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Jagesaurus-Exam-Summary-${format(new Date(), 'yyyy-MM-dd')}.docx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
