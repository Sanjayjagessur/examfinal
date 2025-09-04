import React, { useState, useMemo, useEffect } from 'react';
import { ExamCard } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { 
  Users, 
  Calendar, 
  Upload, 
  Plus,
  Trash2,
  FileText,
  Download
} from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

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

interface InvigilationSchemeProps {
  examCards: ExamCard[];
  onUpdateEducators?: (educators: Educator[]) => void;
  onUpdateRooms?: (rooms: Room[]) => void;
  onUpdateExamSessions?: (sessions: ExamSession[]) => void;
  onUpdateRoomSessions?: (sessions: RoomSession[]) => void;
  // Add props to receive data from parent
  educators?: Educator[];
  rooms?: Room[];
  examSessions?: ExamSession[];
  roomSessions?: RoomSession[];
}

const InvigilationScheme: React.FC<InvigilationSchemeProps> = ({ 
  examCards, 
  onUpdateEducators, 
  onUpdateRooms, 
  onUpdateExamSessions, 
  onUpdateRoomSessions,
  educators: parentEducators,
  rooms: parentRooms,
  examSessions: parentExamSessions,
  roomSessions: parentRoomSessions
}) => {
  const [educators, setEducators] = useState<Educator[]>(() => {
    const saved = localStorage.getItem('invigilation_educators');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [rooms, setRooms] = useState<Room[]>(() => {
    const saved = localStorage.getItem('invigilation_rooms');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [examSessions, setExamSessions] = useState<ExamSession[]>([]);
  const [roomSessions, setRoomSessions] = useState<RoomSession[]>([]);

  // Use parent data when available, otherwise use local state
  const currentEducators = parentEducators || educators;
  const currentRooms = parentRooms || rooms;
  const currentExamSessions = parentExamSessions || examSessions;
  const currentRoomSessions = parentRoomSessions || roomSessions;
  const [activeTab, setActiveTab] = useState<'setup' | 'planning' | 'allocation' | 'overview'>('setup');
  
  // Manual creation form states

  // Only notify parent when there are actual changes (not on initial load)
  useEffect(() => {
    if (examSessions.length > 0) {
      onUpdateExamSessions?.(examSessions);
    }
  }, [examSessions, onUpdateExamSessions]);

  useEffect(() => {
    if (roomSessions.length > 0) {
      onUpdateRoomSessions?.(roomSessions);
    }
  }, [roomSessions, onUpdateRoomSessions]);

  // Save educators to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('invigilation_educators', JSON.stringify(educators));
    onUpdateEducators?.(educators);
  }, [educators, onUpdateEducators]);

  // Save rooms to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('invigilation_rooms', JSON.stringify(rooms));
    onUpdateRooms?.(rooms);
  }, [rooms, onUpdateRooms]);

  // Get scheduled exams from the timetable
  const scheduledExams = useMemo(() => {
    return examCards.filter(exam => exam.date && exam.startTime && exam.endTime);
  }, [examCards]);

  // Use current data for all operations - prioritize local state if it has data
  const workingEducators = educators.length > 0 ? educators : currentEducators;
  const workingRooms = rooms.length > 0 ? rooms : currentRooms;
  const workingExamSessions = currentExamSessions;
  const workingRoomSessions = currentRoomSessions;

  // Debug logging
  console.log('State Debug:', {
    localEducators: educators.length,
    localRooms: rooms.length,
    currentEducators: currentEducators.length,
    currentRooms: currentRooms.length,
    workingEducators: workingEducators.length,
    workingRooms: workingRooms.length
  });

  // Sync parent data to local state when parent data changes
  useEffect(() => {
    if (parentEducators && parentEducators.length > 0) {
      setEducators(parentEducators);
    }
  }, [parentEducators]);

  useEffect(() => {
    if (parentRooms && parentRooms.length > 0) {
      setRooms(parentRooms);
    }
  }, [parentRooms]);

  useEffect(() => {
    if (parentExamSessions && examSessions.length === 0) {
      setExamSessions(parentExamSessions);
    }
  }, [parentExamSessions, examSessions.length]);

  useEffect(() => {
    if (parentRoomSessions && roomSessions.length === 0) {
      setRoomSessions(parentRoomSessions);
    }
  }, [parentRoomSessions, roomSessions.length]);

  // Helper function to parse both CSV and Excel files
  const parseFileData = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const fileName = file.name.toLowerCase();
      
      if (fileName.endsWith('.csv')) {
        // Handle CSV files
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.errors.length > 0) {
              reject(new Error(`CSV parsing errors: ${results.errors.map(e => e.message).join(', ')}`));
              return;
            }
            resolve(results.data);
          },
          error: (error) => {
            reject(new Error(`CSV parsing error: ${error.message}`));
          }
        });
      } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        // Handle Excel files
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            if (jsonData.length < 2) {
              reject(new Error('Excel file appears to be empty or has no data rows.'));
              return;
            }
            
            // Convert to object format with headers
            const headers = jsonData[0] as string[];
            const rows = jsonData.slice(1) as any[][];
            const result = rows.map(row => {
              const obj: any = {};
              headers.forEach((header, index) => {
                obj[header] = row[index];
              });
              return obj;
            });
            
            resolve(result);
          } catch (error) {
            reject(new Error(`Excel parsing error: ${error}`));
          }
        };
        reader.onerror = () => {
          reject(new Error('Error reading Excel file.'));
        };
        reader.readAsArrayBuffer(file);
      } else {
        reject(new Error('Unsupported file format. Please use CSV, XLSX, or XLS files.'));
      }
    });
  };

  // Handle educator upload
  const handleEducatorUpload = async (file: File) => {
    console.log('Starting educator file upload:', file.name);
    
    try {
      const data = await parseFileData(file);
      console.log('Parsed file data:', data);
      
      if (!data || data.length === 0) {
        alert('File appears to be empty or has no valid data.');
        return;
      }
      
      const newEducators: Educator[] = data
        .filter((row: any) => {
          // Check if row exists and has a name field
          const hasName = row && (row.name || row.Name || row.NAME || row['name']);
          console.log('Row:', row, 'Has name:', hasName);
          return hasName;
        })
        .map((row: any, index: number) => {
          const name = row.name || row.Name || row.NAME || row['name'] || `Educator ${index + 1}`;
          console.log('Creating educator:', name);
          return {
            id: uuidv4(),
            name: name.trim()
          };
        });
      
      console.log('Parsed educators:', newEducators);
      
      if (newEducators.length === 0) {
        alert('No valid educators found in file. Please check that the file has a "name" column.');
        return;
      }
      
      setEducators(prev => {
        const updated = [...prev, ...newEducators];
        localStorage.setItem('invigilation_educators', JSON.stringify(updated));
        return updated;
      });
      alert(`Successfully imported ${newEducators.length} educators from ${file.name}!`);
    } catch (error) {
      console.error('File parsing error:', error);
      alert(`Error importing file: ${error}`);
    }
  };

  // Handle room upload
  const handleRoomUpload = async (file: File) => {
    console.log('Starting room file upload:', file.name);
    
    try {
      const data = await parseFileData(file);
      console.log('Parsed file data:', data);
      
      if (!data || data.length === 0) {
        alert('File appears to be empty or has no valid data.');
        return;
      }
      
      const newRooms: Room[] = data
        .filter((row: any) => {
          // Check if row exists and has a name field
          const hasName = row && (row.name || row.Name || row.NAME || row['name']);
          console.log('Row:', row, 'Has name:', hasName);
          return hasName;
        })
        .map((row: any, index: number) => {
          const name = row.name || row.Name || row.NAME || row['name'] || `Room ${index + 1}`;
          const capacity = parseInt(row.capacity || row.Capacity || row.CAPACITY || row['capacity'] || '30');
          console.log('Creating room:', name, 'Capacity:', capacity);
          return {
            id: uuidv4(),
            name: name.trim(),
            capacity: isNaN(capacity) ? 30 : capacity
          };
        });
      
      console.log('Parsed rooms:', newRooms);
      
      if (newRooms.length === 0) {
        alert('No valid rooms found in file. Please check that the file has "name" and "capacity" columns.');
        return;
      }
      
      setRooms(prev => {
        const updated = [...prev, ...newRooms];
        localStorage.setItem('invigilation_rooms', JSON.stringify(updated));
        return updated;
      });
      alert(`Successfully imported ${newRooms.length} rooms from ${file.name}!`);
    } catch (error) {
      console.error('File parsing error:', error);
      alert(`Error importing file: ${error}`);
    }
  };


  // Clear all data function
  const handleClearAllData = () => {
    if (window.confirm('Are you sure you want to clear ALL invigilation data? This will remove all educators, rooms, exam sessions, and room sessions. This action cannot be undone.')) {
      // Clear all local state
      setEducators([]);
      setRooms([]);
      setExamSessions([]);
      setRoomSessions([]);
      
      // Clear localStorage
      localStorage.removeItem('invigilation_educators');
      localStorage.removeItem('invigilation_rooms');
      
      // Notify parent components to clear their data
      onUpdateEducators?.([]);
      onUpdateRooms?.([]);
      onUpdateExamSessions?.([]);
      onUpdateRoomSessions?.([]);
      
      alert('All invigilation data has been cleared successfully!');
    }
  };

  // Create 30-minute exam sessions
  const createExamSessions = (examId: string, roomsNeeded: number) => {
    const exam = scheduledExams.find(e => e.id === examId);
    if (!exam) return;

    // Calculate number of 30-minute sessions needed
    const totalMinutes = exam.duration;
    const numberOfSessions = Math.ceil(totalMinutes / 30);
    
    // Parse start time to calculate session times
    const [startHour, startMinute] = exam.startTime!.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(startHour, startMinute, 0, 0);

    const newSessions: ExamSession[] = [];
    for (let i = 1; i <= numberOfSessions; i++) {
      const sessionStart = new Date(startDate.getTime() + (i - 1) * 30 * 60000);
      const sessionEnd = new Date(sessionStart.getTime() + 30 * 60000);
      
      newSessions.push({
        id: uuidv4(),
        examId: exam.id,
        examName: exam.paperName,
        examDate: exam.date!,
        startTime: exam.startTime!,
        endTime: exam.endTime!,
        duration: exam.duration,
        sessionNumber: i,
        sessionStartTime: sessionStart.toTimeString().slice(0, 5),
        sessionEndTime: sessionEnd.toTimeString().slice(0, 5),
        roomsNeeded: roomsNeeded,
        assignedRooms: [],
        status: 'pending'
      });
    }
    
    setExamSessions(prev => [...prev, ...newSessions]);

    // Create room sessions for each exam session
    const newRoomSessions: RoomSession[] = [];
    newSessions.forEach(session => {
      for (let roomIndex = 0; roomIndex < roomsNeeded; roomIndex++) {
        newRoomSessions.push({
          id: uuidv4(),
          examSessionId: session.id,
          roomId: '', // Will be assigned later
          roomName: `Room ${roomIndex + 1}`,
          sessionNumber: session.sessionNumber,
          sessionStartTime: session.sessionStartTime,
          sessionEndTime: session.sessionEndTime,
          assignedInvigilator: null
        });
      }
    });
    
    setRoomSessions(prev => [...prev, ...newRoomSessions]);
  };

  // Get invigilator workload statistics
  const getInvigilatorWorkload = (educatorId: string) => {
    return workingRoomSessions.filter(session => 
      session.assignedInvigilator === educatorId
    ).length;
  };

  // Get available invigilators for a room session (not already assigned to overlapping sessions)
  const getAvailableInvigilators = (roomSessionId: string) => {
    const roomSession = workingRoomSessions.find(rs => rs.id === roomSessionId);
    if (!roomSession) return [];

    const examSession = workingExamSessions.find(es => es.id === roomSession.examSessionId);
    if (!examSession) return [];

    return workingEducators.filter(educator => {
      // Check if educator is already assigned to this room session
      if (roomSession.assignedInvigilator === educator.id) return false;
      
      // Check if educator is assigned to overlapping sessions on the same date
      const hasOverlap = workingRoomSessions.some(otherRoomSession => 
        otherRoomSession.id !== roomSessionId &&
        otherRoomSession.assignedInvigilator === educator.id &&
        workingExamSessions.some(es => 
          es.id === otherRoomSession.examSessionId &&
          es.examDate === examSession.examDate &&
          es.sessionNumber === roomSession.sessionNumber
        )
      );
      
      return !hasOverlap;
    });
  };

  // Assign invigilator to room session
  const assignInvigilator = (roomSessionId: string, educatorId: string) => {
    setRoomSessions(prev => prev.map(rs => 
      rs.id === roomSessionId 
        ? { ...rs, assignedInvigilator: educatorId }
        : rs
    ));
  };

  // Remove invigilator from room session
  const removeInvigilator = (roomSessionId: string) => {
    setRoomSessions(prev => prev.map(rs => 
      rs.id === roomSessionId 
        ? { ...rs, assignedInvigilator: null }
        : rs
    ));
  };

  // Assign room to exam session
  const assignRoom = (examSessionId: string, roomId: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (!room) return;

    setExamSessions(prev => prev.map(es => 
      es.id === examSessionId 
        ? { ...es, assignedRooms: [...es.assignedRooms, roomId] }
        : es
    ));

    // Update room sessions with the actual room name
    setRoomSessions(prev => prev.map(rs => 
      rs.examSessionId === examSessionId && rs.roomName.startsWith('Room ')
        ? { ...rs, roomId: roomId, roomName: room.name }
        : rs
    ));
  };

  // Remove room from exam session
  const removeRoom = (examSessionId: string, roomId: string) => {
    setExamSessions(prev => prev.map(es => 
      es.id === examSessionId 
        ? { ...es, assignedRooms: es.assignedRooms.filter(id => id !== roomId) }
        : es
    ));

    // Reset room sessions for this exam session
    setRoomSessions(prev => prev.map(rs => 
      rs.examSessionId === examSessionId
        ? { ...rs, roomId: '', roomName: `Room ${rs.roomName.split(' ')[1]}`, assignedInvigilator: null }
        : rs
    ));
  };

  // Get room sessions for a specific exam session
  const getRoomSessionsForExamSession = (examSessionId: string) => {
    return workingRoomSessions.filter(rs => rs.examSessionId === examSessionId);
  };

  // Generate daily invigilation schedule for Word export
  const generateDailyInvigilationSchedule = () => {
    if (roomSessions.length === 0) {
      alert('No invigilation sessions found. Please create and allocate sessions first.');
      return;
    }

    // Group room sessions by date
    const sessionsByDate: { [date: string]: RoomSession[] } = {};
    
    roomSessions.forEach(roomSession => {
      const examSession = examSessions.find(es => es.id === roomSession.examSessionId);
      if (examSession && roomSession.assignedInvigilator) {
        const date = examSession.examDate;
        if (!sessionsByDate[date]) {
          sessionsByDate[date] = [];
        }
        sessionsByDate[date].push(roomSession);
      }
    });

    // Sort dates
    const sortedDates = Object.keys(sessionsByDate).sort();

    // Create Word document content
    let wordContent = `
      <html>
        <head>
          <meta charset="utf-8">
          <title>Daily Invigilation Schedule</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .date-section { margin-bottom: 30px; page-break-inside: avoid; }
            .date-title { background-color: #f0f0f0; padding: 10px; font-size: 18px; font-weight: bold; margin-bottom: 15px; }
            .session-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .session-table th, .session-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .session-table th { background-color: #f8f9fa; font-weight: bold; }
            .time-cell { font-weight: bold; color: #2c5aa0; }
            .room-cell { font-weight: bold; color: #28a745; }
            .invigilator-cell { font-weight: bold; color: #dc3545; }
            .signature-section { margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px; }
            .signature-line { border-top: 1px solid #000; margin-top: 25px; width: 200px; display: inline-block; }
            .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Daily Invigilation Schedule</h1>
            <p>Generated on: ${new Date().toLocaleDateString()}</p>
          </div>
    `;

    sortedDates.forEach(date => {
      const sessionsForDate = sessionsByDate[date];
      
      // Group by invigilator for this date
      const invigilatorSessions: { [invigilatorId: string]: RoomSession[] } = {};
      sessionsForDate.forEach(session => {
        if (session.assignedInvigilator) {
          if (!invigilatorSessions[session.assignedInvigilator]) {
            invigilatorSessions[session.assignedInvigilator] = [];
          }
          invigilatorSessions[session.assignedInvigilator].push(session);
        }
      });

      wordContent += `
        <div class="date-section">
          <div class="date-title">Date: ${date}</div>
      `;

      // Create table for this date
      wordContent += `
        <div style="margin-bottom: 20px;">
          <h4 style="color: #495057; margin-bottom: 10px;">📋 Complete Session Schedule for ${date}</h4>
          <table class="session-table" style="width: 100%; border-collapse: collapse; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <thead>
              <tr style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
                <th style="padding: 12px 8px; border: 1px solid #ddd; text-align: left; font-weight: bold;">⏰ Time</th>
                <th style="padding: 12px 8px; border: 1px solid #ddd; text-align: left; font-weight: bold;">📚 Exam</th>
                <th style="padding: 12px 8px; border: 1px solid #ddd; text-align: left; font-weight: bold;">🔄 Session</th>
                <th style="padding: 12px 8px; border: 1px solid #ddd; text-align: left; font-weight: bold;">🏠 Room</th>
                <th style="padding: 12px 8px; border: 1px solid #ddd; text-align: left; font-weight: bold;">👤 Invigilator</th>
                <th style="padding: 12px 8px; border: 1px solid #ddd; text-align: left; font-weight: bold;">✍️ Signature</th>
              </tr>
            </thead>
            <tbody>
      `;

      // Sort sessions by time
      sessionsForDate.sort((a, b) => a.sessionStartTime.localeCompare(b.sessionStartTime));

      sessionsForDate.forEach((session, index) => {
        const examSession = examSessions.find(es => es.id === session.examSessionId);
        const educator = educators.find(e => e.id === session.assignedInvigilator);
        const rowColor = index % 2 === 0 ? '#ffffff' : '#f8f9fa';
        
        wordContent += `
          <tr style="background-color: ${rowColor};">
            <td style="padding: 10px 8px; border: 1px solid #ddd; font-weight: bold; color: #2c5aa0; background-color: #e3f2fd;">
              <strong>${session.sessionStartTime} - ${session.sessionEndTime}</strong>
            </td>
            <td style="padding: 10px 8px; border: 1px solid #ddd; color: #495057;">
              <strong>${examSession?.examName || 'Unknown'}</strong>
            </td>
            <td style="padding: 10px 8px; border: 1px solid #ddd; color: #6c757d; text-align: center;">
              Session ${session.sessionNumber}
            </td>
            <td style="padding: 10px 8px; border: 1px solid #ddd; font-weight: bold; color: #28a745; background-color: #d4edda;">
              <strong>📍 ${session.roomName}</strong>
            </td>
            <td style="padding: 10px 8px; border: 1px solid #ddd; font-weight: bold; color: #dc3545; background-color: #f8d7da;">
              <strong>👤 ${educator?.name || 'Unassigned'}</strong>
            </td>
            <td style="padding: 10px 8px; border: 1px solid #ddd; text-align: center;">
              <div style="border-top: 2px solid #000; margin-top: 15px; width: 80px; display: inline-block;"></div>
            </td>
          </tr>
        `;
      });

      wordContent += `
          </tbody>
        </table>
      `;

      // Add detailed room-by-room breakdown for this date
      wordContent += `
        <div style="margin-top: 20px;">
          <h4>Detailed Room Assignment Breakdown for ${date}:</h4>
          <div style="margin-bottom: 15px;">
      `;

      // Group sessions by room for this date
      const roomSessionsForDate: { [roomName: string]: RoomSession[] } = {};
      sessionsForDate.forEach(session => {
        if (!roomSessionsForDate[session.roomName]) {
          roomSessionsForDate[session.roomName] = [];
        }
        roomSessionsForDate[session.roomName].push(session);
      });

      // Display room-by-room breakdown
      Object.entries(roomSessionsForDate).forEach(([roomName, sessions]) => {
        wordContent += `
          <div style="margin-bottom: 10px; padding: 10px; background-color: #f8f9fa; border-left: 4px solid #007bff; border-radius: 4px;">
            <h5 style="margin: 0 0 8px 0; color: #007bff; font-size: 14px;"><strong>📍 ${roomName}</strong></h5>
        `;

        // Sort sessions by time for this room
        sessions.sort((a, b) => a.sessionStartTime.localeCompare(b.sessionStartTime));

        sessions.forEach(session => {
          const examSession = examSessions.find(es => es.id === session.examSessionId);
          const educator = educators.find(e => e.id === session.assignedInvigilator);
          
          wordContent += `
            <div style="margin-bottom: 5px; padding: 5px; background-color: white; border-radius: 3px;">
              <span style="font-weight: bold; color: #2c5aa0;">🕐 ${session.sessionStartTime} - ${session.sessionEndTime}</span><br>
              <span style="color: #495057;"><strong>Exam:</strong> ${examSession?.examName || 'Unknown'} (Session ${session.sessionNumber})</span><br>
              <span style="color: #28a745; font-weight: bold;">👤 Invigilator: ${educator?.name || 'Unassigned'}</span>
            </div>
          `;
        });

        wordContent += `</div>`;
      });

      // Add invigilator summary for this date
      wordContent += `
        </div>
        <div style="margin-top: 20px;">
          <h4>👥 Invigilator Summary for ${date}:</h4>
          <ul style="list-style-type: none; padding-left: 0;">
      `;

      Object.entries(invigilatorSessions).forEach(([invigilatorId, sessions]) => {
        const educator = educators.find(e => e.id === invigilatorId);
        const totalSessions = sessions.length;
        
        wordContent += `
          <li style="margin-bottom: 10px; padding: 10px; background-color: #e3f2fd; border-radius: 4px;">
            <strong style="color: #1976d2;">${educator?.name}</strong> - <span style="color: #388e3c; font-weight: bold;">${totalSessions} session(s)</span>
            <div style="margin-top: 5px; font-size: 12px; color: #666;">
        `;

        // Sort sessions by time for this invigilator
        sessions.sort((a, b) => a.sessionStartTime.localeCompare(b.sessionStartTime));

        sessions.forEach(session => {
          const examSession = examSessions.find(es => es.id === session.examSessionId);
          wordContent += `
            • ${examSession?.examName} (${session.sessionStartTime}-${session.sessionEndTime}) in <strong>${session.roomName}</strong><br>
          `;
        });

        wordContent += `
            </div>
          </li>
        `;
      });

      wordContent += `
          </ul>
        </div>
      `;

      wordContent += `</div>`;
    });

    wordContent += `
          <div class="signature-section">
            <h3>Invigilator Signatures</h3>
            <p>Please sign below to confirm you have received and understood your invigilation schedule:</p>
            <div style="margin-top: 20px;">
    `;

    // Add signature lines for all educators
    educators.forEach(educator => {
      const hasAssignments = roomSessions.some(rs => rs.assignedInvigilator === educator.id);
      if (hasAssignments) {
        wordContent += `
          <div style="margin-bottom: 15px;">
            <strong>${educator.name}</strong><br>
            <span class="signature-line"></span>
            <span style="margin-left: 10px;">Date: _____________</span>
          </div>
        `;
      }
    });

    wordContent += `
            </div>
          </div>
          <div class="footer">
            <p>This schedule is generated automatically. Please report any discrepancies to the examination office.</p>
            <p>Generated by Jagesaurus Invigilation System</p>
          </div>
        </body>
      </html>
    `;

    // Create and download the Word document
    const blob = new Blob([wordContent], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Invigilation_Schedule_${new Date().toISOString().split('T')[0]}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">Invigilation Scheme</h1>
        <p className="text-gray-600 mt-1">Plan and allocate invigilators to 30-minute exam sessions per room</p>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          <button
            onClick={() => setActiveTab('setup')}
            className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'setup'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Upload size={16} />
            <span>Setup</span>
          </button>
          <button
            onClick={() => setActiveTab('planning')}
            className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'planning'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Calendar size={16} />
            <span>Planning</span>
          </button>
          <button
            onClick={() => setActiveTab('allocation')}
            className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'allocation'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Users size={16} />
            <span>Allocation</span>
          </button>
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FileText size={16} />
            <span>Overview</span>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'setup' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Setup Invigilation Resources</h2>
              
              {/* Clear All Data Button */}
              {(workingEducators.length > 0 || workingRooms.length > 0 || workingExamSessions.length > 0 || workingRoomSessions.length > 0) && (
                <button
                  onClick={handleClearAllData}
                  className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
                  title="Clear all imported data and start fresh"
                >
                  <Trash2 size={16} />
                  <span>Clear All Data</span>
                </button>
              )}
            </div>
            
            {/* Educators Upload */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Educators</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload CSV or Excel file with educator names
                  </label>
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={(e) => e.target.files?.[0] && handleEducatorUpload(e.target.files[0])}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
                <p className="text-sm text-gray-600">
                  File should have a column named "name" with educator names. Supports CSV, XLSX, and XLS formats.
                </p>
              </div>
              
                             {/* Educators List */}
               {workingEducators.length > 0 && (
                 <div className="mt-6">
                   <h4 className="text-md font-medium text-gray-900 mb-3">Current Educators ({workingEducators.length})</h4>
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                     {workingEducators.map((educator) => (
                      <div key={educator.id} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md">
                        <span className="text-sm text-gray-700">{educator.name}</span>
                        <button
                          onClick={() => setEducators(prev => prev.filter(e => e.id !== educator.id))}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>


            {/* Rooms Upload */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Upload Rooms</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload CSV or Excel file with room information
                  </label>
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={(e) => e.target.files?.[0] && handleRoomUpload(e.target.files[0])}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>
                <p className="text-sm text-gray-600">
                  File should have columns: "name" and "capacity". Supports CSV, XLSX, and XLS formats.
                </p>
              </div>
              
                             {/* Rooms List */}
               {workingRooms.length > 0 && (
                 <div className="mt-6">
                   <h4 className="text-md font-medium text-gray-900 mb-3">Current Rooms ({workingRooms.length})</h4>
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                     {workingRooms.map((room) => (
                      <div key={room.id} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md">
                        <div>
                          <span className="text-sm font-medium text-gray-700">{room.name}</span>
                          <span className="text-xs text-gray-500 ml-2">({room.capacity})</span>
                        </div>
                        <button
                          onClick={() => setRooms(prev => prev.filter(r => r.id !== room.id))}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {activeTab === 'planning' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Plan Exam Sessions (30-minute breakdown)</h2>
            
            {scheduledExams.length === 0 ? (
              <div className="bg-white p-6 rounded-lg border border-gray-200">
                <p className="text-gray-500">No scheduled exams found. Please schedule some exams in the timetable first.</p>
              </div>
            ) : (
              <div className="space-y-4">
                                 {scheduledExams.map((exam) => {
                   const examSessionsForThisExam = workingExamSessions.filter(es => es.examId === exam.id);
                  const numberOfSessions = Math.ceil(exam.duration / 30);
                  
                  return (
                    <div key={exam.id} className="bg-white p-6 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">{exam.paperName}</h3>
                          <p className="text-sm text-gray-600">{exam.paperNumber} • {exam.className}</p>
                          <p className="text-sm text-gray-600">{exam.date} • {exam.startTime} - {exam.endTime} • {exam.duration} min</p>
                          <p className="text-sm text-blue-600 font-medium">
                            Will create {numberOfSessions} sessions of 30 minutes each
                          </p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Rooms Needed</label>
                            <input
                              type="number"
                              min="1"
                              max="20"
                              className="w-20 px-3 py-2 border border-gray-300 rounded-md text-center"
                              placeholder="1"
                              onChange={(e) => {
                                const rooms = parseInt(e.target.value) || 1;
                                createExamSessions(exam.id, rooms);
                              }}
                            />
                          </div>
                          <button
                            onClick={() => {
                              const rooms = Math.ceil(exam.studentCount / 30);
                              createExamSessions(exam.id, rooms);
                            }}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2"
                          >
                            <Plus size={16} />
                            <span>Create Sessions</span>
                          </button>
                        </div>
                      </div>

                      {/* Show created sessions for this exam */}
                      {examSessionsForThisExam.length > 0 && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-md">
                          <h4 className="text-md font-medium text-gray-900 mb-3">Created Sessions:</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {examSessionsForThisExam.map((session) => (
                              <div key={session.id} className="text-sm bg-white p-2 rounded border">
                                <div className="font-medium">Session {session.sessionNumber}</div>
                                <div className="text-gray-600">{session.sessionStartTime} - {session.sessionEndTime}</div>
                                <div className="text-xs text-gray-500">{session.roomsNeeded} rooms</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* All Created Sessions Summary */}
            {workingExamSessions.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">All Created Sessions ({workingExamSessions.length})</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rooms</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {workingExamSessions.map((session) => (
                        <tr key={session.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{session.examName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Session {session.sessionNumber}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{session.sessionStartTime} - {session.sessionEndTime}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{session.roomsNeeded}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              session.assignedRooms.length === session.roomsNeeded ? 'bg-green-100 text-green-800' :
                              session.assignedRooms.length > 0 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {session.assignedRooms.length === session.roomsNeeded ? 'Rooms Assigned' :
                               session.assignedRooms.length > 0 ? 'Partially Assigned' :
                               'Pending'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'allocation' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Allocate Invigilators to Room Sessions</h2>
            
                         {workingExamSessions.length === 0 ? (
               <div className="bg-white p-6 rounded-lg border border-gray-200">
                 <p className="text-gray-500">No exam sessions created. Please create sessions in the Planning tab first.</p>
               </div>
             ) : (
               <div className="space-y-6">
                 {workingExamSessions.map((examSession) => {
                  const roomSessionsForThisExam = getRoomSessionsForExamSession(examSession.id);
                  const assignedRooms = examSession.assignedRooms;
                  
                  return (
                    <div key={examSession.id} className="bg-white p-6 rounded-lg border border-gray-200">
                      <div className="mb-4">
                        <h3 className="text-lg font-medium text-gray-900">
                          {examSession.examName} - Session {examSession.sessionNumber}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {examSession.examDate} • {examSession.sessionStartTime} - {examSession.sessionEndTime}
                        </p>
                      </div>

                      {/* Room Assignment */}
                      <div className="mb-6">
                        <h4 className="text-md font-medium text-gray-900 mb-3">Assign Rooms</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {Array.from({ length: examSession.roomsNeeded }, (_, index) => {
                            const isAssigned = assignedRooms.length > index;
                            const assignedRoomId = assignedRooms[index];
                            const assignedRoom = rooms.find(r => r.id === assignedRoomId);
                            
                            return (
                              <div key={index} className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                  Room {index + 1}:
                                </label>
                                {isAssigned ? (
                                  <div className="flex items-center justify-between bg-green-50 p-2 rounded-md border border-green-200">
                                    <span className="text-sm text-green-800">{assignedRoom?.name}</span>
                                    <button
                                      onClick={() => removeRoom(examSession.id, assignedRoomId)}
                                      className="text-red-600 hover:text-red-900"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                ) : (
                                                                     <select
                                     className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                     onChange={(e) => {
                                       if (e.target.value) {
                                         assignRoom(examSession.id, e.target.value);
                                       }
                                     }}
                                   >
                                     <option value="">Select a room</option>
                                     {workingRooms.map(room => (
                                       <option key={room.id} value={room.id}>
                                         {room.name} (Capacity: {room.capacity})
                                       </option>
                                     ))}
                                   </select>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Invigilator Allocation for Room Sessions */}
                      {assignedRooms.length > 0 && (
                        <div>
                          <h4 className="text-md font-medium text-gray-900 mb-3">Allocate Invigilators to Room Sessions</h4>
                          <div className="space-y-4">
                            {roomSessionsForThisExam.map((roomSession) => {
                              const room = rooms.find(r => r.id === roomSession.roomId);
                              if (!room) return null;

                              return (
                                <div key={roomSession.id} className="flex items-center justify-between bg-gray-50 p-4 rounded-md">
                                  <div className="flex items-center space-x-4">
                                    <div className="text-sm font-medium text-gray-900">{room.name}</div>
                                    <div className="text-sm text-gray-600">
                                      Session {roomSession.sessionNumber}: {roomSession.sessionStartTime} - {roomSession.sessionEndTime}
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center space-x-3">
                                    {roomSession.assignedInvigilator ? (
                                      <>
                                        <span className="text-sm text-green-600 font-medium">
                                          {educators.find(e => e.id === roomSession.assignedInvigilator)?.name}
                                        </span>
                                        <button
                                          onClick={() => removeInvigilator(roomSession.id)}
                                          className="text-red-600 hover:text-red-900"
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      </>
                                    ) : (
                                      <select
                                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                                        onChange={(e) => {
                                          if (e.target.value) {
                                            assignInvigilator(roomSession.id, e.target.value);
                                          }
                                        }}
                                      >
                                        <option value="">Select invigilator</option>
                                        {getAvailableInvigilators(roomSession.id).map(educator => (
                                          <option key={educator.id} value={educator.id}>
                                            {educator.name} (Workload: {getInvigilatorWorkload(educator.id)})
                                          </option>
                                        ))}
                                      </select>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Invigilation Overview</h2>
            
                         <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
               <div className="bg-white p-6 rounded-lg border border-gray-200">
                 <h3 className="text-lg font-medium text-gray-900 mb-2">Total Educators</h3>
                 <p className="text-3xl font-bold text-blue-600">{workingEducators.length}</p>
               </div>
               <div className="bg-white p-6 rounded-lg border border-gray-200">
                 <h3 className="text-lg font-medium text-gray-900 mb-2">Total Rooms</h3>
                 <p className="text-3xl font-bold text-green-600">{workingRooms.length}</p>
               </div>
               <div className="bg-white p-6 rounded-lg border border-gray-200">
                 <h3 className="text-lg font-medium text-gray-900 mb-2">Total Sessions</h3>
                 <p className="text-3xl font-bold text-purple-600">{workingExamSessions.length}</p>
               </div>
               <div className="bg-white p-6 rounded-lg border border-gray-200">
                 <h3 className="text-lg font-medium text-gray-900 mb-2">Room Sessions</h3>
                 <p className="text-3xl font-bold text-orange-600">{workingRoomSessions.length}</p>
               </div>
             </div>

            {/* Export Button */}
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Export Daily Invigilation Schedule</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Generate a Word document with daily schedules for all invigilators
                  </p>
                </div>
                                 <button
                   onClick={generateDailyInvigilationSchedule}
                   disabled={workingRoomSessions.length === 0}
                   className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
                 >
                  <Download size={16} />
                  <span>Export to Word</span>
                </button>
              </div>
            </div>

            {/* Educator Workload */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Educator Workload Distribution</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Educator</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sessions Assigned</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                                     <tbody className="bg-white divide-y divide-gray-200">
                     {workingEducators.map((educator) => {
                       const workload = getInvigilatorWorkload(educator.id);
                      return (
                        <tr key={educator.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{educator.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{workload}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              workload === 0 ? 'bg-red-100 text-red-800' :
                              workload <= 2 ? 'bg-green-100 text-green-800' :
                              workload <= 4 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {workload === 0 ? 'Unassigned' :
                               workload <= 2 ? 'Balanced' :
                               workload <= 4 ? 'High' : 'Overloaded'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

                         {/* Room Session Summary */}
             {workingRoomSessions.length > 0 && (
               <div className="bg-white rounded-lg border border-gray-200">
                 <div className="px-6 py-4 border-b border-gray-200">
                   <h3 className="text-lg font-medium text-gray-900">Room Session Summary</h3>
                 </div>
                 <div className="overflow-x-auto">
                   <table className="min-w-full divide-y divide-gray-200">
                     <thead className="bg-gray-50">
                       <tr>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam</th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Session</th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invigilator</th>
                         <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                       </tr>
                     </thead>
                     <tbody className="bg-white divide-y divide-gray-200">
                       {workingRoomSessions.map((roomSession) => {
                         const examSession = workingExamSessions.find(es => es.id === roomSession.examSessionId);
                         const educator = workingEducators.find(e => e.id === roomSession.assignedInvigilator);
                        
                        return (
                          <tr key={roomSession.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {examSession?.examName || 'Unknown'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              Session {roomSession.sessionNumber}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {roomSession.roomName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {roomSession.sessionStartTime} - {roomSession.sessionEndTime}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {educator ? educator.name : 'Unassigned'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                roomSession.assignedInvigilator
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {roomSession.assignedInvigilator ? 'Assigned' : 'Pending'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InvigilationScheme;
