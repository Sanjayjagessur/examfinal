import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, AlignmentType, HeadingLevel, BorderStyle } from 'docx';
import { InvigilationSession } from '../types/invigilation';
import { format, parseISO } from 'date-fns';

export const generateInvigilationSchedulePDF = (sessions: InvigilationSession[]) => {
  if (sessions.length === 0) {
    alert('No invigilation sessions to export.');
    return;
  }

  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('JAGESAURUS - INVIGILATION SCHEDULE', 105, 20, { align: 'center' });
  
  // Subtitle
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('Educator Assignment Schedule', 105, 30, { align: 'center' });
  
  // Generated date
  doc.setFontSize(10);
  doc.text(`Generated on: ${format(new Date(), 'EEEE, MMMM do, yyyy')}`, 105, 40, { align: 'center' });
  
  // Group sessions by date
  const sessionsByDate: { [key: string]: InvigilationSession[] } = {};
  sessions.forEach(session => {
    if (!sessionsByDate[session.examDate]) {
      sessionsByDate[session.examDate] = [];
    }
    sessionsByDate[session.examDate].push(session);
  });
  
  let yPosition = 60;
  
  // Create table for each date
  Object.entries(sessionsByDate).forEach(([date, dateSessions]) => {
    // Date header
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(format(parseISO(date), 'EEEE, MMMM do, yyyy'), 20, yPosition);
    yPosition += 10;
    
    // Prepare table data
    const tableData = dateSessions
      .sort((a, b) => a.sessionStartTime.localeCompare(b.sessionStartTime))
      .map(session => [
        `${session.sessionStartTime} - ${session.sessionEndTime}`,
        session.educatorName,
        session.examName,
        session.roomName,
        session.studentCount.toString(),
        session.isMainInvigilator ? 'Yes' : 'No'
      ]);
    
    // Create table
    autoTable(doc, {
      head: [['Time', 'Educator', 'Exam', 'Room', 'Students', 'Main Invigilator']],
      body: tableData,
      startY: yPosition,
      styles: {
        fontSize: 8,
        cellPadding: 2
      },
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      }
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 15;
    
    // Add new page if needed
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }
  });
  
  // Save the PDF
  doc.save(`Jagesaurus-Invigilation-Schedule-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

export const generateInvigilationScheduleWord = async (sessions: InvigilationSession[]) => {
  if (sessions.length === 0) {
    alert('No invigilation sessions to export.');
    return;
  }

  // Group sessions by date
  const sessionsByDate: { [key: string]: InvigilationSession[] } = {};
  sessions.forEach(session => {
    if (!sessionsByDate[session.examDate]) {
      sessionsByDate[session.examDate] = [];
    }
    sessionsByDate[session.examDate].push(session);
  });

  // Create document
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        // Title
        new Paragraph({
          text: 'JAGESAURUS - INVIGILATION SCHEDULE',
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: {
            after: 400,
            before: 400
          }
        }),

        // Subtitle
        new Paragraph({
          text: 'Educator Assignment Schedule',
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
        ...Object.entries(sessionsByDate).map(([date, dateSessions]) => [
          // Date header
          new Paragraph({
            text: format(parseISO(date), 'EEEE, MMMM do, yyyy'),
            heading: HeadingLevel.HEADING_3,
            spacing: {
              after: 200,
              before: 400
            }
          }),

          // Table for sessions on this date
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
                    width: { size: 15, type: WidthType.PERCENTAGE },
                    shading: { fill: 'E6E6E6' }
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: 'Educator', alignment: AlignmentType.CENTER })],
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    shading: { fill: 'E6E6E6' }
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: 'Exam', alignment: AlignmentType.CENTER })],
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    shading: { fill: 'E6E6E6' }
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: 'Room', alignment: AlignmentType.CENTER })],
                    width: { size: 20, type: WidthType.PERCENTAGE },
                    shading: { fill: 'E6E6E6' }
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: 'Students', alignment: AlignmentType.CENTER })],
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    shading: { fill: 'E6E6E6' }
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: 'Main', alignment: AlignmentType.CENTER })],
                    width: { size: 5, type: WidthType.PERCENTAGE },
                    shading: { fill: 'E6E6E6' }
                  })
                ],
              }),
              // Data rows
              ...dateSessions
                .sort((a, b) => a.sessionStartTime.localeCompare(b.sessionStartTime))
                .map(session =>
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [new Paragraph({ text: `${session.sessionStartTime} - ${session.sessionEndTime}` })],
                      }),
                      new TableCell({
                        children: [new Paragraph({ text: session.educatorName })],
                      }),
                      new TableCell({
                        children: [new Paragraph({ text: session.examName })],
                      }),
                      new TableCell({
                        children: [new Paragraph({ text: session.roomName })],
                      }),
                      new TableCell({
                        children: [new Paragraph({ text: session.studentCount.toString() })],
                      }),
                      new TableCell({
                        children: [new Paragraph({ text: session.isMainInvigilator ? 'Yes' : 'No' })],
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
  link.download = `Jagesaurus-Invigilation-Schedule-${format(new Date(), 'yyyy-MM-dd')}.docx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const generateEducatorSchedulePDF = (sessions: InvigilationSession[]) => {
  if (sessions.length === 0) {
    alert('No invigilation sessions to export.');
    return;
  }

  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('JAGESAURUS - EDUCATOR INVIGILATION SCHEDULE', 105, 20, { align: 'center' });
  
  // Subtitle
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('Individual Educator Assignments', 105, 30, { align: 'center' });
  
  // Generated date
  doc.setFontSize(10);
  doc.text(`Generated on: ${format(new Date(), 'EEEE, MMMM do, yyyy')}`, 105, 40, { align: 'center' });
  
  // Group sessions by educator
  const sessionsByEducator: { [key: string]: InvigilationSession[] } = {};
  sessions.forEach(session => {
    if (!sessionsByEducator[session.educatorName]) {
      sessionsByEducator[session.educatorName] = [];
    }
    sessionsByEducator[session.educatorName].push(session);
  });
  
  let yPosition = 60;
  
  // Create table for each educator
  Object.entries(sessionsByEducator).forEach(([educatorName, educatorSessions]) => {
    // Educator header
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Educator: ${educatorName}`, 20, yPosition);
    yPosition += 10;
    
    // Prepare table data
    const tableData = educatorSessions
      .sort((a, b) => {
        const dateCompare = a.examDate.localeCompare(b.examDate);
        return dateCompare !== 0 ? dateCompare : a.sessionStartTime.localeCompare(b.sessionStartTime);
      })
      .map(session => [
        session.examDate,
        `${session.sessionStartTime} - ${session.sessionEndTime}`,
        session.examName,
        session.roomName,
        session.studentCount.toString(),
        session.isMainInvigilator ? 'Yes' : 'No'
      ]);
    
    // Create table
    autoTable(doc, {
      head: [['Date', 'Time', 'Exam', 'Room', 'Students', 'Main']],
      body: tableData,
      startY: yPosition,
      styles: {
        fontSize: 8,
        cellPadding: 2
      },
      headStyles: {
        fillColor: [16, 185, 129],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      }
    });
    
    yPosition = (doc as any).lastAutoTable.finalY + 15;
    
    // Add new page if needed
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }
  });
  
  // Save the PDF
  doc.save(`Jagesaurus-Educator-Schedule-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
};

export const generateEducatorScheduleWord = async (sessions: InvigilationSession[]) => {
  if (sessions.length === 0) {
    alert('No invigilation sessions to export.');
    return;
  }

  // Group sessions by educator
  const sessionsByEducator: { [key: string]: InvigilationSession[] } = {};
  sessions.forEach(session => {
    if (!sessionsByEducator[session.educatorName]) {
      sessionsByEducator[session.educatorName] = [];
    }
    sessionsByEducator[session.educatorName].push(session);
  });

  // Create document
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        // Title
        new Paragraph({
          text: 'JAGESAURUS - EDUCATOR INVIGILATION SCHEDULE',
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: {
            after: 400,
            before: 400
          }
        }),

        // Subtitle
        new Paragraph({
          text: 'Individual Educator Assignments',
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

        // Table for each educator
        ...Object.entries(sessionsByEducator).map(([educatorName, educatorSessions]) => [
          // Educator header
          new Paragraph({
            text: `Educator: ${educatorName}`,
            heading: HeadingLevel.HEADING_3,
            spacing: {
              after: 200,
              before: 400
            }
          }),

          // Table for sessions for this educator
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
                    children: [new Paragraph({ text: 'Exam', alignment: AlignmentType.CENTER })],
                    width: { size: 25, type: WidthType.PERCENTAGE },
                    shading: { fill: 'E6E6E6' }
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: 'Room', alignment: AlignmentType.CENTER })],
                    width: { size: 20, type: WidthType.PERCENTAGE },
                    shading: { fill: 'E6E6E6' }
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: 'Students', alignment: AlignmentType.CENTER })],
                    width: { size: 10, type: WidthType.PERCENTAGE },
                    shading: { fill: 'E6E6E6' }
                  }),
                  new TableCell({
                    children: [new Paragraph({ text: 'Main', alignment: AlignmentType.CENTER })],
                    width: { size: 5, type: WidthType.PERCENTAGE },
                    shading: { fill: 'E6E6E6' }
                  })
                ],
              }),
              // Data rows
              ...educatorSessions
                .sort((a, b) => {
                  const dateCompare = a.examDate.localeCompare(b.examDate);
                  return dateCompare !== 0 ? dateCompare : a.sessionStartTime.localeCompare(b.sessionStartTime);
                })
                .map(session =>
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [new Paragraph({ text: format(parseISO(session.examDate), 'MMM dd, yyyy') })],
                      }),
                      new TableCell({
                        children: [new Paragraph({ text: `${session.sessionStartTime} - ${session.sessionEndTime}` })],
                      }),
                      new TableCell({
                        children: [new Paragraph({ text: session.examName })],
                      }),
                      new TableCell({
                        children: [new Paragraph({ text: session.roomName })],
                      }),
                      new TableCell({
                        children: [new Paragraph({ text: session.studentCount.toString() })],
                      }),
                      new TableCell({
                        children: [new Paragraph({ text: session.isMainInvigilator ? 'Yes' : 'No' })],
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
  link.download = `Jagesaurus-Educator-Schedule-${format(new Date(), 'yyyy-MM-dd')}.docx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
